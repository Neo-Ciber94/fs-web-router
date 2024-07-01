import { defineHandler } from "../../../../packages/keiro/src/index.ts";

export default defineHandler(() => {
  return new Response("What you are looking for is not here", { status: 404 });
});
