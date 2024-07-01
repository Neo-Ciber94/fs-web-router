import { defineHandler } from "../../../../../src";

export default defineHandler(() => {
  return new Response("this is other route");
});
