import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import type { QualityStatusKey, QuestionTypeKey } from "../constants";
import { asJson } from "../json";
import { runQualityChecks, type QualityReport } from "../questions/quality";
import { contentHash, questionSignatureText } from "../questions/similarity";
import type { QuestionDraft } from "../questions/types";

export async function existingSignatures(excludeId?: string) {
  const rows = await prisma.question.findMany({
    where: { deletedAt: null, qualityStatus: { in: ["APPROVED", "PENDING_REVIEW"] }, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true, stem: true, passage: true },
  });
  return rows.map((r) => ({ id: r.id, text: questionSignatureText(r) }));
}

export type SaveQuestionResult =
  | { ok: true; id: string; report: QualityReport }
  | { ok: false; error: string; report?: QualityReport };

/** Soruyu kalite kontrolünden geçirir ve kaydeder. Kontrolden geçmeyen soru yayımlanamaz. */
export async function saveQuestion(
  draft: QuestionDraft,
  opts: { id?: string; status: QualityStatusKey; source: "ADMIN" | "AI" | "SEED"; aiLogId?: string },
): Promise<SaveQuestionResult> {
  const topic = await prisma.topic.findUnique({ where: { slug: draft.topicSlug } });
  if (!topic) return { ok: false, error: "Konu bulunamadı." };
  if (topic.questionType !== draft.type) return { ok: false, error: "Seçilen konu bu soru tipine ait değil." };

  const report = runQualityChecks(draft, await existingSignatures(opts.id), { selfId: opts.id });
  if (opts.status === "APPROVED" && !report.passed) {
    return { ok: false, error: "Soru otomatik kalite kontrolünden geçemediği için yayımlanamaz.", report };
  }
  const hash = contentHash(draft);
  const data = {
    type: draft.type,
    topicId: topic.id,
    subtopic: draft.subtopic,
    difficulty: draft.difficulty,
    passage: draft.passage ?? null,
    stem: draft.stem,
    correctLabel: draft.correctLabel,
    explanation: draft.explanation,
    strategy: draft.strategy,
    tip: draft.tip,
    keywords: asJson(draft.keywords),
    contentHash: hash,
    qualityStatus: opts.status,
    qualityReport: asJson(report),
  };
  const options = draft.options.map((o) => ({ label: o.label, text: o.text, rationale: o.rationale, isCorrect: o.label === draft.correctLabel }));

  try {
    if (opts.id) {
      const id = opts.id;
      await prisma.$transaction([
        prisma.question.update({ where: { id }, data }),
        prisma.questionOption.deleteMany({ where: { questionId: id } }),
        prisma.questionOption.createMany({ data: options.map((o) => ({ ...o, questionId: id })) }),
      ]);
      return { ok: true, id, report };
    }
    const created = await prisma.question.create({
      data: { ...data, source: opts.source, aiLogId: opts.aiLogId ?? null, options: { create: options } },
      select: { id: true },
    });
    return { ok: true, id: created.id, report };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "Aynı içerikte bir soru zaten mevcut.", report };
    }
    throw error;
  }
}

export async function setQuestionStatus(id: string, status: QualityStatusKey): Promise<{ ok: boolean; error?: string }> {
  const q = await prisma.question.findUnique({ where: { id }, include: { options: true, topic: true } });
  if (!q || q.deletedAt) return { ok: false, error: "Soru bulunamadı." };
  if (status === "APPROVED") {
    const draft = questionToDraft(q);
    const report = runQualityChecks(draft, await existingSignatures(id), { selfId: id });
    if (!report.passed) return { ok: false, error: `Kalite kontrolü başarısız: ${report.issues.map((i) => i.message).join(" ")}` };
    await prisma.question.update({ where: { id }, data: { qualityStatus: status, qualityReport: asJson(report) } });
    return { ok: true };
  }
  await prisma.question.update({ where: { id }, data: { qualityStatus: status } });
  return { ok: true };
}

type QuestionWithRelations = Prisma.QuestionGetPayload<{ include: { options: true; topic: true } }>;

export function questionToDraft(q: QuestionWithRelations): QuestionDraft {
  return {
    type: q.type as QuestionTypeKey,
    topicSlug: q.topic.slug,
    subtopic: q.subtopic,
    difficulty: q.difficulty,
    passage: q.passage,
    stem: q.stem,
    options: [...q.options]
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((o) => ({ label: o.label as QuestionDraft["correctLabel"], text: o.text, rationale: o.rationale })),
    correctLabel: q.correctLabel as QuestionDraft["correctLabel"],
    explanation: q.explanation,
    strategy: q.strategy,
    tip: q.tip,
    keywords: Array.isArray(q.keywords) ? (q.keywords as unknown as QuestionDraft["keywords"]) : [],
  };
}

export async function listQuestions(params: { status?: QualityStatusKey; type?: QuestionTypeKey; q?: string; page: number }) {
  const where: Prisma.QuestionWhereInput = {
    deletedAt: null,
    ...(params.status ? { qualityStatus: params.status } : {}),
    ...(params.type ? { type: params.type } : {}),
    ...(params.q ? { OR: [{ stem: { contains: params.q, mode: "insensitive" } }, { passage: { contains: params.q, mode: "insensitive" } }] } : {}),
  };
  const take = 30;
  const [items, total] = await Promise.all([
    prisma.question.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * take,
      take,
      include: { topic: { select: { name: true } }, _count: { select: { exposures: true } } },
    }),
    prisma.question.count({ where }),
  ]);
  return { items, total, pages: Math.max(1, Math.ceil(total / take)) };
}
