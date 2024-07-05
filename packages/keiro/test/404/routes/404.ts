import { defineHandler } from "../../../src";

export default defineHandler(() => {
  return new Response("Nothing here", { status: 404 });
});
