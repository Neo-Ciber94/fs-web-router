import { type FileSystemRouterOptions, initializeFileSystemRouter } from "../fileSystemRouter";
import { getRouteHandler } from "../utils";
import { handleRequestOnWorker } from "../workers/handleRequestOnWorker";
import type { MaybePromise } from "../types";
import { chain, createRequestEvent, handleNotFound } from "./utils";
import { applyResponseCookies } from "../cookies";
import {
  getFileSystemWorkerPool,
  type WorkerFileSystemRouterOptions,
} from "./getFileSystemWorkerPool";

type WebRequestHandler = (request: Request) => MaybePromise<Response>;

/**
 * Creates a file system router web middleware.
 * @param options The file system router options.
 */
export function fileSystemRouter(options?: FileSystemRouterOptions): WebRequestHandler {
  const options$ = initializeFileSystemRouter({
    ...options,
    skipOriginCheck: true,
  });

  if (options$.type === "worker") {
    return workerFileSystemRouter({
      ...options$.initialOptions,
      poolFactory: options$.poolFactory,
      workerCount: options$.workerCount,
      middlewareFilePath: options$.middlewareFilePath,
    });
  }

  const { getLocals, routerPromise, middlewarePromise, notFoundPromise } = options$;

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

function workerFileSystemRouter(options: WorkerFileSystemRouterOptions) {
  const pool = getFileSystemWorkerPool(options);

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
