/* eslint-disable @typescript-eslint/no-explicit-any */
import { posix as path } from "path";
import url from "url";
import { getRouterMap } from "../createFileSystemRouter.js";
import { type FileSystemRouterOptions, initializeFileSystemRouter } from "../fileSystemRouter.js";
import { createRequest, setResponse } from "../nodeHelpers.js";
import http from "http";
import { WorkerRouterData } from "../worker.mjs";
import { handleRequestOnWorker } from "../workers/handleRequestOnWorker.js";
import { WorkerPool } from "../workers/workerPool.js";
import { EXTENSIONS, normalizePath } from "../utils.js";
import { dirname } from "path";

const __dirname = normalizePath(dirname(url.fileURLToPath(import.meta.url)));

export default function fileSystemRouter(options?: FileSystemRouterOptions) {
  const fsRouterOptions = initializeFileSystemRouter(options);

  if (fsRouterOptions.type === "worker") {
    return workerFileSystemRouter({
      ...fsRouterOptions.initialOptions,
      workerCount: fsRouterOptions.workerCount,
      middlewareFilePath: fsRouterOptions.middlewareFilePath,
    });
  }

  const { onNotFound, initializeLocals, routerPromise, middlewarePromise } = fsRouterOptions;

  return async (req: http.IncomingMessage, res: http.ServerResponse, next: (err?: any) => void) => {
    const router = await routerPromise;
    const middleware = await middlewarePromise;

    const match = router.lookup(req.url ?? "");
    let response: Response;

    try {
      const request = await createRequest({ req, baseUrl: origin });
      const { handler = onNotFound, params = {} } = match || {};
      const preEvent = { request, params, locals: {} };
      const locals = await Promise.resolve(initializeLocals(preEvent));
      const requestEvent = { ...preEvent, locals };

      if (middleware) {
        response = await middleware(requestEvent, handler);
      } else {
        response = await handler(requestEvent);
      }

      setResponse(response, res);
    } catch (err) {
      console.error(err);
      return next(err);
    }
  };
}

type FsRouterOptions = ReturnType<typeof initializeFileSystemRouter>["initialOptions"] & {
  middlewareFilePath: string | null | undefined;
  workerCount: number;
};

function workerFileSystemRouter(options: FsRouterOptions) {
  const {
    cwd,
    ignoreFiles,
    ignorePrefix,
    matchingPattern,
    middleware,
    middlewareFilePath,
    workerCount,
    origin,
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

  const workerFilePath = path.join(__dirname, "..", "worker.mjs");

  const pool = new WorkerPool(workerCount, workerFilePath, {
    workerData: {
      routesFilePaths,
      middlewareFilePath,
    } as WorkerRouterData,
  });

  return async (req: http.IncomingMessage, res: http.ServerResponse, next: (err?: any) => void) => {
    const worker = await pool.get();

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
