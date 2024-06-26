import { type FileSystemRouterOptions, initializeFileSystemRouter } from "../fileSystemRouter.js";
import { workerFileSystemRouter } from "./worker.js";

/**
 * Creates a file system router web middleware.
 * @param options The file system router options.
 */
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
