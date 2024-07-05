import { defineMiddleware } from "../../../src";

export default defineMiddleware((event, next) => {
  if (event.url.pathname === "/ping") {
    return new Response("pong");
  }

  return next(event);
});
