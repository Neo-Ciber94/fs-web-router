import type { Middleware, RequestEvent } from "keiro/types";

/**
 * An error throw when the request timeout.
 */
export class TimeoutError extends Error {}

/**
 * Options for the timeout middleware.
 */
export interface TimeoutOptions {
  /**
   * Duration in ms to wait before timing out the request.
   */
  durationMs: number;

  /**
   * A function that returns the error of the timeout, it should be instance of `TimeoutError`.
   */
  timeoutError?: (event: RequestEvent) => TimeoutError | Promise<TimeoutError>;
}

/**
 * Wait for the request until the specified duration in milliseconds, if not request is returned in that time,
 * it returns a `408 Request Timeout` error.
 * @param options The options for the timeout middleware.
 */
export const timeout = (options: TimeoutOptions): Middleware => {
  const { durationMs, timeoutError = () => new TimeoutError() } = options;

  return async (event, next) => {
    let timeout: Timer | undefined;

    const error = await timeoutError(event);
    const responsePromise = next(event);
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(error), durationMs);
    });

    try {
      const response = await Promise.race([responsePromise, timeoutPromise]);
      return response;
    } catch (err) {
      if (timeout) {
        clearTimeout(timeout);
      }

      if (err instanceof TimeoutError) {
        return new Response(null, {
          status: 408,
          headers: {
            Connection: "close",
          },
        });
      }

      throw err;
    }
  };
};
