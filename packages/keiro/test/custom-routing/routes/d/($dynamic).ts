import { defineHandler } from "../../../../src";

export default defineHandler(({ params }) => {
  return new Response(`optional dynamic route: /d/${params.dynamic ?? ""}`);
});
