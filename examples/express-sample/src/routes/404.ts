import { defineHandler } from "keiro";

export default defineHandler((event, next) => {
  return next(event);
});
