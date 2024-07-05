import { defineHandler } from "../../../../src";

export default defineHandler(({ params }) => {
  return new Response(`optional catchall route: /e/${params.catchall ?? ""}`);
});
