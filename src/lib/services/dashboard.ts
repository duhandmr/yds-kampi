import "server-only";
import { prisma } from "../db";
import { campProgress, toDateKey } from "../dates";
import { displayStreak } from "../streak";
import { classifyTopic } from "../performance/topic-performance";
import { percent } from "../exam/scoring";
import { getSettings } from "./settings";

export async function getDashboardData(userId: string) {
  const now = new Date();
  const todayKey = toDateKey(now);
  const [settings, streak, todayExams, completed, performances, dueVocab, dueVocabCount, vocabCounts] = await Promise.all([
    getSettings(),
    prisma.studyStreak.findUnique({ where: { userId } }),
    prisma.exam.findMany({
      where: { userId, studyDate: todayKey, deletedAt: null },
      include: { attempt: { select: { id: true, status: true, scorePercent: true } } },
    }),
    prisma.examAttempt.findMany({
      where: { userId, status: "COMPLETED", deletedAt: null },
      orderBy: { completedAt: "desc" },
      select: {
        id: true,
        completedAt: true,
        scorePercent: true,
        correctCount: true,
        wrongCount: true,
        blankCount: true,
        durationSeconds: true,
        exam: { select: { kind: true, title: true } },
      },
    }),
    prisma.topicPerformance.findMany({ where: { userId, deletedAt: null }, include: { topic: { select: { name: true, slug: true } } } }),
    prisma.vocabularyItem.findMany({
      where: { userId, deletedAt: null, dueAt: { lte: now }, status: { not: "LEARNED" } },
      orderBy: { dueAt: "asc" },
      take: 6,
      select: { id: true, term: true, meaningTr: true, status: true },
    }),
    prisma.vocabularyItem.count({ where: { userId, deletedAt: null, dueAt: { lte: now }, status: { not: "LEARNED" } } }),
    prisma.vocabularyItem.groupBy({ by: ["status"], where: { userId, deletedAt: null }, _count: { _all: true } }),
  ]);

  const totals = completed.reduce(
    (acc, a) => {
      acc.correct += a.correctCount ?? 0;
      acc.total += (a.correctCount ?? 0) + (a.wrongCount ?? 0) + (a.blankCount ?? 0);
      return acc;
    },
    { correct: 0, total: 0 },
  );

  const strong = performances
    .filter((p) => classifyTopic(p) === "strong")
    .sort((a, b) => b.masteryScore - a.masteryScore)
    .slice(0, 4);
  const weak = performances
    .filter((p) => classifyTopic(p) === "weak")
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 4);

  const daily = todayExams.find((e) => e.kind === "DAILY") ?? null;
  const progress = campProgress(settings.campStartDate, settings.examDate, todayKey);

  return {
    todayKey,
    settings: { examDate: settings.examDate, campStartDate: settings.campStartDate },
    progress,
    streak: displayStreak(streak, todayKey),
    longestStreak: streak?.longestStreak ?? 0,
    studiedToday: streak?.lastStudyDate === todayKey,
    todayDaily: daily ? { examId: daily.id, attempt: daily.attempt } : null,
    totalSolved: totals.total,
    overallPercent: percent(totals.correct, totals.total),
    lastSeven: completed
      .slice(0, 7)
      .reverse()
      .map((a) => ({ id: a.id, date: a.completedAt ? toDateKey(a.completedAt) : "", score: a.scorePercent ?? 0, kind: a.exam.kind })),
    lastAttempt: completed[0] ?? null,
    strong: strong.map((p) => ({ name: p.topic.name, mastery: p.masteryScore })),
    weak: weak.map((p) => ({ name: p.topic.name, mastery: p.masteryScore })),
    dueVocab,
    dueVocabCount,
    vocabCounts: Object.fromEntries(vocabCounts.map((v) => [v.status, v._count._all])) as Record<string, number>,
  };
}
