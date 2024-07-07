import { sequence } from "keiro";
import { serveStatic } from "@keiro-dev/web/middlewares";

export default sequence(
  serveStatic({
    dir: "public",
    dev: process.env.NODE_ENV !== "production",
  }),
);
