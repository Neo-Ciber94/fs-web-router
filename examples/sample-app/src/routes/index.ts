import { defineHandler } from "fs-router";

export default defineHandler(() => {
  return new Response("Hello World");
});
