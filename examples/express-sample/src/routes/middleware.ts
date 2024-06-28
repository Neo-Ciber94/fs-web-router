import { ApplicationError } from "@/lib/error";
import { defineMiddleware, sequence } from "winter-router";

const loggerMiddleware = defineMiddleware(async (event, next) => {
  const start = Date.now();
  const { method, url } = event.request;
  const response = await next(event);
  const duration = Date.now() - start;
  console.log(`[${new Date().toISOString()}] 🚀 ${method} ${url} 🕜 ${duration}ms`);
  return response;
});

const errorMiddleware = defineMiddleware(async (event, next) => {
  try {
    return await next(event);
  } catch (err) {
    if (err instanceof ApplicationError) {
      return Response.json({ error: err.message }, { status: err.status });
    }

    throw err;
  }
});

export default defineMiddleware(sequence(errorMiddleware, loggerMiddleware));
