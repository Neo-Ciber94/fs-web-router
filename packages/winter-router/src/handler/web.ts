import { type FileSystemRouterOptions, initializeFileSystemRouter } from "../fileSystemRouter.js";
import { posix as path } from "node:path";
import { getRouterMap } from "../createFileSystemRouter.js";
import { EXTENSIONS, getRouteHandler, normalizePath } from "../utils.js";
import { WorkerRouterData } from "../worker.mjs";
import { handleRequestOnWorker } from "../workers/handleRequestOnWorker.js";
import { WorkerPool } from "../workers/workerPool.js";
import type { MaybePromise } from "../types.js";
import url from "node:url";
import { createRequestEvent } from "./utils.js";
import { applyResponseCookies } from "../cookies.js";

const __dirname = path.dirname(normalizePath(url.fileURLToPath(import.meta.url)));

type RequestHandler = (request: Request) => MaybePromise<Response>;

/**
 * Creates a file system router web middleware.
 * @param options The file system router options.
 */
export default function fileSystemRouter(options?: FileSystemRouterOptions): RequestHandler {
  const fsRouterOptions = initializeFileSystemRouter({
    ...options,
    skipOriginCheck: true,
  });

  if (fsRouterOptions.type === "worker") {
    return workerFileSystemRouter({
      ...fsRouterOptions.initialOptions,
      workerCount: fsRouterOptions.workerCount,
      middlewareFilePath: fsRouterOptions.middlewareFilePath,
    });
  }

  const { onNotFound, getLocals, routerPromise, middlewarePromise } = fsRouterOptions;

  return async (request: Request) => {
    const router = await routerPromise;
    const middleware = await middlewarePromise;

    const url = new URL(request.url);
    const match = router.lookup(url.pathname);

    const { params = {}, ...route } = match || {};
    const handler = getRouteHandler(request, route) || onNotFound;
    const requestEvent = await createRequestEvent({ request, params, getLocals });

    let response: Response;

    if (middleware) {
      response = await middleware(requestEvent, handler);
    } else {
      response = await handler(requestEvent);
    }

    applyResponseCookies(response, requestEvent.cookies);
    return response;
  };
}

type WorkerFileSystemRouterOptions = ReturnType<
  typeof initializeFileSystemRouter
>["initialOptions"] & {
  middlewareFilePath: string | null | undefined;
  workerCount: number;
};

function workerFileSystemRouter(options: WorkerFileSystemRouterOptions) {
  const {
    cwd,
    ignoreFiles,
    ignorePrefix,
    matchingPattern,
    middleware,
    middlewareFilePath,
    workerCount,
    routesDir,
  } = options;

  const routesDirPath = path.join(cwd, routesDir);

  if (middlewareFilePath) {
    const globExts = EXTENSIONS.join(",");
    ignoreFiles.push(`**/**/${middleware}.{${globExts}}`);
  }

  const routesFilePaths = getRouterMap({
    cwd,
    ignorePrefix,
    matchingPattern,
    routesDirPath,
    ignoreFiles,
  });

  const workerFilePath = "file://" + path.join(__dirname, "..", "worker.mjs");

  const pool = new WorkerPool(workerCount, workerFilePath, {
    workerData: {
      routesFilePaths,
      middlewareFilePath,
    } as WorkerRouterData,
  });

  return async (request: Request) => {
    const worker = await pool.take();

    try {
      const response = await handleRequestOnWorker(worker, request);
      return response;
    } finally {
      pool.return(worker);
    }
  };
}
