type RateLimitState = {
  count: number;
  windowStart: number;
};

const counters = new Map<string, RateLimitState>();

export function checkRateLimit(
  key: string,
  options: {
    maxRequests: number;
    windowMs: number;
  },
) {
  const now = Date.now();
  const current = counters.get(key);

  if (!current || now - current.windowStart >= options.windowMs) {
    counters.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
    };
  }

  if (current.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: options.windowMs - (now - current.windowStart),
    };
  }

  current.count += 1;
  counters.set(key, current);

  return {
    allowed: true,
    remaining: options.maxRequests - current.count,
  };
}
