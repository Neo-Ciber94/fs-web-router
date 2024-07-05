import { defineMiddleware } from "../../../src/index.js";

export default defineMiddleware((event, next) => {
  const pathname = event.url.pathname;

  if (pathname === "/404") {
    return new Response("404", { status: 404 });
  }

  if (pathname === "/a") {
    return new Response("a");
  }

  return next(event);
});
