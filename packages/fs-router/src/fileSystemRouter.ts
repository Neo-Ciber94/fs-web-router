import path from "path";
import { existsSync } from "fs";
import createFileSystemRouter from "./createFileSystemRouter";
import { MatchingPattern, nextJsPatternMatching } from "./matchingPattern";
import { MaybePromise, Middleware, RequestEvent } from "./types";
import url from "url";

export type FileSystemRouterOptions = {
  /**
   * Origin used for the request.
   *
   * @throws
   * If the origin cannot be determined.
   *
   * @default
   * process.env.ORIGIN
   */
  origin?: string;

  /**
   * The absolute path to the working directory.
   *
   * @default process.cwd()
   */
  cwd?: string;

  /**
   * The path where the routes are located, relative to the `cwd`.
   *
   * @default "src/routes/"
   */
  routesDir?: string;

  /**
   * The path of the middleware relative to the routesDir. Use `false` to disable middleware.
   */
  middleware?: string | false;

  /**
   * Defines the matching pattern used for the file system routing.
   *
   * Defaults to:
   * - dynamic: `[id]`
   * - catch-all: `[...params]`
   * - optional dynamic: `[[id]]`
   * - optional catch-all: `[[...params]]`
   */
  matchingPattern?: MatchingPattern;

  /**
   * A prefix to detect which files or directories should be ignored.
   *
   * @default "_"
   */
  ignorePrefix?: string;

  /**
   * A glob of files to ignore.
   */
  ignoreFiles?: string[];

  /**
   * Handle a 404 request.
   */
  onNotFound?: (event: RequestEvent) => MaybePromise<Response>;
};

const extensions = ["js", "jsx", "cjs", "mjs", "ts", "tsx", "cts", "mts"];

export function initializeFileSystemRouter(options?: FileSystemRouterOptions) {
  const {
    cwd = process.cwd(),
    origin = process.env.ORIGIN,
    ignorePrefix = "_",
    routesDir = "src/routes",
    ignoreFiles = [],
    middleware = "middleware",
    matchingPattern = nextJsPatternMatching(),
    onNotFound = handle404,
  } = options || {};

  if (middleware) {
    const globExts = extensions.join(",");
    ignoreFiles.push(`**/${middleware}.{${globExts}}`);
  }

  if (origin == null) {
    throw new Error(
      "Unable to determine origin, set the `process.env.ORIGIN` or pass an explicit origin in the 'fileSystemRouter' function environment variable"
    );
  }

  if (!path.isAbsolute(cwd)) {
    throw new Error("cwd must be an absolute path");
  }

  const routesDirPath = path.posix.join(cwd, routesDir);

  if (path.posix.relative(cwd, routesDirPath).includes("..")) {
    throw new Error("Routes dir is outside the current working directory");
  }

  if (!existsSync(routesDirPath)) {
    throw new Error(`'${routesDirPath}' don't exists`);
  }

  let middlewarePromise: Promise<Middleware> | undefined = undefined;

  if (middleware) {
    const middlewareFile = findFile(routesDirPath, middleware, extensions);

    if (middlewareFile) {
      const importPath = url.pathToFileURL(middlewareFile).href;
      middlewarePromise = import(importPath).then((mod) => {
        if (!mod || typeof mod.default !== "function") {
          throw new Error(
            `Unable to get middleware handler in '${middlewareFile}', expected default exported function`
          );
        }

        const handler = mod.default;
        return handler;
      });
    }
  }

  const routerPromise = createFileSystemRouter({
    cwd,
    ignorePrefix,
    ignoreFiles,
    matchingPattern,
    routesDirPath,
  });

  return {
    routerPromise,
    middlewarePromise,
    onNotFound,
    origin,
  };
}

function findFile(dir: string, name: string, extensions: string[]) {
  for (const ext of extensions) {
    const p = path.join(dir, `${name}.${ext}`);
    if (existsSync(p)) {
      return p;
    }
  }

  return null;
}

function handle404() {
  return new Response(null, { status: 404 });
}
