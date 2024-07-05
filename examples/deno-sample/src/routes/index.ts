import { defineHandler } from "../deps/keiro.ts";

export default defineHandler(() => {
  return new Response("Hello World!");
});
