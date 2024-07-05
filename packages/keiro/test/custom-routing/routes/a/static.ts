import { defineHandler } from "../../../../src";

export default defineHandler(() => {
  return new Response("static route: /a/static");
});
