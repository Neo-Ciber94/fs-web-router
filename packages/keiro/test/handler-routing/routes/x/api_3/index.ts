import { defineHandler } from "../../../../../src/index.js";

export const GET = defineHandler(() => {
  return new Response("get 3");
});

export const POST = defineHandler(() => {
  return new Response("post 3");
});

export default defineHandler(({ request }) => {
  return new Response(`Other method: ${request.method.toLowerCase()}`);
});
