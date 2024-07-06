import { sequence } from "keiro";
import { serveStatic } from "@/lib/middlewares/serveStatic";

export default sequence(serveStatic({ dir: "public", cache: false }));
