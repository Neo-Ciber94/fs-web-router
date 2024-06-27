import { defineMiddleware } from "fs-router";

const loggerMiddleware = defineMiddleware(async (event, next) => {
  const start = Date.now();
  const { method, url } = event.request;
  const response = await next(event);
  const duration = Date.now() - start;
  console.log(`[${new Date().toISOString()}] 🚀 ${method} ${url} 🕜 ${duration}ms`);
  return response;
});

export default defineMiddleware(loggerMiddleware);
