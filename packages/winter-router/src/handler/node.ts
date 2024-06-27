import { type FileSystemRouterOptions, initializeFileSystemRouter } from "../fileSystemRouter.js";
import { createRequest, setResponse } from "../nodeHelpers.js";
import http from "http";
import { workerFileSystemRouter } from "./worker.js";

/**
 * Creates a file system router node middleware.
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

  const {
    onNotFound,
    initializeLocals,
    initialOptions: { origin },
    routerPromise,
    middlewarePromise,
  } = fsRouterOptions;

  /* eslint-disable @typescript-eslint/no-explicit-any */
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
