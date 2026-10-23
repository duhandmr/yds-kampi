import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { QUESTION_TYPE_LABELS, type DifficultyKey, type QuestionTypeKey } from "../constants";
import { toDateKey } from "../dates";
import { asJson, readKeywords } from "../json";
import type { AttemptStore, AttemptTx, FinalizeContext } from "../exam/attempt-core";
import { scoreAttempt, type ScoreItem } from "../exam/scoring";
import { updateTopicPerformance } from "../performance/topic-performance";
import { buildRecommendation } from "../performance/recommendation";
import { estimatePlacement } from "../performance/level";
import { relapse } from "../vocabulary/srs";
import { updateStreak } from "../streak";

type Tx = Prisma.TransactionClient;

/** Deneme tamamlandığında tek bir transaction içinde tüm türetilmiş kayıtları oluşturur. */
async function completeAttempt(tx: Tx, ctx: FinalizeContext): Promise<void> {
  const { attempt, completedAt } = ctx;
  const full = await tx.examAttempt.findUniqueOrThrow({
    where: { id: attempt.id },
    include: {
      answers: true,
      exam: {
        include: {
          questions: { orderBy: { position: "asc" }, include: { question: { include: { topic: true } } } },
        },
      },
    },
  });
  const answerByQ = new Map<string, { selectedLabel: string | null; timeSpentSeconds: number }>(
    full.answers.map((a) => [a.questionId, a] as const),
  );

  const items: ScoreItem[] = full.exam.questions.map(({ question }) => {
    const a = answerByQ.get(question.id);
    return {
      questionId: question.id,
      topicId: question.topicId,
      topicName: question.topic.name,
      type: question.type as QuestionTypeKey,
      difficulty: question.difficulty as DifficultyKey,
      correctLabel: question.correctLabel,
      selectedLabel: a?.selectedLabel ?? null,
      timeSpentSeconds: a?.timeSpentSeconds ?? 0,
    };
  });
  const score = scoreAttempt(items, QUESTION_TYPE_LABELS);
  const outcomeByQ = new Map(score.results.map((r) => [r.questionId, r.outcome]));

  // Cevapların doğruluk bilgisi
  for (const item of items) {
    const outcome = outcomeByQ.get(item.questionId);
    if (answerByQ.has(item.questionId)) {
      await tx.userAnswer.update({
        where: { attemptId_questionId: { attemptId: attempt.id, questionId: item.questionId } },
        data: { isCorrect: outcome === "correct" ? true : outcome === "wrong" ? false : null },
      });
    } else {
      await tx.userAnswer.create({
        data: { attemptId: attempt.id, questionId: item.questionId, selectedLabel: null, isCorrect: null },
      });
    }
  }

  const previous = await tx.examAttempt.findFirst({
    where: { userId: attempt.userId, status: "COMPLETED", deletedAt: null, id: { not: attempt.id }, scorePercent: { not: null } },
    orderBy: { completedAt: "desc" },
    select: { scorePercent: true },
  });
  const previousScorePercent = previous?.scorePercent ?? null;
  const avgSecondsPerQuestion = items.length ? Math.round(ctx.durationSeconds / items.length) : 0;

  await tx.examAttempt.update({
    where: { id: attempt.id },
    data: {
      correctCount: score.correct,
      wrongCount: score.wrong,
      blankCount: score.blank,
      scorePercent: score.scorePercent,
      summary: asJson({
        byTopic: score.byTopic,
        byDifficulty: score.byDifficulty,
        byType: score.byType,
        avgSecondsPerQuestion,
        previousScorePercent,
      }),
    },
  });

  // Konu performansı
  for (const bucket of score.byTopic) {
    const prev = await tx.topicPerformance.findUnique({ where: { userId_topicId: { userId: attempt.userId, topicId: bucket.key } } });
    const next = updateTopicPerformance(prev && !prev.deletedAt ? prev : null, { correct: bucket.correct, wrong: bucket.wrong, blank: bucket.blank });
    await tx.topicPerformance.upsert({
      where: { userId_topicId: { userId: attempt.userId, topicId: bucket.key } },
      create: { userId: attempt.userId, topicId: bucket.key, ...next, lastPracticedAt: completedAt },
      update: { ...next, lastPracticedAt: completedAt, deletedAt: null },
    });
  }

  // Sorunun görülme bilgisi (tekrarın önlenmesi)
  for (const item of items) {
    const outcome = outcomeByQ.get(item.questionId);
    await tx.questionExposure.upsert({
      where: { userId_questionId: { userId: attempt.userId, questionId: item.questionId } },
      create: { userId: attempt.userId, questionId: item.questionId, timesSeen: 1, lastSeenAt: completedAt, lastCorrect: outcome === "correct" },
      update: { timesSeen: { increment: 1 }, lastSeenAt: completedAt, lastCorrect: outcome === "correct" },
    });
  }

  // Yanlış/boş sorulardaki önemli kelimeler kelime listesine
  const wrongOrBlank = full.exam.questions
    .filter(({ question }) => outcomeByQ.get(question.id) !== "correct")
    .map(({ question }) => ({ questionId: question.id, topicName: question.topic.name, keywords: readKeywords(question.keywords) }));
  for (const w of wrongOrBlank) {
    for (const k of w.keywords) {
      const term = k.term.trim().toLowerCase();
      const existing = await tx.vocabularyItem.findUnique({ where: { userId_term: { userId: attempt.userId, term } } });
      if (!existing) {
        await tx.vocabularyItem.create({
          data: {
            userId: attempt.userId,
            term,
            meaningTr: k.meaningTr,
            partOfSpeech: k.partOfSpeech,
            exampleEn: k.exampleEn ?? null,
            exampleTr: k.exampleTr ?? null,
            synonyms: k.synonyms ?? [],
            antonyms: k.antonyms ?? [],
            status: "NEW",
            dueAt: completedAt,
            lastSeenAt: completedAt,
            sourceQuestionId: w.questionId,
          },
        });
      } else {
        const r = relapse(existing, completedAt);
        await tx.vocabularyItem.update({
          where: { id: existing.id },
          data: { ...r, lastSeenAt: completedAt, deletedAt: null },
        });
      }
    }
  }

  // Çalışma serisi
  const todayKey = toDateKey(completedAt);
  const streak = await tx.studyStreak.findUnique({ where: { userId: attempt.userId } });
  const nextStreak = updateStreak(streak, todayKey);
  await tx.studyStreak.upsert({
    where: { userId: attempt.userId },
    create: { userId: attempt.userId, ...nextStreak },
    update: nextStreak,
  });

  // Günlük öneri
  const rec = buildRecommendation({
    scorePercent: score.scorePercent,
    previousScorePercent,
    byTopic: score.byTopic,
    wrongOrBlank,
    totalQuestions: items.length,
  });
  await tx.dailyRecommendation.create({
    data: {
      userId: attempt.userId,
      attemptId: attempt.id,
      studyDate: todayKey,
      message: rec.message,
      focusTopics: asJson({ focus: rec.focusTopics, strong: rec.strongTopics }),
      reviewList: asJson(rec.reviewList),
      vocabularyToReview: asJson(rec.vocabularyToReview),
      extraQuestionCount: rec.extraQuestionCount,
      nextGoal: rec.nextGoal,
    },
  });

  // Seviye belirleme sonucu
  if (full.exam.kind === "PLACEMENT") {
    const placement = estimatePlacement(
      items.map((i) => ({ type: i.type, difficulty: i.difficulty, outcome: outcomeByQ.get(i.questionId) ?? "blank" })),
    );
    const placementData = {
      placementCompletedAt: completedAt,
      estimatedLevel: placement.levelLabel,
      recommendedDailyMinutes: placement.recommendedDailyMinutes,
      startingPlan: asJson(placement),
    };
    await tx.profile.upsert({
      where: { userId: attempt.userId },
      create: { userId: attempt.userId, ...placementData },
      update: placementData,
    });
  }
}

