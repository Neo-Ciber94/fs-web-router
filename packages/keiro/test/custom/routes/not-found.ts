import { defineHandler } from "../../../src";

export default defineHandler(() => {
  return new Response("Not found", { status: 404 });
});
