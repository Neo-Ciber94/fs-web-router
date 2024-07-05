import { defineHandler } from "keiro";

export default defineHandler(() => {
  throw new Error("This is expected");
});
