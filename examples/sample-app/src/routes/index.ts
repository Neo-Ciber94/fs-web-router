import { defineHandler } from "fs-router";

export default defineHandler((event) => {
  return new Response("Hello World: " + event.locals.num);
});
