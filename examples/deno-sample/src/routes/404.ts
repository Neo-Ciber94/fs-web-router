import { defineHandler } from "../deps/keiro.ts";

export default defineHandler(() => {
  return new Response("What you are looking for is not here", { status: 404 });
});
