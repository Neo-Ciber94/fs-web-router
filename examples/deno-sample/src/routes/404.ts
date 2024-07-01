import { defineHandler } from "keiro";

export default defineHandler(() => {
  return new Response("What you are looking for is not here", { status: 404 });
});
