import { ApplicationError } from "@/lib/error";
import { defineMiddleware, sequence } from "keiro";

const loggerMiddleware = defineMiddleware(async (event, next) => {
  const request = event.request;
  const now = new Date();

  // Get the response
  const response = await next(event);

  const elapsed = Date.now() - now.getTime();
  const duration = `${elapsed.toFixed(2)}ms`;
  const method = request.method;
  const path = event.url.pathname;
  const isOk = response.ok ? "✅" : "❌";
  console.log(`${isOk} [${now.toISOString()}] ${method} ${path} ${duration}`);
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
