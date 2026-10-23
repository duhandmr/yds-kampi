import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { QUESTION_TYPES, type DifficultyKey } from "@/lib/constants";
import { enrichVocabulary } from "@/lib/services/ai-enhancements";
import { runQuestionGeneration } from "@/lib/services/generation";
import { getSettings } from "@/lib/services/settings";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(request: NextRequest): boolean {
  const secret = getEnv().CRON_SECRET;
  if (!secret || secret.length < 32) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Günlük bakım (Vercel Cron): süresi dolmuş oturumları ve hız sınırlama kayıtlarını temizler;
 * yapay zekâ açıksa, öğrencinin görmediği onaylı sorusu azalan soru tiplerinde yeni sorular üretir.
 */
export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const now = new Date();
  await prisma.session.deleteMany({ where: { expiresAt: { lt: now } } });
  await prisma.rateLimit.deleteMany({ where: { windowStart: { lt: new Date(now.getTime() - 24 * 3600_000) } } });

  const settings = await getSettings();
  const generated: Array<{ type: string; status: string; accepted: number }> = [];
  if (settings.aiEnabled) {
    const learner = await prisma.user.findFirst({ where: { role: "USER", deletedAt: null }, select: { id: true } });
    for (const type of QUESTION_TYPES) {
      if (generated.length >= 3) break;
      const unseen = await prisma.question.count({
        where: { type, qualityStatus: { in: ["APPROVED", "PENDING_REVIEW"] }, deletedAt: null, ...(learner ? { exposures: { none: { userId: learner.id } } } : {}) },
      });
      if (unseen >= 6) continue;
      const topic = await prisma.topic.findFirst({ where: { questionType: type, isActive: true }, orderBy: { sortOrder: "asc" } });
      if (!topic) continue;
      const difficulty: DifficultyKey = "MEDIUM";
      const res = await runQuestionGeneration({ type, topicSlug: topic.slug, difficulty, count: 5 }, null);
      generated.push({ type, status: res.status, accepted: res.accepted });
    }
  }
  const vocab = await enrichVocabulary(15);
  return NextResponse.json({ ok: true, generated, vocabulary: vocab.message });
}
