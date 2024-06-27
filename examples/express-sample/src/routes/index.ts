import { defineHandler } from "winter-router";

export default defineHandler(async () => {
  return new Response("Hello world!");
});
