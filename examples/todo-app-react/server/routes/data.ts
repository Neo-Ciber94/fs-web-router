import { defineHandler } from "keiro";

export default defineHandler(() => {
  return Response.json({
    hello: "world",
  });
});
