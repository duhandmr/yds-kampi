import "server-only";
import { headers } from "next/headers";
import { prisma } from "./db";
import { computeRateLimit } from "./rate-limit-core";

export class RateLimitError extends Error {
  constructor(readonly retryAfterMs: number) {
    super("Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin.");
    this.name = "RateLimitError";
  }
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
}

/** Veritabanı tabanlı sabit pencere hız sınırlaması. Sunucusuz ortamda örnekler arasında paylaşılır. */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const prev = await tx.rateLimit.findUnique({ where: { key } });
    const decision = computeRateLimit(prev ? { count: prev.count, windowStart: prev.windowStart } : null, now, limit, windowMs);
    if (decision.allowed) {
      await tx.rateLimit.upsert({
        where: { key },
        create: { key, count: decision.next.count, windowStart: decision.next.windowStart },
        update: { count: decision.next.count, windowStart: decision.next.windowStart },
      });
    }
    return { allowed: decision.allowed, retryAfterMs: decision.retryAfterMs };
  });
}

export async function enforceRateLimit(key: string, limit: number, windowMs: number): Promise<void> {
  const result = await rateLimit(key, limit, windowMs);
  if (!result.allowed) throw new RateLimitError(result.retryAfterMs);
}
