/**
 * Seed: konuları, özgün başlangıç soru bankasını ve varsayılan kamp ayarlarını yükler.
 * Kullanıcı hesabı OLUŞTURMAZ (bkz. scripts/create-user.ts). Tekrar çalıştırılabilir (idempotent).
 */
import { PrismaClient } from "@prisma/client";
import { TOPICS } from "../src/content/topics";
import { SEED_QUESTIONS, toDraft } from "../src/content/questions";
import { DEFAULT_TYPE_WEIGHTS } from "../src/lib/constants";
import { toDateKey } from "../src/lib/dates";
import { asJson } from "../src/lib/json";
import { runQualityChecks, type ExistingSignature } from "../src/lib/questions/quality";
import { contentHash, questionSignatureText } from "../src/lib/questions/similarity";

const prisma = new PrismaClient();

async function main() {
  console.info("Konular yükleniyor…");
  const topicIdBySlug = new Map<string, string>();
  for (const t of TOPICS) {
    const topic = await prisma.topic.upsert({
      where: { slug: t.slug },
      create: { slug: t.slug, name: t.name, questionType: t.questionType, description: t.description, sortOrder: t.sortOrder, lesson: asJson(t.lesson) },
      update: { name: t.name, questionType: t.questionType, description: t.description, sortOrder: t.sortOrder, lesson: asJson(t.lesson) },
    });
    topicIdBySlug.set(t.slug, topic.id);
  }

  console.info("Sorular kalite kontrolünden geçirilip yükleniyor…");
  const seen: ExistingSignature[] = [];
  let created = 0;
  let updated = 0;
  for (const [i, input] of SEED_QUESTIONS.entries()) {
    const draft = toDraft(input);
    const report = runQualityChecks(draft, seen);
    if (!report.passed) {
      throw new Error(`Seed sorusu #${i + 1} kalite kontrolünden geçemedi: ${report.issues.map((x) => x.message).join("; ")}`);
    }
    seen.push({ id: String(i), text: questionSignatureText(draft) });
    const topicId = topicIdBySlug.get(draft.topicSlug);
    if (!topicId) throw new Error(`Bilinmeyen konu: ${draft.topicSlug}`);
    const hash = contentHash(draft);
    const data = {
      type: draft.type,
      topicId,
      subtopic: draft.subtopic,
      difficulty: draft.difficulty,
      passage: draft.passage ?? null,
      stem: draft.stem,
      correctLabel: draft.correctLabel,
      explanation: draft.explanation,
      strategy: draft.strategy,
      tip: draft.tip,
      keywords: asJson(draft.keywords),
      qualityReport: asJson(report),
    };
    const options = draft.options.map((o) => ({ label: o.label, text: o.text, rationale: o.rationale, isCorrect: o.label === draft.correctLabel }));
    const existing = await prisma.question.findUnique({ where: { contentHash: hash }, select: { id: true } });
    if (existing) {
      await prisma.$transaction([
        prisma.question.update({ where: { id: existing.id }, data }),
        prisma.questionOption.deleteMany({ where: { questionId: existing.id } }),
        prisma.questionOption.createMany({ data: options.map((o) => ({ ...o, questionId: existing.id })) }),
      ]);
      updated += 1;
    } else {
      await prisma.question.create({ data: { ...data, contentHash: hash, qualityStatus: "APPROVED", source: "SEED", options: { create: options } } });
      created += 1;
    }
  }

  await prisma.campSettings.upsert({
    where: { id: "default" },
    create: { id: "default", campStartDate: toDateKey(new Date()), topicWeights: asJson(DEFAULT_TYPE_WEIGHTS) },
    update: {},
  });

  console.info(`Tamamlandı: ${TOPICS.length} konu, ${created} yeni soru, ${updated} güncellenen soru.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
