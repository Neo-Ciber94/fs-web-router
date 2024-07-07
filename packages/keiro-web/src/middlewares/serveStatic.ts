import fs from "node:fs";
import path from "node:path";
import { type Middleware } from "keiro/types";
import mimeTypes from "mime-types";
import { createReadableStream } from "../stream/createReadableStream";

/**
 * Options for serving static files.
 */
export type ServeStaticOptions = {
  /**
   * Current working directory to serve static files.
   *
   * @default process.cwd();
   */
  cwd?: string;

  /**
   * Directory to serve the static files relative to the current working directory.
   */
  dir: string;

  /**
   * Cache-Control headers to apply to the static files. Use `false` to disable caching.
   *
   * @default "public, max-age=31536000"
   */
  cacheControl?: boolean | string;

  /**
   * Whether if compress the files. `gzip` and `deflate` are supported
   *
   * @default true
   */
  compress?: boolean;

  /**
   * Enable dev logs.
   *
   * @default false
   */
  dev?: boolean;
};

const CACHE_ONE_YEAR = "public, max-age=31536000";

/**
 * A middleware to serve static files.
 * @param options The middleware options.
 */
export const serveStatic = (options: ServeStaticOptions): Middleware => {
  const { dir, compress = true, dev = false, cacheControl, cwd = process.cwd() } = options;
  const dirPath = path.join(cwd, dir);

  if (!fs.existsSync(dirPath)) {
    throw new Error(`${dirPath} don't exists`);
  }

  if (dev) {
    console.log(`✅ Serving files from '${dir}'`);
  }

  return async (event, next) => {
    const resolvedPath = resolveFilePath(dirPath, event.url.pathname);

    if (resolvedPath == null) {
      return next(event);
    }

    const { filePath, pathname } = resolvedPath;
    const fileStream = createReadableStream(filePath);
    const mimeType = mimeTypes.lookup(filePath) || "binary/octet-stream";

    if (dev) {
      console.log(`📦 GET ${pathname}: ${mimeType} `);
    }

    function getCacheControlHeader() {
      if (cacheControl === false) {
        return undefined;
      }

      return typeof cacheControl === "string" ? cacheControl : CACHE_ONE_YEAR;
    }

    const cacheHeaders = getCacheControlHeader();

    const headers = {
      "Content-type": mimeType,
      ...(cacheHeaders ? { "Cache-Control": cacheHeaders } : {}),
    };

    if (compress) {
      const encodings = getAcceptedEncodings(event.request.headers);
      const anyEncoding = encodings.includes("*");
      const gzip = encodings.includes("gzip");
      const deflate = encodings.includes("deflate");
      const encodingFormat = anyEncoding || gzip ? "gzip" : deflate ? "deflate" : null;

      if (encodingFormat) {
        // brotli is not supported currently: https://github.com/whatwg/compression/issues/34
        // https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream
        const compressedStream = fileStream.pipeThrough(new CompressionStream(encodingFormat));

        return new Response(compressedStream, {
          headers: {
            ...headers,
            "Content-Encoding": encodingFormat,
          },
        });
      }
    }

    return new Response(fileStream, {
      headers: {
        ...headers,
      },
    });
  };
};

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding
function getAcceptedEncodings(headers: Headers) {
  const acceptEncoding = headers.get("Accept-Encoding");

  if (!acceptEncoding) {
    return [];
  }

  return acceptEncoding
    .split(",")
    .map((s) => s.trim())
    .map((s) => s.split(";")[0])
    .filter(Boolean);
}

function fileExists(filePath: string) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

type ResolvedFilePath = {
  pathname: string;
  filePath: string;
};

function resolveFilePath(dir: string, pathname: string): ResolvedFilePath | null {
  const filePath = path.join(dir, pathname);
  const isHtml = filePath.endsWith(".html");
  const isIndex = pathname === "/";

  if (!fileExists(filePath) && isHtml) {
    return null;
  }

  if (fileExists(filePath)) {
    return { filePath, pathname };
  }

  const htmlPathname = isIndex ? `/index.html` : `${pathname}.html`;
  return resolveFilePath(dir, htmlPathname);
}
