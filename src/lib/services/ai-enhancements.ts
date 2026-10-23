import "server-only";
import { prisma } from "../db";
import { getAiProvider } from "../ai";
import { parseAiJson } from "../ai/parse";
import { REVIEW_SYSTEM_PROMPT, VOCAB_SYSTEM_PROMPT, buildReviewPrompt, buildVocabPrompt } from "../ai/prompts";
import { performanceReviewSchema, vocabularyEnrichmentSchema } from "../ai/schemas";
import type { Bucket } from "../exam/scoring";
import { getSettings } from "./settings";

/**
 * Deneme sonrası öneri metnini yapay zekâ ile zenginleştirir (en iyi çaba).
 * Başarısız olursa şablon tabanlı öneri olduğu gibi kalır. Kişisel veri gönderilmez.
 */
export async function enhanceRecommendation(attemptId: string): Promise<void> {
  try {
    const settings = await getSettings();
    const provider = settings.aiEnabled ? getAiProvider() : null;
    if (!provider) return;
    const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId }, include: { recommendation: true } });
    if (!attempt?.recommendation || attempt.recommendation.aiEnhanced || attempt.scorePercent === null) return;
    const summary = (attempt.summary ?? {}) as { byTopic?: Bucket[]; previousScorePercent?: number | null };
    const raw = await provider.generateJson({
      system: REVIEW_SYSTEM_PROMPT,
      user: buildReviewPrompt({
        scorePercent: attempt.scorePercent,
        previousScorePercent: summary.previousScorePercent ?? null,
        topics: (summary.byTopic ?? []).map((b) => ({ name: b.label, percent: b.percent, total: b.total })),
      }),
      maxTokens: 400,
      temperature: 0.5,
    });
    const parsed = parseAiJson(raw, performanceReviewSchema);
    await prisma.aiGenerationLog.create({
      data: {
        task: "PERFORMANCE_REVIEW",
        provider: provider.name,
        model: provider.model,
        status: parsed.ok ? "SUCCESS" : "INVALID_OUTPUT",
        requestSummary: "Deneme sonrası değerlendirme",
        rawResponse: raw.slice(0, 4000),
        errorMessage: parsed.ok ? null : parsed.error,
        itemsAccepted: parsed.ok ? 1 : 0,
        itemsRejected: parsed.ok ? 0 : 1,
      },
    });
    if (!parsed.ok) return;
    await prisma.dailyRecommendation.update({
      where: { id: attempt.recommendation.id },
      data: { message: parsed.data.message, aiEnhanced: true },
    });
  } catch (error) {
    console.error("Öneri zenginleştirme atlandı:", error instanceof Error ? error.name : "bilinmeyen hata");
  }
}

/** Örnek cümlesi eksik kelimeleri yapay zekâ ile tamamlar (cron veya yönetici tetikler). */
export async function enrichVocabulary(limit = 15): Promise<{ updated: number; message: string }> {
  const settings = await getSettings();
  const provider = settings.aiEnabled ? getAiProvider() : null;
  if (!provider) return { updated: 0, message: "Yapay zekâ kapalı." };
  const items = await prisma.vocabularyItem.findMany({
    where: { deletedAt: null, OR: [{ exampleEn: null }, { exampleTr: null }] },
    take: limit,
    select: { id: true, term: true, meaningTr: true },
  });
  if (items.length === 0) return { updated: 0, message: "Tamamlanacak kelime yok." };
  try {
    const raw = await provider.generateJson({ system: VOCAB_SYSTEM_PROMPT, user: buildVocabPrompt(items), maxTokens: 3000, temperature: 0.4 });
    const parsed = parseAiJson(raw, vocabularyEnrichmentSchema);
    await prisma.aiGenerationLog.create({
      data: {
        task: "VOCABULARY",
        provider: provider.name,
        model: provider.model,
        status: parsed.ok ? "SUCCESS" : "INVALID_OUTPUT",
        requestSummary: `${items.length} kelime`,
        rawResponse: raw.slice(0, 8000),
        errorMessage: parsed.ok ? null : parsed.error,
        itemsAccepted: parsed.ok ? parsed.data.items.length : 0,
      },
    });
    if (!parsed.ok) return { updated: 0, message: "Yapay zekâ çıktısı doğrulanamadı; kayıt yapılmadı." };
    let updated = 0;
    for (const enriched of parsed.data.items) {
      const target = items.find((i) => i.term.toLowerCase() === enriched.term.toLowerCase());
      if (!target) continue;
      await prisma.vocabularyItem.update({
        where: { id: target.id },
        data: {
          exampleEn: enriched.exampleEn,
          exampleTr: enriched.exampleTr,
          synonyms: enriched.synonyms ?? [],
          antonyms: enriched.antonyms ?? [],
        },
      });
      updated += 1;
    }
    return { updated, message: `${updated} kelime zenginleştirildi.` };
  } catch {
    return { updated: 0, message: "Yapay zekâ servisine ulaşılamadı." };
  }
}
