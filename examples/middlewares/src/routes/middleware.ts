import { errorHandler } from "@/lib/middlewares/errorHandler";
import { logging } from "@/lib/middlewares/logging";
import { ipRateLimiter } from "@/lib/middlewares/rateLimiter";
import { timeout } from "@/lib/middlewares/timeout";
import { sequence } from "keiro";

export default sequence(
  errorHandler(),
  logging(),
  timeout(3000),
  ipRateLimiter({
    limit: 10,
    windowMs: 5000,
  }),
);
