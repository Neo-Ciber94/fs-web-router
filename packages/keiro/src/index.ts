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

type SequenceMiddleware = Middleware | false | null | undefined;

/**
 * Create a middleware from a sequence of middlewares.
 */
export function sequence(...middlewares: SequenceMiddleware[]): Middleware {
  return async (event, next) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handle = async (index: number): Promise<any> => {
      if (index < middlewares.length) {
        const middleware = middlewares[index];

        if (middleware) {
          return middleware(event, () => handle(index + 1));
        }
      }

      return next(event);
    };

    return handle(0);
  };
}
