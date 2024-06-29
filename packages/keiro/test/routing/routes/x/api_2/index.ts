import { defineHandler } from "../../../../../src/index.js";

export const POST = defineHandler(() => {
  return new Response("post 2");
});
