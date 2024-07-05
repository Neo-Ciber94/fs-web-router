import type { Middleware } from "keiro/types";

export const logging = (): Middleware => {
  return async (event, next) => {
    const now = new Date();
    const response = await next(event);

    const elapsedMs = Date.now() - now.getTime();
    const responseStatus = response.status;
    const method = event.request.method;
    const path = event.url.pathname;
    const isNotFound = response.status === 404;
    const isOk = isNotFound ? "⚠️ " : response.ok ? "✅" : "❌";
    console.log(
      `${isOk} [${now.toISOString()}] ${method} ${path} ${responseStatus} - ${elapsedMs.toFixed(2)}ms`,
    );
    return response;
  };
};
