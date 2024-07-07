// Adapted from: https://github.dev/honojs/hono/blob/main/src/middleware/cors/index.ts
import type { Middleware, RequestEvent } from "keiro/types";

type GetOriginFunction = (
  origin: string,
  event: RequestEvent,
) => string | undefined | null | Promise<string | undefined | null>;

/**
 * Options for the cors middleware.
 */
export interface CorsOptions {
  /**
   * The value set on the `Access-Control-Allow-Origin`, this can be a string, an array or a function that return the valid origin.
   */
  origin: string | string[] | GetOriginFunction;

  /**
   * Http methods to set on `Access-Control-Allow-Methods`.
   */
  allowMethods?: string[];

  /**
   * Allowed headers to set on `Access-Control-Allow-Headers`.
   */
  allowHeaders?: string[];

  /**
   * Value to set on `Access-Control-Max-Age`.
   */
  maxAge?: number;

  /**
   * Whether if set the `Access-Control-Allow-Credentials` header.
   */
  credentials?: boolean;

  /**
   * Headers to expose with `Access-Control-Expose-Headers`.
   */
  exposeHeaders?: string[];
}

const defaultOptions: CorsOptions = {
  origin: "*",
  allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
  allowHeaders: [],
  exposeHeaders: [],
};

/**
 * Apply cors headers to the response.
 * @param options The cors options.
 */
export const cors = (options?: CorsOptions): Middleware => {
  const opts = {
    ...defaultOptions,
    ...options,
  };

  async function getAllowOrigin(reqOrigin: string, event: RequestEvent) {
    if (typeof opts.origin === "string") {
      return opts.origin;
    } else if (typeof opts.origin === "function") {
      const origin = await opts.origin(reqOrigin, event);
      return origin;
    } else {
      return opts.origin.includes(reqOrigin) ? reqOrigin : reqOrigin[0];
    }
  }

  return async (event, next) => {
    let response: Response;

    if (event.request.method !== "OPTIONS") {
      response = await next(event);
    } else {
      response = new Response(null, { status: 204 });
    }

    const responseHeaders = response.headers;
    const allowOrigin = await getAllowOrigin(event.url.origin || "", event);

    if (allowOrigin) {
      responseHeaders.set("Access-Control-Allow-Origin", allowOrigin);
    }

    // Suppose the server sends a response with an Access-Control-Allow-Origin value with an explicit origin (rather than the "*" wildcard).
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin
    if (opts.origin !== "*") {
      const existingVary = event.request.headers.get("Vary");

      if (existingVary) {
        responseHeaders.set("Vary", existingVary);
      } else {
        responseHeaders.set("Vary", "Origin");
      }
    }

    if (opts.credentials) {
      responseHeaders.set("Access-Control-Allow-Credentials", "true");
    }

    if (opts.exposeHeaders?.length) {
      responseHeaders.set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }

    if (event.request.method === "OPTIONS") {
      if (opts.maxAge != null) {
        responseHeaders.set("Access-Control-Max-Age", opts.maxAge.toString());
      }

      if (opts.allowMethods?.length) {
        responseHeaders.set("Access-Control-Allow-Methods", opts.allowMethods.join(","));
      }

      let allowHeaders = opts.allowHeaders;

      if (!allowHeaders?.length) {
        const requestHeaders = event.request.headers.get("Access-Control-Request-Headers");
        if (requestHeaders) {
          allowHeaders = requestHeaders.split(/\s*,\s*/);
        }
      }

      if (allowHeaders?.length) {
        responseHeaders.set("Access-Control-Allow-Headers", allowHeaders.join(","));
        responseHeaders.append("Vary", "Access-Control-Request-Headers");
      }

      responseHeaders.delete("Content-Length");
      responseHeaders.delete("Content-Type");
    }

    return response;
  };
};
