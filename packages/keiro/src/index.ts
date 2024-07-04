import type { RequestHandler, Middleware } from "./types";

/**
 * Creates a request handler.
 */
export function defineHandler(f: RequestHandler) {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
