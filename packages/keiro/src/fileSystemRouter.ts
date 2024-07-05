import path from "node:path";
import { existsSync } from "node:fs";
import os from "node:os";
import url from "node:url";
import type { Locals, MaybePromise, RequestEvent } from "./types";
import { importHandler, type Route } from "./utils";
import { importMiddleware, importRoute, EXTENSIONS } from "./utils";
import { createRouter } from "radix3";

import type { FileSystemRouteMapper } from "./routing/fileSystemRouteMapper";
import { DefaultFileSystemRouteMapper } from "./routing/fileSystemRouteMapper";
import { getFileSystemRoutesMap } from "./routing/getFileSystemRoutesMap";
import { invariant } from "./common/invariant";
import { type WorkerPool } from "./workers/workerPool";
import { type WorkerOptions } from "node:worker_threads";
import { getWorkerPoolFactory } from "./handler/utils";

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
   * The name of the file that exports a default function used as middleware, this should be located inside the `routesDir`.
   *
   * Use `false` to disable middleware.
   *
   * @default "middleware"
   */
  middleware?: string | false;

  /**
   * The name of the file that exports a default function used as 404 handler, this should be located inside the `routesDir`.
   *
   * @default "404"
   */
  notFound?: string;

  /**
   * A prefix to add to all routes.
   */
  prefix?: string;

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

  /**
   * Worker pool to use.
   *
   * @default
   * WorkerPoolType.Fixed
   */
  pool?:
    | WorkerPoolType
    | ((workerCount: number, filename: string, options?: WorkerOptions) => WorkerPool);
}

/**
 * Type of worker pool to use.
 */
export const enum WorkerPoolType {
  /**
   * The pool grow and shrink to handle the requests. Creating more workers can be costly.
   */
  Dynamic = 1,

  /**
   * The pool maintain a fixed size, if not workers is available
   * the next request need to wait until a worker is available.
   */
  Fixed = 2,
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
    notFound = "404",
    extensions = EXTENSIONS as string[],
    routeMapper = new DefaultFileSystemRouteMapper(),
    getLocals = initLocals,
    workers,
    prefix,

    // internal only
    skipOriginCheck = false,
  } = options || {};

  if (prefix) {
    invariant(!prefix.endsWith("/"), `Prefix should not end with "/": '${prefix}'`);
  }

  if (middleware) {
    const globExts = EXTENSIONS.join(",");
    ignoreFiles.push(`**/**/${middleware}.{${globExts}}`);
  }

  if (notFound) {
    const globExts = EXTENSIONS.join(",");
    ignoreFiles.push(`**/**/${notFound}.{${globExts}}`);
  }

  if (!skipOriginCheck && origin == null) {
    throw new Error(
      "Unable to determine the origin, set `ORIGIN` environment variable or pass the `origin` in the options of the 'fileSystemRouter'",
    );
  }

  invariant(extensions, "No file extensions specified");
  invariant(path.isAbsolute(cwd), "cwd must be an absolute path");

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
    prefix,
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

    const poolFactory = (() => {
      const defaultPoolType = WorkerPoolType.Fixed;

      if (workers === true) {
        return getWorkerPoolFactory(defaultPoolType);
      }

      return getWorkerPoolFactory(workers.pool ?? defaultPoolType);
    })();

    return {
      type: "worker" as const,
      origin,
      workerCount,
      routeMapper,
      middlewareFilePath,
      poolFactory,
      initialOptions,
    };
  }

  const middlewarePromise = (async () => {
    if (middleware) {
      const middlewareFile = findFile(routesDirPath, middleware, EXTENSIONS);

      if (middlewareFile) {
        const importPath = url.pathToFileURL(middlewareFile).href;
        return importMiddleware(importPath);
      }
    }

    return undefined;
  })();

  const notFoundPromise = (async () => {
    if (notFound) {
      const notFoundFile = findFile(routesDirPath, notFound, EXTENSIONS);

      if (notFoundFile) {
        const importPath = url.pathToFileURL(notFoundFile).href;
        return importHandler(importPath);
      }
    }

    return undefined;
  })();

  const routerPromise = createFileSystemRouter({
    cwd,
    routesDir,
    prefix,
    ignorePrefix,
    ignoreFiles,
    routeMapper,
    extensions,
  });

  return {
    type: "handler" as const,
    routerPromise,
    middlewarePromise,
    notFoundPromise,
    routeMapper,
    getLocals,
    initialOptions,
  };
}

export interface CreateRouterOptions {
  cwd: string;
  routesDir: string;
  prefix: string | undefined;
  ignoreFiles?: string[];
  ignorePrefix: string;
  extensions: string[];
  routeMapper: FileSystemRouteMapper;
}

async function createFileSystemRouter(options: CreateRouterOptions) {
  const routesMap = getFileSystemRoutesMap(options);
  const routes: Record<string, Route> = {};
  const routePromises: Promise<Route>[] = [];

  for (const [key, routeFilePath] of Object.entries(routesMap)) {
    routePromises.push(
      importRoute(routeFilePath).then((route) => {
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
