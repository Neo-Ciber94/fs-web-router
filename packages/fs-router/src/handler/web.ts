import { getRouterMap } from "../createFileSystemRouter.js";
import { type FileSystemRouterOptions, initializeFileSystemRouter } from "../fileSystemRouter.js";
import { nextJsPatternMatching } from "../matchingPattern.js";
import { WorkerRouterData } from "../worker.mjs";
import { WorkerPool } from "../workers/workerPool.js";
import { posix as path } from "path";
import url from "url";
import { handleRequestOnWorker } from "../workers/handleRequestOnWorker.js";
import { EXTENSIONS } from "../utils.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export default function fileSystemRouter(options?: FileSystemRouterOptions) {
  const fsRouter = initializeFileSystemRouter(options);

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

    return async (request: Request) => {
      const worker = await pool.get();

      try {
        const response: Response = await handleRequestOnWorker(worker, request);
        return response;
      } finally {
        pool.return(worker);
      }
    };
  }

  const { onNotFound, initializeLocals, routerPromise, middlewarePromise } = fsRouter;

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
