import { type FileSystemRouterOptions, initializeFileSystemRouter } from "../fileSystemRouter.js";
import { posix as path } from "node:path";
import { getRouterMap } from "../createFileSystemRouter.js";
import { EXTENSIONS } from "../utils.js";
import { WorkerRouterData } from "../worker.mjs";
import { handleRequestOnWorker } from "../workers/handleRequestOnWorker.js";
import { WorkerPool } from "../workers/workerPool.js";
import type { MaybePromise } from "../types.js";

type RequestHandler = (request: Request) => MaybePromise<Response>;

/**
 * Creates a file system router web middleware.
 * @param options The file system router options.
 */
export default function fileSystemRouter(options?: FileSystemRouterOptions): RequestHandler {
  const fsRouterOptions = initializeFileSystemRouter(options);

  if (fsRouterOptions.type === "worker") {
    return workerFileSystemRouter({
      ...fsRouterOptions.initialOptions,
      workerCount: fsRouterOptions.workerCount,
      middlewareFilePath: fsRouterOptions.middlewareFilePath,
    });
  }

  const { onNotFound, initializeLocals, routerPromise, middlewarePromise } = fsRouterOptions;

  return async (request: Request) => {
    const router = await routerPromise;
    const middleware = await middlewarePromise;

    const url = new URL(request.url);
    const match = router.lookup(url.pathname);

    const { handler = onNotFound, params = {} } = match || {};
    const preEvent = { request, params, locals: {} };
    const locals = await Promise.resolve(initializeLocals(preEvent));
    const requestEvent = { ...preEvent, locals };

    if (middleware) {
      return middleware(requestEvent, handler);
    } else {
      return handler(requestEvent);
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
