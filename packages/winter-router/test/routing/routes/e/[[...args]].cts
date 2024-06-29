import { defineHandler } from "../../../../src/index.js";

export default defineHandler(({ params }) => {
  return new Response(`/e/${params.args ?? ""}`);
});
