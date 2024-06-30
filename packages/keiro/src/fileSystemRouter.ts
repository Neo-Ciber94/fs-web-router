import path from "node:path";
import { existsSync } from "node:fs";
import os from "node:os";
import url from "node:url";
import type { Handler, Locals, MaybePromise, Middleware, RequestEvent } from "./types";
import type { HttpMethod } from "./utils";
import { createMiddleware, createRoute, EXTENSIONS } from "./utils";
import { createRouter } from "radix3";
import { getRouterMap } from "./routing";
import type { FileSystemRouteMapper } from "./routing/fileSystemRouteMapper";
import { DefaultFileSystemRouteMapper } from "./routing/fileSystemRouteMapper";

/**
 * File system router options.
 */
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
   * The path of the middleware relative to the routesDir.
   *
   * Use `false` to disable middleware.
   *
   * @default "middleware"
   */
  middleware?: string | false;

  /**
   * Controls how to map a file-system path to a route.
   *
   * Defaults to:
   * - dynamic: `[id]`
   * - catch-all: `[...params]`
   * - optional dynamic: `[[id]]`
   * - optional catch-all: `[[...params]]`
   */
  routeMapper?: FileSystemRouteMapper;

  /**
   * Extensions of the files to use as routes.
   *
   * @default
   * ["js", "jsx", "cjs", "mjs", "ts", "tsx", "cts", "mts"]
   */
  extensions?: string[];

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
   *
   * @conflicts
   * Cannot be used with `workers`
   */
  getLocals?: (event: RequestEvent) => MaybePromise<Locals>;

  /**
   * Handle a 404 request.
   *
   * @conflicts
   * Cannot be used with `workers`
   */
  onNotFound?: (event: RequestEvent) => MaybePromise<Response>;

  /**
   * Use node worker threads for handling the requests.
   *
   * We recommend benchmarking your endpoints to ensure if using multiple threads is beneficial for your app,
   * using multiple thread may reduce the `request/second` your server can handle around `10%` if the work being done is already fast enough.
   *
   * For handling multiple request in multiple threads we spawn multiple workers and serialize the request, then we deserialize the response
   * send from the worker and send it to client.
   */
  workers?: WorkersRoutingOptions | boolean;
}

/**
 * Options for worker threads.
 */
export interface WorkersRoutingOptions {
  /**
   * Number of worker threads to spawn.
   *
   * @default
   * Number of logical processors.
   */
  workerCount?: number;
}

interface InternalOptions {
  skipOriginCheck?: boolean;
}

/**
 * @internal
 */
export function initializeFileSystemRouter(options?: FileSystemRouterOptions & InternalOptions) {
  const {
    cwd = process.cwd(),
    origin = process.env.ORIGIN,
    ignorePrefix = "_",
    routesDir = "src/routes",
    ignoreFiles = [],
    middleware = "middleware",
    extensions = EXTENSIONS as string[],
    routeMapper = new DefaultFileSystemRouteMapper(),
    onNotFound = handle404,
    getLocals = initLocals,
    workers,

    // internal only
    skipOriginCheck = false,
  } = options || {};

  if (!extensions) {
    throw new Error("No file extensions specified");
  }

  if (middleware) {
    const globExts = EXTENSIONS.join(",");
    ignoreFiles.push(`**/**/${middleware}.{${globExts}}`);
  }

  if (!skipOriginCheck && origin == null) {
    throw new Error(
      "Unable to determine the origin, set `ORIGIN` environment variable or pass the `origin` in the options of the 'fileSystemRouter'",
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

  const initialOptions = {
    cwd,
    origin,
    ignorePrefix,
    routesDir,
    ignoreFiles,
    middleware,
    extensions,
    routeMapper,
  };

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
      routeMapper,
      middlewareFilePath,
      initialOptions,
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
    routesDir,
    ignorePrefix,
    ignoreFiles,
    routeMapper,
    extensions,
  });

  return {
    type: "handler" as const,
    routerPromise,
    middlewarePromise,
    routeMapper,
    onNotFound,
    getLocals,
    initialOptions,
  };
}

export interface CreateRouterOptions {
  cwd: string;
  routesDir: string;
  ignoreFiles?: string[];
  ignorePrefix: string;
  extensions: string[];
  routeMapper: FileSystemRouteMapper;
}

type RouteHttpMethodHandler = {
  [M in HttpMethod]?: Handler;
};

export type Route = RouteHttpMethodHandler & {
  default?: Handler;
};

async function createFileSystemRouter(options: CreateRouterOptions) {
  const routesMap = getRouterMap(options);
  const routes: Record<string, Route> = {};
  const routePromises: Promise<Route>[] = [];

  for (const [key, routeFilePath] of Object.entries(routesMap)) {
    routePromises.push(
      createRoute(routeFilePath).then((route) => {
        routes[key] = route;
        return route;
      }),
    );
  }

  await Promise.all(routePromises);

  const router = createRouter<Route>({ routes });
  return router;
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
