import { defineHandler } from "../../../../packages/keiro/src/index.ts";

export default defineHandler(() => {
  return new Response("Hello World!");
});
