import { defineHandler } from "../../../../src";

export default defineHandler(() => {
  return new Response("never called");
});
