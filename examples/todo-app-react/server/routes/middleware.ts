import { sequence } from "keiro";
import { cors, serveStatic } from "@keiro-dev/web/middlewares";

const isProd = process.env.NODE_ENV === "production";

export default sequence(
  cors(),
  serveStatic({ dir: "public/" }),
  isProd && serveStatic({ dir: "build/client" }),
);
