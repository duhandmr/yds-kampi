"use server";

import { requireUser } from "@/lib/auth/guards";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";
import { reviewVocabulary } from "@/lib/services/vocabulary";
import { vocabularyReviewSchema } from "@/lib/validation/schemas";

export type ReviewResponse = { ok: true; status: string; intervalDays: number } | { ok: false; error: string };

export async function reviewVocabularyAction(input: unknown): Promise<ReviewResponse> {
  const user = await requireUser();
  const parsed = vocabularyReviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Geçersiz istek." };
  try {
    await enforceRateLimit(`vocab:${user.id}`, 200, 60_000);
    const res = await reviewVocabulary(user.id, parsed.data.itemId, parsed.data.grade);
    if (!res.ok) return { ok: false, error: "Kelime bulunamadı." };
    return res;
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false, error: error.message };
    return { ok: false, error: "Tekrar kaydedilemedi. Lütfen tekrar dene." };
  }
}
