import path from "node:path";
import { invariant } from "../common/invariant";
import type { initializeFileSystemRouter } from "../fileSystemRouter";
import { getFileSystemRoutesMap } from "../routing/getFileSystemRoutesMap";
import { EXTENSIONS, normalizePath } from "../utils";
import type { WorkerPoolFactory } from "./utils";
import type { WorkerRouterData } from "./worker.mjs";
import url from "node:url";

const __dirname = path.dirname(normalizePath(url.fileURLToPath(import.meta.url)));

type InitialOptions = ReturnType<typeof initializeFileSystemRouter>["initialOptions"];

export type WorkerFileSystemRouterOptions = InitialOptions & {
  middlewareFilePath: string | null | undefined;
  poolFactory: WorkerPoolFactory;
  workerCount: number;
};

export function getFileSystemWorkerPool(options: WorkerFileSystemRouterOptions) {
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
    routesDir,
    poolFactory,
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

  const pool = poolFactory(workerCount, workerFilePath, {
    workerData: {
      routesFilePaths,
      middlewareFilePath,
    } as WorkerRouterData,
  });

  invariant(pool, "WorkerPool cannot be undefined");
  return pool;
}
