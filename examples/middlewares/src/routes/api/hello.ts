import { defineHandler } from "keiro";

export default defineHandler(() => {
  return new Response("Hello!");
});
