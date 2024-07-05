import type { Middleware } from "keiro/types";

export const errorHandler = (): Middleware => {
  return async (event, next) => {
    try {
      const response = await next(event);
      return response;
    } catch (err) {
      console.error(err);
      return Response.json({ error: "Internal Error" }, { status: 500 });
    }
  };
};
