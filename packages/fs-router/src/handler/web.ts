import { type FileSystemRouterOptions, initializeFileSystemRouter } from "../fileSystemRouter";

export default function fileSystemRouter(options?: FileSystemRouterOptions) {
  const { onNotFound, routerPromise, middlewarePromise } = initializeFileSystemRouter(options);

  return async (request: Request) => {
    const router = await routerPromise;
    const middleware = await middlewarePromise;

    const url = new URL(request.url);
    const reqUrl = `${url.pathname}${url.search}`;
    const match = router.lookup(reqUrl);

    const { handler = onNotFound, params = {} } = match || {};
    const requestEvent = { request, params };

    if (middleware) {
      return middleware(requestEvent, handler);
    } else {
      return onNotFound(requestEvent);
    }
  };
}
