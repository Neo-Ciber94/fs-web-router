import path from "path";
import { existsSync } from "fs";
import os from "os";
import url from "url";
import createFileSystemRouter from "./createFileSystemRouter.js";
import { type MatchingPattern, nextJsPatternMatching } from "./matchingPattern.js";
import type { Locals, MaybePromise, Middleware, RequestEvent } from "./types.js";
import { createMiddleware, EXTENSIONS } from "./utils.js";

export interface FileSystemRouterOptions {
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
   * A function that initialize request locals.
   */
  initializeLocals?: (event: RequestEvent) => MaybePromise<Locals>;

  /**
   * Handle a 404 request.
   */
  onNotFound?: (event: RequestEvent) => MaybePromise<Response>;

  /**
   * Enable workers.
   */
  workers?: WorkersRoutingOptions | boolean;
}

export interface WorkersRoutingOptions {
  workerCount?: number;
}

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
    initializeLocals = initLocals,
    workers,
  } = options || {};

  if (middleware) {
    const globExts = EXTENSIONS.join(",");
    ignoreFiles.push(`**/**/${middleware}.{${globExts}}`);
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

  if (workers) {
    const cpuCount = os.cpus().length;
    const workerCount = typeof workers === "boolean" ? cpuCount : workers.workerCount ?? cpuCount;
    const middlewareFilePath = middleware
      ? findFile(routesDirPath, middleware, EXTENSIONS)
      : undefined;

    return {
      type: "worker" as const,
      origin,
      workerCount,
      middlewareFilePath,
    };
  }

  let middlewarePromise: Promise<Middleware> | undefined = undefined;

  if (middleware) {
    const middlewareFile = findFile(routesDirPath, middleware, EXTENSIONS);

    if (middlewareFile) {
      const importPath = url.pathToFileURL(middlewareFile).href;
      middlewarePromise = createMiddleware(importPath);
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
    type: "handler" as const,
    routerPromise,
    middlewarePromise,
    onNotFound,
    initializeLocals,
    origin,
  };
}

function findFile(dir: string, name: string, extensions: readonly string[]) {
  for (const ext of extensions) {
    const p = path.posix.join(dir, `${name}.${ext}`);
    if (existsSync(p)) {
      return p;
    }
  }

  return null;
}

function initLocals() {
  return {};
}

function handle404() {
  return new Response(null, { status: 404 });
}
