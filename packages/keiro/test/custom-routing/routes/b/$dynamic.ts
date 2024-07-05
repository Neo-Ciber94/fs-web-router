import { defineHandler } from "../../../../src";

export default defineHandler(({ params }) => {
  return new Response(`dynamic route: /b/${params.dynamic}`);
});
