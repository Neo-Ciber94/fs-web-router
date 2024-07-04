import { type FileSystemRouterOptions, initializeFileSystemRouter } from "../fileSystemRouter";
import { posix as path } from "node:path";
import { EXTENSIONS, getRouteHandler, normalizePath } from "../utils";
import type { WorkerRouterData } from "./worker.mjs";
import { handleRequestOnWorker } from "../workers/handleRequestOnWorker";
import { WorkerPool } from "../workers/workerPool";
import type { MaybePromise } from "../types";
import url from "node:url";
import { chain, createRequestEvent, handleNotFound } from "./utils";
import { applyResponseCookies } from "../cookies";
import { getFileSystemRoutesMap } from "../routing/getFileSystemRoutesMap";

const __dirname = path.dirname(normalizePath(url.fileURLToPath(import.meta.url)));

type WebRequestHandler = (request: Request) => MaybePromise<Response>;

/**
 * Creates a file system router web middleware.
 * @param options The file system router options.
 */
export function fileSystemRouter(options?: FileSystemRouterOptions): WebRequestHandler {
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

  const { getLocals, routerPromise, middlewarePromise, notFoundPromise } = fsRouterOptions;

  return async (request: Request) => {
    const router = await routerPromise;
    const middleware = await middlewarePromise;
    const handle404 = (await notFoundPromise) ?? handleNotFound;

    const url = new URL(request.url);
    const match = router.lookup(url.pathname);

    const { params = {}, ...route } = match || {};
    const handler = getRouteHandler(request, route) || handle404;
    const requestEvent = await createRequestEvent({ request, params, getLocals });
    const nextHandler = chain(handler, handle404);

    let response: Response;

    if (middleware) {
      response = await middleware(requestEvent, nextHandler);
    } else {
      response = await handler(requestEvent, nextHandler);
    }

    applyResponseCookies(response, requestEvent.cookies);
    return response;
  };
}

type InitialOptions = ReturnType<typeof initializeFileSystemRouter>["initialOptions"];

type WorkerFileSystemRouterOptions = InitialOptions & {
  middlewareFilePath: string | null | undefined;
  workerCount: number;
};

function workerFileSystemRouter(options: WorkerFileSystemRouterOptions) {
  const {
    cwd,
    prefix,
    ignoreFiles,
    ignorePrefix,
    routeMapper,
    middleware,
    middlewareFilePath,
    workerCount,
    routesDir,
    extensions,
  } = options;

  if (middlewareFilePath) {
    const globExts = EXTENSIONS.join(",");
    ignoreFiles.push(`**/**/${middleware}.{${globExts}}`);
  }

  const routesFilePaths = getFileSystemRoutesMap({
    cwd,
    prefix,
    routesDir,
    ignorePrefix,
    routeMapper,
    ignoreFiles,
    extensions,
  });

  const workerFilePath = "file://" + path.join(__dirname, "worker.mjs");

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