export const prismaAttemptStore: AttemptStore = {
  async getAttempt(attemptId) {
    const a = await prisma.examAttempt.findFirst({
      where: { id: attemptId, deletedAt: null },
      select: { id: true, userId: true, status: true, startedAt: true, deadlineAt: true },
    });
    return a;
  },
  async examHasQuestion(attemptId, questionId) {
    const count = await prisma.examQuestion.count({ where: { questionId, exam: { attempt: { id: attemptId } } } });
    return count > 0;
  },
  async upsertAnswer(attemptId, input, now) {
    await prisma.userAnswer.upsert({
      where: { attemptId_questionId: { attemptId, questionId: input.questionId } },
      create: {
        attemptId,
        questionId: input.questionId,
        selectedLabel: input.selectedLabel,
        isFlagged: input.flagged,
        timeSpentSeconds: input.timeSpentSeconds,
        answeredAt: input.selectedLabel ? now : null,
      },
      update: {
        selectedLabel: input.selectedLabel,
        isFlagged: input.flagged,
        timeSpentSeconds: input.timeSpentSeconds,
        answeredAt: input.selectedLabel ? now : null,
      },
    });
  },
  async transaction(fn) {
    return prisma.$transaction(
      async (tx) => {
        const attemptTx: AttemptTx = {
          async markCompleted(attemptId, data) {
            const res = await tx.examAttempt.updateMany({
              where: { id: attemptId, status: "IN_PROGRESS" },
              data: { status: "COMPLETED", completedAt: data.completedAt, autoSubmitted: data.autoSubmitted, durationSeconds: data.durationSeconds },
            });
            return res.count === 1;
          },
          async onCompleted(ctx) {
            await completeAttempt(tx, ctx);
          },
        };
        return fn(attemptTx);
      },
      { timeout: 20_000, maxWait: 10_000 },
    );
  },
};
