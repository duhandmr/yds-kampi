import "server-only";
import { prisma } from "../db";
import { toCsv } from "../csv";

export async function getAdminOverview() {
  const [questionCounts, learners, recentLogs] = await Promise.all([
    prisma.question.groupBy({ by: ["qualityStatus"], where: { deletedAt: null }, _count: { _all: true } }),
    prisma.user.findMany({
      where: { role: "USER", deletedAt: null },
      select: {
        id: true,
        profile: { select: { displayName: true, estimatedLevel: true, placementCompletedAt: true } },
        streak: true,
        attempts: {
          where: { status: "COMPLETED", deletedAt: null },
          orderBy: { completedAt: "desc" },
          take: 15,
          select: { id: true, completedAt: true, scorePercent: true, correctCount: true, wrongCount: true, blankCount: true, autoSubmitted: true, exam: { select: { title: true } } },
        },
        topicPerformances: { where: { deletedAt: null }, include: { topic: { select: { name: true } } }, orderBy: { masteryScore: "asc" } },
      },
    }),
    prisma.aiGenerationLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  return {
    questionCounts: Object.fromEntries(questionCounts.map((q) => [q.qualityStatus, q._count._all])) as Record<string, number>,
    learners,
    recentLogs,
  };
}

export type ExportDataset = "questions" | "attempts" | "performance" | "vocabulary";

export async function buildExport(dataset: ExportDataset, format: "json" | "csv"): Promise<{ body: string; contentType: string; filename: string }> {
  let rows: Array<Record<string, unknown>>;
  switch (dataset) {
    case "questions": {
      const qs = await prisma.question.findMany({ where: { deletedAt: null }, include: { options: true, topic: { select: { slug: true } } }, orderBy: { createdAt: "asc" } });
      rows = qs.map((q) => ({
        id: q.id,
        type: q.type,
        topic: q.topic.slug,
        subtopic: q.subtopic,
        difficulty: q.difficulty,
        status: q.qualityStatus,
        source: q.source,
        passage: q.passage,
        stem: q.stem,
        correctLabel: q.correctLabel,
        options: format === "json" ? q.options : q.options.map((o) => `${o.label}) ${o.text}`).join(" | "),
        explanation: q.explanation,
        strategy: q.strategy,
        tip: q.tip,
        keywords: q.keywords,
        createdAt: q.createdAt,
      }));
      break;
    }
    case "attempts": {
      const as = await prisma.examAttempt.findMany({ where: { deletedAt: null }, include: { exam: { select: { kind: true, title: true, studyDate: true } } }, orderBy: { startedAt: "asc" } });
      rows = as.map((a) => ({
        id: a.id,
        kind: a.exam.kind,
        title: a.exam.title,
        studyDate: a.exam.studyDate,
        status: a.status,
        startedAt: a.startedAt,
        completedAt: a.completedAt,
        autoSubmitted: a.autoSubmitted,
        correct: a.correctCount,
        wrong: a.wrongCount,
        blank: a.blankCount,
        scorePercent: a.scorePercent,
        durationSeconds: a.durationSeconds,
      }));
      break;
    }
    case "performance": {
      const ps = await prisma.topicPerformance.findMany({ where: { deletedAt: null }, include: { topic: { select: { name: true } } } });
      rows = ps.map((p) => ({
        topic: p.topic.name,
        questionsSeen: p.questionsSeen,
        correct: p.correct,
        wrong: p.wrong,
        blank: p.blank,
        recentAccuracy: p.recentAccuracy,
        masteryScore: p.masteryScore,
        lastPracticedAt: p.lastPracticedAt,
      }));
      break;
    }
    case "vocabulary":
    default: {
      const vs = await prisma.vocabularyItem.findMany({ where: { deletedAt: null }, orderBy: { term: "asc" } });
      rows = vs.map((v) => ({
        term: v.term,
        meaningTr: v.meaningTr,
        partOfSpeech: v.partOfSpeech,
        exampleEn: v.exampleEn,
        exampleTr: v.exampleTr,
        synonyms: v.synonyms.join(", "),
        antonyms: v.antonyms.join(", "),
        status: v.status,
        dueAt: v.dueAt,
        lastSeenAt: v.lastSeenAt,
      }));
    }
  }
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === "csv") return { body: toCsv(rows), contentType: "text/csv; charset=utf-8", filename: `yds-${dataset}-${stamp}.csv` };
  return { body: JSON.stringify(rows, null, 2), contentType: "application/json; charset=utf-8", filename: `yds-${dataset}-${stamp}.json` };
}
