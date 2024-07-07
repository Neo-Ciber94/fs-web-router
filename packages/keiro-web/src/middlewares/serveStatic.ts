import fs from "node:fs";
import path from "node:path";
import { type Middleware } from "keiro/types";
import mimeTypes from "mime-types";
import { createReadableStream } from "../stream/createReadableStream";
import { compressResponse } from "./compress";

/**
 * Options for serving static files.
 */
export interface ServeStaticOptions {
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
   * Enable debug logs.
   *
   * @default false
   */
  debug?: boolean;
}

const CACHE_ONE_YEAR = "public, max-age=31536000";

/**
 * A middleware to serve static files.
 * @param options The middleware options.
 */
export const serveStatic = (options: ServeStaticOptions): Middleware => {
  const { dir, compress = true, debug = false, cacheControl, cwd = process.cwd() } = options;
  const dirPath = path.join(cwd, dir);

  if (!fs.existsSync(dirPath)) {
    throw new Error(`${dirPath} don't exists`);
  }

  if (debug) {
    console.log(`✅ Serving files from '${dir}'`);
  }

  return async (event, next) => {
    const resolvedPath = resolveFilePath(dirPath, event.url.pathname);

    // File not found
    if (resolvedPath == null) {
      return next(event);
    }

    const { filePath, pathname } = resolvedPath;
    const fileStream = createReadableStream(filePath);
    const mimeType = mimeTypes.lookup(filePath) || "binary/octet-stream";

    if (debug) {
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

    const response = new Response(fileStream, {
      headers: {
        ...headers,
      },
    });

    if (compress) {
      return compressResponse({
        requestHeaders: event.request.headers,
        response: response,
      });
    }

    return response;
  };
};

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
