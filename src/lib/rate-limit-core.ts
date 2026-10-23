export interface RateWindow {
  count: number;
  windowStart: Date;
}

export interface RateDecision {
  allowed: boolean;
  next: RateWindow;
  retryAfterMs: number;
}

/** Sabit pencere hız sınırlaması (saf fonksiyon). */
export function computeRateLimit(prev: RateWindow | null, now: Date, limit: number, windowMs: number): RateDecision {
  if (!prev || now.getTime() - prev.windowStart.getTime() >= windowMs) {
    return { allowed: true, next: { count: 1, windowStart: now }, retryAfterMs: 0 };
  }
  if (prev.count >= limit) {
    return { allowed: false, next: prev, retryAfterMs: prev.windowStart.getTime() + windowMs - now.getTime() };
  }
  return { allowed: true, next: { count: prev.count + 1, windowStart: prev.windowStart }, retryAfterMs: 0 };
}
