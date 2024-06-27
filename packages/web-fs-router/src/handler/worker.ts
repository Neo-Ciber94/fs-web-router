import type http from "http";
import { posix as path } from "path";
import { getRouterMap } from "../createFileSystemRouter.js";
import { type initializeFileSystemRouter } from "../fileSystemRouter.js";
import { createRequest, setResponse } from "../nodeHelpers.js";
import { EXTENSIONS } from "../utils.js";
import { WorkerRouterData } from "../worker.mjs";
import { handleRequestOnWorker } from "../workers/handleRequestOnWorker.js";
import { WorkerPool } from "../workers/workerPool.js";

export type WorkerFileSystemRouterOptions = ReturnType<
  typeof initializeFileSystemRouter
>["initialOptions"] & {
  middlewareFilePath: string | null | undefined;
  workerCount: number;
};

export function workerFileSystemRouter(options: WorkerFileSystemRouterOptions) {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
