/* eslint-disable @typescript-eslint/no-explicit-any */
import { posix as path } from "path";
import url from "url";
import { getRouterMap } from "../createFileSystemRouter.js";
import { type FileSystemRouterOptions, initializeFileSystemRouter } from "../fileSystemRouter.js";
import { nextJsPatternMatching } from "../matchingPattern.js";
import { createRequest, setResponse } from "../nodeHelpers.js";
import http from "http";
import { WorkerRouterData } from "../worker.mjs";
import { handleRequestOnWorker } from "../workers/handleRequestOnWorker.js";
import { WorkerPool } from "../workers/workerPool.js";
import { EXTENSIONS, normalizePath } from "../utils.js";
import { dirname } from "path";

const __dirname = normalizePath(dirname(url.fileURLToPath(import.meta.url)));

export default function fileSystemRouter(options?: FileSystemRouterOptions) {
  const fsRouter = initializeFileSystemRouter(options);
  const origin = fsRouter.origin;

  if (fsRouter.type === "worker") {
    const {
      cwd = process.cwd(),
      ignorePrefix = "_",
      routesDir = "src/routes",
      ignoreFiles = [],
      matchingPattern = nextJsPatternMatching(),
    } = options || {};

    const middleware = options?.middleware ?? "middleware";
    const routesDirPath = path.join(cwd, routesDir);
    const middlewareFilePath = fsRouter.middlewareFilePath;

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

    const pool = new WorkerPool(fsRouter.workerCount, workerFilePath, {
      workerData: {
        routesFilePaths,
        middlewareFilePath,
      } as WorkerRouterData,
    });

    return async (
      req: http.IncomingMessage,
      res: http.ServerResponse,
      next: (err?: any) => void
    ) => {
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

  const { onNotFound, initializeLocals, routerPromise, middlewarePromise } = fsRouter;

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
