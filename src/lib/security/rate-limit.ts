type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitRecord>();

export function getClientRateLimitKey(request: Request, fallback = "anonymous") {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || fallback;
  return ip;
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  buckets.set(key, current);

  return { allowed: true, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt };
}

export const RATE_LIMITS = {
  complaintSubmission: { limit: 10, windowMs: 10 * 60 * 1000 },
  complaintLookup: { limit: 30, windowMs: 10 * 60 * 1000 },
  adminWrite: { limit: 60, windowMs: 10 * 60 * 1000 },
} as const;
