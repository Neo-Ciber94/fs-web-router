import { defineHandler } from "../../../../src/index.js";

export default defineHandler(() => {
  return new Response("/a");
});
