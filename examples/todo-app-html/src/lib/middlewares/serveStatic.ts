import fs from "node:fs";
import path from "node:path";
import { createReadableStream } from "@keiro-dev/utils";
import { type Middleware } from "keiro/types";

type ServeStaticOptions = {
  cwd?: string;
  dir: string;
  compress?: boolean;
};

export const serveStatic = (options: ServeStaticOptions): Middleware => {
  const { dir, compress = true, cwd = process.cwd() } = options;
  const dirPath = path.join(cwd, dir);

  if (!fs.existsSync(dirPath)) {
    throw new Error(`${dirPath} don't exists`);
  }

  console.log(`✅ Serving files from '${dir}'`);

  return async (event, next) => {
    const resolvedPath = resolveFilePath(dirPath, event.url.pathname);

    if (resolvedPath == null) {
      return next(event);
    }

    const { filePath, pathname } = resolvedPath;
    const stream = await createReadableStream(filePath);
    const mimeType = getMimeType(filePath);
    console.log(`📦 GET ${pathname}: ${mimeType} `);

    if (compress) {
      const encodings = getAcceptedEncodings(event.request.headers);
      const anyEncoding = encodings.includes("*");
      const gzip = encodings.includes("gzip");
      const deflate = encodings.includes("deflate");
      const encodingFormat = anyEncoding || gzip ? "gzip" : deflate ? "deflate" : null;

      if (encodingFormat) {
        // https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream
        const compressedStream = stream.pipeThrough(new CompressionStream(encodingFormat));

        return new Response(compressedStream, {
          headers: {
            "Content-type": mimeType,
            "Cache-Control": "public, max-age=31536000",
            "Content-Encoding": encodingFormat,
          },
        });
      }
    }

    return new Response(stream, {
      headers: {
        "content-type": mimeType,
        "cache-control": "public, max-age=31536000",
      },
    });
  };
};

const MIME_TYPES: { [key: string]: string } = {
  ".txt": "text/plain",
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

function getMimeType(fileName: string) {
  const ext = path.extname(fileName);
  return MIME_TYPES[ext] ?? "binary/octet-stream";
}

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
