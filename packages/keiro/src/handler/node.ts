/* eslint-disable @typescript-eslint/no-explicit-any */
import { type FileSystemRouterOptions, initializeFileSystemRouter } from "../fileSystemRouter.js";
import { createRequest, setResponse } from "../nodeHelpers.js";
import type http from "node:http";
import { posix as path } from "node:path";
import { getRouterMap } from "../createFileSystemRouter.js";
import { EXTENSIONS, getRouteHandler, normalizePath } from "../utils.js";
import { WorkerRouterData } from "../worker.mjs";
import { handleRequestOnWorker } from "../workers/handleRequestOnWorker.js";
import { WorkerPool } from "../workers/workerPool.js";
import { MaybePromise } from "../types.js";
import url from "node:url";
import { createRequestEvent } from "./utils.js";
import { invariant } from "../invariant.js";
import { applyResponseCookies } from "../cookies.js";

const __dirname = path.dirname(normalizePath(url.fileURLToPath(import.meta.url)));

type RequestHandler = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  next: (err?: any) => void
) => MaybePromise<void>;

/**
 * Creates a file system router node middleware.
 * @param options The file system router options.
 */
export function fileSystemRouter(options?: FileSystemRouterOptions): RequestHandler {
  const fsRouterOptions = initializeFileSystemRouter(options);

  if (fsRouterOptions.type === "worker") {
    return workerFileSystemRouter({
      ...fsRouterOptions.initialOptions,
      workerCount: fsRouterOptions.workerCount,
      middlewareFilePath: fsRouterOptions.middlewareFilePath,
    });
  }

  const {
    onNotFound,
    getLocals,
    initialOptions: { origin },
    routerPromise,
    middlewarePromise,
  } = fsRouterOptions;

  invariant(origin, "Origin is not set");

  /* eslint-disable @typescript-eslint/no-explicit-any */
  return async (req: http.IncomingMessage, res: http.ServerResponse, next: (err?: any) => void) => {
    const router = await routerPromise;
    const middleware = await middlewarePromise;

    const match = req.url ? router.lookup(new URL(req.url, origin).pathname) : null;
    let response: Response;

    try {
      const request = await createRequest({ req, baseUrl: origin });
      const { params = {}, ...route } = match || {};

      const handler = getRouteHandler(request, route) || onNotFound;
      const requestEvent = await createRequestEvent({ request, params, getLocals });

      if (middleware) {
        response = await middleware(requestEvent, handler);
      } else {
        response = await handler(requestEvent);
      }

      applyResponseCookies(response, requestEvent.cookies);
      setResponse(response, res);
    } catch (err) {
      console.error(err);
      return next(err);
    }
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
    extensions,
    origin,
    routesDir,
  } = options;

  invariant(origin, "Origin is not set");

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
    extensions,
  });

  const workerFilePath = "file://" + path.join(__dirname, "..", "worker.mjs");

  const pool = new WorkerPool(workerCount, workerFilePath, {
    workerData: {
      routesFilePaths,
      middlewareFilePath,
    } as WorkerRouterData,
  });

  return async (req: http.IncomingMessage, res: http.ServerResponse, next: (err?: any) => void) => {
    const worker = await pool.take();

    try {
      const request = await createRequest({ req, baseUrl: origin });
      const response: Response = await handleRequestOnWorker(worker, request);
      setResponse(response, res);
    } catch (err) {
      console.error(err);
      return next(err);
    } finally {
      pool.return(worker);
    }
  };
}
