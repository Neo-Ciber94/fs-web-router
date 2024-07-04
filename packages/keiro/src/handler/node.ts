/* eslint-disable @typescript-eslint/no-explicit-any */
import { type FileSystemRouterOptions, initializeFileSystemRouter } from "../fileSystemRouter";
import { createRequest, setResponse } from "../common/nodeHelpers";
import type http from "node:http";
import { posix as path } from "node:path";
import { EXTENSIONS, getRouteHandler, normalizePath } from "../utils";
import type { WorkerRouterData } from "./worker.mjs";
import { handleRequestOnWorker } from "../workers/handleRequestOnWorker";
import { WorkerPool } from "../workers/workerPool";
import type { MaybePromise } from "../types";
import url from "node:url";
import { chain, createRequestEvent, handleNotFound } from "./utils";
import { invariant } from "../common/invariant";
import { applyResponseCookies } from "../cookies";
import { getFileSystemRoutesMap } from "../routing/getFileSystemRoutesMap";

const __dirname = path.dirname(normalizePath(url.fileURLToPath(import.meta.url)));

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
  const fsRouterOptions = initializeFileSystemRouter(options);

  if (fsRouterOptions.type === "worker") {
    return workerFileSystemRouter({
      ...fsRouterOptions.initialOptions,
      workerCount: fsRouterOptions.workerCount,
      middlewareFilePath: fsRouterOptions.middlewareFilePath,
    });
  }

  const {
    getLocals,
    initialOptions: { origin },
    routerPromise,
    middlewarePromise,
    notFoundPromise,
  } = fsRouterOptions;

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
    extensions,
    origin,
    routesDir,
  } = options;

  invariant(origin, "Origin is not set");

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
