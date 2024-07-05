import type { Middleware } from "keiro/types";
import { delay } from "../utils";

class TimeoutError extends Error {}

export const timeout = (ms: number): Middleware => {
  return async (event, next) => {
    try {
      const responsePromise = next(event);
      const errorPromise = delay(ms).then(() => Promise.reject(new TimeoutError()));
      const response = await Promise.race([responsePromise, errorPromise]);
      return response;
    } catch (err) {
      if (err instanceof TimeoutError) {
        return Response.json({ error: "Timeout" }, { status: 408 });
      }

      throw err;
    }
  };
};
