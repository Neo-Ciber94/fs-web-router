import { type FileSystemRouterOptions, initializeFileSystemRouter } from "../fileSystemRouter";
import { createRequest, setResponse } from "../nodeHelpers";
import http from "http";

export default function fileSystemRouter(options?: FileSystemRouterOptions) {
  const { onNotFound, origin, initializeLocals, routerPromise, middlewarePromise } =
    initializeFileSystemRouter(options);

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
        response = await onNotFound(requestEvent);
      }

      setResponse(response, res);
    } catch (err) {
      console.error(err);
      return next(err);
    }
  };
}
