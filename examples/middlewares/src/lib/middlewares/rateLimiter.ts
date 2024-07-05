import type { Middleware } from "keiro/types";

type RateLimitEntry = { count: number; timestamp: number };

type RateLimiterOptions = {
  limit: number;
  windowMs: number;
};

export const ipRateLimiter = (options: RateLimiterOptions): Middleware => {
  const { limit, windowMs } = options;
  const requestIpMap = new Map<string, RateLimitEntry>();

  return async (event, next) => {
    const clientIp = getClientIp(event.request);

    if (!clientIp) {
      // console.warn("Unable to resolve client ip address")
      return next(event);
    }

    const now = Date.now();
    const rateLimitEntry = requestIpMap.get(clientIp) || { count: 0, timestamp: now };
    const isSuccess = rateLimitEntry.timestamp + windowMs > now;

    if (isSuccess) {
      rateLimitEntry.count += 1;
    } else {
      rateLimitEntry.count = 1;
      rateLimitEntry.timestamp = now;
    }

    requestIpMap.set(clientIp, rateLimitEntry);

    if (rateLimitEntry.count > limit) {
      return Response.json({ error: "Too many request" }, { status: 429 });
    }

    return next(event);
  };
};

function getClientIp(request: Request) {
  const clientIp = request.headers.get("X-Forwarded-For") || request.headers.get("Remote-Addr");
  return clientIp;
}
