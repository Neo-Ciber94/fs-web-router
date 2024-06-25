import { defineHandler } from "fs-router";

export default defineHandler((event) => {
  return new Response(`Dynamic: ${event.params.param}`);
});
