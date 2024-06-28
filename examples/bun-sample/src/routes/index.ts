import { defineHandler } from "winter-router";

export default defineHandler(() => {
  return new Response("Hello World!");
});
