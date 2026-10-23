import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { EXAM_KIND_LABELS, type DifficultyKey, type ExamKindKey, type QuestionTypeKey } from "../constants";
import { formatDateKeyTr, toDateKey } from "../dates";
import { asJson } from "../json";
import { selectPlacementQuestions, selectQuestions, type PoolQuestion } from "../exam/selection";
import { computeDeadline } from "../exam/timing";
import { finalizeCore, saveAnswerCore, type AnswerInput } from "../exam/attempt-core";
import { questionSignatureText } from "../questions/similarity";
import { prismaAttemptStore } from "./attempt-store";
import { examConfig, getSettings, readTypeWeights } from "./settings";

export class ExamUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExamUnavailableError";
  }
}

async function loadPool(): Promise<PoolQuestion[]> {
  const rows = await prisma.question.findMany({
    where: { qualityStatus: "APPROVED", deletedAt: null, topic: { isActive: true } },
    select: { id: true, type: true, topicId: true, difficulty: true, stem: true, passage: true },
  });
  return rows.map((r) => ({
    id: r.id,
    type: r.type as QuestionTypeKey,
    topicId: r.topicId,
    difficulty: r.difficulty as DifficultyKey,
    text: questionSignatureText(r),
  }));
}

/** Bugünün belirtilen türdeki denemesini döndürür; yoksa performansa göre oluşturur. Yapay zekâ çağrısı yapılmaz (hızlı ve dayanıklı). */
export async function getOrCreateTodayExam(userId: string, kind: ExamKindKey): Promise<{ id: string }> {
  const now = new Date();
  const studyDate = toDateKey(now);
  const existing = await prisma.exam.findUnique({ where: { userId_studyDate_kind: { userId, studyDate, kind } }, select: { id: true, deletedAt: true } });
  if (existing && !existing.deletedAt) return { id: existing.id };
  if (existing?.deletedAt) throw new ExamUnavailableError("Bugünün bu türdeki denemesi silinmiş. Yarın yeni bir deneme oluşturulacak.");

  const settings = await getSettings();
  if (kind === "FULL" && !settings.fullMockEnabled) throw new ExamUnavailableError("Tam prova henüz yönetici tarafından etkinleştirilmedi.");
  const { count, durationSeconds } = examConfig(settings, kind);
  const pool = await loadPool();
  if (pool.length === 0) throw new ExamUnavailableError("Soru havuzunda yayımlanmış soru bulunmuyor. Lütfen yöneticiyle iletişime geçin.");

  let questionIds: string[];
  let topicPlan: Prisma.InputJsonValue;
  if (kind === "PLACEMENT") {
    const perType = Math.max(1, Math.round(count / 11));
    questionIds = selectPlacementQuestions(pool, perType, `${userId}:${studyDate}:placement`);
    topicPlan = asJson({ kind: "placement", perType });
  } else {
    const [exposures, masteries] = await Promise.all([
      prisma.questionExposure.findMany({ where: { userId }, select: { questionId: true, timesSeen: true, lastSeenAt: true, lastCorrect: true } }),
      prisma.topicPerformance.findMany({ where: { userId, deletedAt: null }, select: { topicId: true, masteryScore: true, questionsSeen: true } }),
    ]);
    const result = selectQuestions({
      pool,
      exposures,
      masteries: masteries.map((m) => ({ topicId: m.topicId, mastery: m.masteryScore, questionsSeen: m.questionsSeen })),
      typeWeights: readTypeWeights(settings),
      count,
      seed: `${userId}:${studyDate}:${kind}`,
      now,
    });
    questionIds = result.questionIds;
    topicPlan = asJson({ kind: "adaptive", plan: result.plan, reusedCount: result.reusedCount, difficultyTargets: result.difficultyTargets });
  }
  if (questionIds.length === 0) throw new ExamUnavailableError("Deneme için uygun soru bulunamadı.");

  try {
    const exam = await prisma.exam.create({
      data: {
        userId,
        kind,
        studyDate,
        title: `${EXAM_KIND_LABELS[kind]} · ${formatDateKeyTr(studyDate)}`,
        questionCount: questionIds.length,
        durationSeconds: kind === "PLACEMENT" ? durationSeconds : Math.round((durationSeconds * questionIds.length) / count),
        topicPlan,
        questions: { create: questionIds.map((questionId, i) => ({ questionId, position: i + 1 })) },
      },
      select: { id: true },
    });
    return exam;
  } catch (error) {
    // Çift tıklama vb. eşzamanlı istek: benzersizlik kuralı ikinci denemenin oluşmasını engeller.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const again = await prisma.exam.findUniqueOrThrow({ where: { userId_studyDate_kind: { userId, studyDate, kind } }, select: { id: true } });
      return again;
    }
    throw error;
  }
}

