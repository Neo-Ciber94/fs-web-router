import type { MaybePromise, Middleware, RequestEvent } from "./types";

/**
 * Creates a request handler.
 */
export function defineHandler(f: (event: RequestEvent) => MaybePromise<Response>) {
  return f;
}

/**
 * Creates a middleware handler.
 */
export function defineMiddleware(f: Middleware) {
  return f;
}

/**
 * Create a middleware from a sequence of middlewares.
 */
export function sequence(...middlewares: Middleware[]): Middleware {
  return async (event, next) => {
    const handle = async (index: number): Promise<any> => {
      if (index < middlewares.length) {
        const m = middlewares[index];
        return m(event, () => handle(index + 1));
      } else {
        return next(event);
      }
    };

    return handle(0);
  };
}
