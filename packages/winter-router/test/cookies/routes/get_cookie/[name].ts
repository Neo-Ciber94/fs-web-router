import { defineHandler } from "../../../../src/index.js";

export const POST = defineHandler(({ cookies, params }) => {
  const value = cookies.get(params.name ?? "");
  return new Response(value);
});