/** Denemeyi başlatır. Her denemenin yalnızca bir oturumu olabilir (examId benzersiz). */
export async function startAttempt(userId: string, examId: string): Promise<{ attemptId: string; status: "IN_PROGRESS" | "COMPLETED" }> {
  const exam = await prisma.exam.findFirst({ where: { id: examId, userId, deletedAt: null }, include: { attempt: true } });
  if (!exam) throw new ExamUnavailableError("Deneme bulunamadı.");
  if (exam.attempt) return { attemptId: exam.attempt.id, status: exam.attempt.status };
  const startedAt = new Date();
  try {
    const attempt = await prisma.examAttempt.create({
      data: { examId, userId, startedAt, deadlineAt: computeDeadline(startedAt, exam.durationSeconds) },
      select: { id: true },
    });
    return { attemptId: attempt.id, status: "IN_PROGRESS" };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const a = await prisma.examAttempt.findUniqueOrThrow({ where: { examId }, select: { id: true, status: true } });
      return { attemptId: a.id, status: a.status };
    }
    throw error;
  }
}

export function saveAnswer(userId: string, attemptId: string, input: AnswerInput) {
  return saveAnswerCore(prismaAttemptStore, userId, attemptId, input, new Date());
}

export function finalizeAttempt(userId: string, attemptId: string) {
  return finalizeCore(prismaAttemptStore, userId, attemptId, new Date());
}

/** Deneme ekranı verisi. Doğru cevaplar ve açıklamalar deneme sırasında istemciye GÖNDERİLMEZ. */
export async function getRunnerData(userId: string, attemptId: string) {
  const attempt = await prisma.examAttempt.findFirst({
    where: { id: attemptId, userId, deletedAt: null },
    include: {
      answers: { select: { questionId: true, selectedLabel: true, isFlagged: true, timeSpentSeconds: true } },
      exam: {
        include: {
          questions: {
            orderBy: { position: "asc" },
            include: {
              question: {
                select: {
                  id: true,
                  type: true,
                  passage: true,
                  stem: true,
                  options: { select: { label: true, text: true }, orderBy: { label: "asc" } },
                },
              },
            },
          },
        },
      },
    },
  });
  return attempt;
}

export async function getResultData(userId: string, attemptId: string) {
  return prisma.examAttempt.findFirst({
    where: { id: attemptId, userId, deletedAt: null },
    include: {
      answers: true,
      recommendation: true,
      exam: {
        include: {
          questions: {
            orderBy: { position: "asc" },
            include: { question: { include: { topic: true, options: { orderBy: { label: "asc" } } } } },
          },
        },
      },
    },
  });
}

export async function getExamTopics(userId: string, examId: string) {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, userId, deletedAt: null },
    include: {
      attempt: { select: { id: true, status: true } },
      questions: { select: { question: { select: { topic: true, difficulty: true } } } },
    },
  });
  if (!exam) return null;
  const topics = new Map<string, { id: string; slug: string; name: string; lesson: unknown; sortOrder: number; count: number }>();
  for (const { question } of exam.questions) {
    const t = topics.get(question.topic.id) ?? { ...question.topic, count: 0 };
    t.count += 1;
    topics.set(t.id, t);
  }
  return { exam, topics: [...topics.values()].sort((a, b) => a.sortOrder - b.sortOrder) };
}

export async function getTodayExams(userId: string) {
  const studyDate = toDateKey(new Date());
  return prisma.exam.findMany({
    where: { userId, studyDate, deletedAt: null },
    include: { attempt: { select: { id: true, status: true, scorePercent: true, deadlineAt: true } } },
    orderBy: { createdAt: "asc" },
  });
}
