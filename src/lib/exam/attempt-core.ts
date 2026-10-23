import type { OptionLabel } from "../constants";
import { SAVE_GRACE_MS, elapsedSeconds, isExpired } from "./timing";

/**
 * Deneme oturumunun veritabanından bağımsız çekirdek kuralları.
 * Prisma uygulaması `src/lib/services/attempt-store.ts` içindedir; testler sahte bir store kullanır.
 */

export interface AttemptRecord {
  id: string;
  userId: string;
  status: "IN_PROGRESS" | "COMPLETED";
  startedAt: Date;
  deadlineAt: Date;
}

export interface AnswerInput {
  questionId: string;
  selectedLabel: OptionLabel | null;
  flagged: boolean;
  timeSpentSeconds: number;
}

export interface FinalizeContext {
  attempt: AttemptRecord;
  completedAt: Date;
  autoSubmitted: boolean;
  durationSeconds: number;
}

export interface AttemptTx {
  /** Yalnızca IN_PROGRESS durumundaki denemeyi COMPLETED yapar (compare-and-set). Geçiş bu çağrıyla olduysa true döner. */
  markCompleted(attemptId: string, data: { completedAt: Date; autoSubmitted: boolean; durationSeconds: number }): Promise<boolean>;
  /** Puanlama, konu performansı, seri ve öneri kayıtlarını oluşturur. Yalnızca geçişi yapan çağrıda bir kez çalışır. */
  onCompleted(ctx: FinalizeContext): Promise<void>;
}

export interface AttemptStore {
  getAttempt(attemptId: string): Promise<AttemptRecord | null>;
  examHasQuestion(attemptId: string, questionId: string): Promise<boolean>;
  upsertAnswer(attemptId: string, input: AnswerInput, now: Date): Promise<void>;
  transaction<T>(fn: (tx: AttemptTx) => Promise<T>): Promise<T>;
}

export type SaveResult =
  | { ok: true }
  | { ok: false; reason: "NOT_FOUND" | "COMPLETED" | "EXPIRED" | "INVALID_QUESTION" };

export async function saveAnswerCore(
  store: AttemptStore,
  userId: string,
  attemptId: string,
  input: AnswerInput,
  now: Date,
): Promise<SaveResult> {
  const attempt = await store.getAttempt(attemptId);
  if (!attempt || attempt.userId !== userId) return { ok: false, reason: "NOT_FOUND" };
  if (attempt.status === "COMPLETED") return { ok: false, reason: "COMPLETED" };
  if (isExpired(now, attempt.deadlineAt, SAVE_GRACE_MS)) return { ok: false, reason: "EXPIRED" };
  if (!(await store.examHasQuestion(attemptId, input.questionId))) return { ok: false, reason: "INVALID_QUESTION" };
  await store.upsertAnswer(attemptId, input, now);
  return { ok: true };
}

export type FinalizeResult =
  | { status: "COMPLETED_NOW"; autoSubmitted: boolean }
  | { status: "ALREADY_COMPLETED" }
  | { status: "NOT_FOUND" };

/**
 * Denemeyi bitirir. Aynı deneme iki kez tamamlanamaz: ikinci çağrı ALREADY_COMPLETED döner ve
 * puanlama/performans güncellemesi tekrar çalışmaz. Süre dolduysa autoSubmitted = true olur.
 */
export async function finalizeCore(store: AttemptStore, userId: string, attemptId: string, now: Date): Promise<FinalizeResult> {
  const attempt = await store.getAttempt(attemptId);
  if (!attempt || attempt.userId !== userId) return { status: "NOT_FOUND" };
  if (attempt.status === "COMPLETED") return { status: "ALREADY_COMPLETED" };

  const expired = isExpired(now, attempt.deadlineAt);
  const completedAt = expired ? attempt.deadlineAt : now;
  const durationSeconds = elapsedSeconds(attempt.startedAt, completedAt);

  return store.transaction(async (tx) => {
    const transitioned = await tx.markCompleted(attemptId, { completedAt, autoSubmitted: expired, durationSeconds });
    if (!transitioned) return { status: "ALREADY_COMPLETED" } as const;
    await tx.onCompleted({ attempt, completedAt, autoSubmitted: expired, durationSeconds });
    return { status: "COMPLETED_NOW", autoSubmitted: expired } as const;
  });
}
