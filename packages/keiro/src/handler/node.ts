/* eslint-disable @typescript-eslint/no-explicit-any */
import { type FileSystemRouterOptions, initializeFileSystemRouter } from "../fileSystemRouter";
import { createRequest, setResponse } from "../common/nodeHelpers";
import type http from "node:http";
import { getRouteHandler } from "../utils";
import { handleRequestOnWorker } from "../workers/handleRequestOnWorker";
import type { MaybePromise } from "../types";
import { chain, createRequestEvent, handleNotFound } from "./utils";
import { invariant } from "../common/invariant";
import { applyResponseCookies } from "../cookies";
import type { WorkerFileSystemRouterOptions } from "./getFileSystemWorkerPool";
import { getFileSystemWorkerPool } from "./getFileSystemWorkerPool";

type NodeRequestHandler = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  next?: (err?: any) => void,
) => MaybePromise<void>;

/**
 * Creates a file system router node middleware.
 * @param options The file system router options.
 */
export function fileSystemRouter(options?: FileSystemRouterOptions): NodeRequestHandler {
  const options$ = initializeFileSystemRouter(options);

  if (options$.type === "worker") {
    return workerFileSystemRouter({
      ...options$.initialOptions,
      poolFactory: options$.poolFactory,
      workerCount: options$.workerCount,
      middlewareFilePath: options$.middlewareFilePath,
    });
  }

  const {
    getLocals,
    initialOptions: { origin },
    routerPromise,
    middlewarePromise,
    notFoundPromise,
  } = options$;

  invariant(origin, "Origin is not set");

  /* eslint-disable @typescript-eslint/no-explicit-any */
  return async (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next?: (err?: any) => void,
  ) => {
    const router = await routerPromise;
    const middleware = await middlewarePromise;
    const handle404 = (await notFoundPromise) ?? handleNotFound;

    const match = req.url ? router.lookup(new URL(req.url, origin).pathname) : null;
    let response: Response;

    try {
      const request = await createRequest({ req, baseUrl: origin });
      const { params = {}, ...route } = match || {};

      const handler = getRouteHandler(request, route) || handle404;
      const requestEvent = await createRequestEvent({ request, params, getLocals });
      const nextHandler = chain(handler, handle404);

      if (middleware) {
        response = await middleware(requestEvent, nextHandler);
      } else {
        response = await handler(requestEvent, nextHandler);
      }

      applyResponseCookies(response, requestEvent.cookies);
      setResponse(response, res);
    } catch (err) {
      console.error(err);
      if (next) {
        return next(err);
      }

      throw err;
    }
  };
}

function workerFileSystemRouter(options: WorkerFileSystemRouterOptions) {
  const { origin } = options;
  const pool = getFileSystemWorkerPool(options);

  invariant(origin, "Origin is not set");

  return async (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next?: (err?: any) => void,
  ) => {
    const worker = await pool.take();

    try {
      const request = await createRequest({ req, baseUrl: origin });
      const response: Response = await handleRequestOnWorker(worker, request);
      setResponse(response, res);
    } catch (err) {
      console.error(err);
      if (next) {
        return next(err);
      }

      throw err;
    } finally {
      pool.return(worker);
    }
  };
}
