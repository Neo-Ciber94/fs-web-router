import type { Middleware } from "keiro/types";

// brotli is not supported currently: https://github.com/whatwg/compression/issues/34
// https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream
const ENCODING_FORMATS = ["gzip", "deflate"] as const;

type CompressFormat = (typeof ENCODING_FORMATS)[number];

/**
 * Options for the compression stream.
 */
export interface CompressOptions {
  /**
   * Allowed formats to compress.
   */
  encodings?: CompressFormat[];
}

/**
 * A middleware that compress the responses.
 */
export const compress = (options?: CompressOptions): Middleware => {
  const { encodings = ENCODING_FORMATS } = options || {};

  return async (event, next) => {
    const response = await next(event);
    return compressResponse({
      requestHeaders: event.request.headers,
      response,
      ...encodings,
    });
  };
};

type CompressResponseOptions = {
  requestHeaders: Headers;
  response: Response;
  encodings?: CompressFormat[];
};

/**
 * @internal
 */
export function compressResponse(opts: CompressResponseOptions): Response {
  const { requestHeaders, response, encodings = ENCODING_FORMATS } = opts;

  const acceptEncoding = requestHeaders.get("Accept-Encoding");

  if (response.body == null || !acceptEncoding) {
    return response;
  }

  // We make a linear search, the first element in 'ENCODING_FORMATS' have priority our case is 'gzip'
  const acceptedEncodings = getRequestAcceptEncodings(acceptEncoding);
  const format = ENCODING_FORMATS.find((f) => acceptedEncodings.includes(f));

  if (!format || !encodings.includes(format)) {
    return response;
  }

  const compressionStream = new CompressionStream(format);
  const stream = response.body?.pipeThrough(compressionStream);
  return new Response(stream, response);
}

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding
function getRequestAcceptEncodings(acceptEncodingHeader: string) {
  if (!acceptEncodingHeader) {
    return [];
  }

  return acceptEncodingHeader
    .split(",")
    .map((s) => s.trim())
    .map((s) => s.split(";")[0])
    .filter(Boolean);
}
