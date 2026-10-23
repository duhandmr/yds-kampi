"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";
import { ExamUnavailableError, finalizeAttempt, getOrCreateTodayExam, saveAnswer, startAttempt } from "@/lib/services/exam-service";
import { enhanceRecommendation } from "@/lib/services/ai-enhancements";
import { finishAttemptSchema, idSchema, saveAnswerSchema, studyKindSchema } from "@/lib/validation/schemas";

export interface ActionMessage {
  error?: string;
}

/** Bugünün denemesini hazırlar ve hazırlık (konu anlatımı) ekranına yönlendirir. */
export async function prepareExamAction(_prev: ActionMessage, formData: FormData): Promise<ActionMessage> {
  const user = await requireUser();
  const kind = studyKindSchema.safeParse(formData.get("kind"));
  if (!kind.success) return { error: "Geçersiz çalışma türü." };
  let examId: string;
  try {
    await enforceRateLimit(`exam:create:${user.id}`, 20, 60 * 60_000);
    examId = (await getOrCreateTodayExam(user.id, kind.data)).id;
  } catch (error) {
    if (error instanceof ExamUnavailableError || error instanceof RateLimitError) return { error: error.message };
    console.error("Deneme oluşturulamadı", error instanceof Error ? error.name : "");
    return { error: "Deneme şu anda hazırlanamadı. Lütfen biraz sonra tekrar dene." };
  }
  redirect(`/calisma/${examId}`);
}

export async function startPlacementAction(): Promise<void> {
  const user = await requireUser();
  if (user.placementCompleted) redirect("/panel");
  await enforceRateLimit(`exam:create:${user.id}`, 20, 60 * 60_000);
  const exam = await getOrCreateTodayExam(user.id, "PLACEMENT");
  const { attemptId, status } = await startAttempt(user.id, exam.id);
  redirect(status === "COMPLETED" ? `/deneme/${attemptId}/sonuc` : `/deneme/${attemptId}`);
}

export async function startAttemptAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const examId = idSchema.safeParse(formData.get("examId"));
  if (!examId.success) redirect("/calisma");
  const { attemptId, status } = await startAttempt(user.id, examId.data);
  redirect(status === "COMPLETED" ? `/deneme/${attemptId}/sonuc` : `/deneme/${attemptId}`);
}

export type SaveAnswerResponse = { ok: true } | { ok: false; reason: "NOT_FOUND" | "COMPLETED" | "EXPIRED" | "INVALID_QUESTION" | "INVALID_INPUT" | "RATE_LIMITED" | "ERROR" };

/** Tek bir cevabı kaydeder. Deneme sürerken her değişiklikte çağrılır. */
export async function saveAnswerAction(input: unknown): Promise<SaveAnswerResponse> {
  const user = await requireUser();
  const parsed = saveAnswerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "INVALID_INPUT" };
  try {
    await enforceRateLimit(`answer:${user.id}`, 400, 60_000);
    const { attemptId, ...answer } = parsed.data;
    return await saveAnswer(user.id, attemptId, answer);
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false, reason: "RATE_LIMITED" };
    console.error("Cevap kaydedilemedi", error instanceof Error ? error.name : "");
    return { ok: false, reason: "ERROR" };
  }
}

export type FinishResponse = { ok: true; redirectTo: string } | { ok: false; error: string };

/** Denemeyi bitirir. İkinci kez çağrılsa da sonuçlar yeniden hesaplanmaz. */
export async function finishAttemptAction(input: unknown): Promise<FinishResponse> {
  const user = await requireUser();
  const parsed = finishAttemptSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Geçersiz istek." };
  try {
    const result = await finalizeAttempt(user.id, parsed.data.attemptId);
    if (result.status === "NOT_FOUND") return { ok: false, error: "Deneme bulunamadı." };
    if (result.status === "COMPLETED_NOW") {
      const attemptId = parsed.data.attemptId;
      after(() => enhanceRecommendation(attemptId));
    }
    return { ok: true, redirectTo: `/deneme/${parsed.data.attemptId}/sonuc` };
  } catch (error) {
    console.error("Deneme tamamlanamadı", error instanceof Error ? error.name : "");
    return { ok: false, error: "Deneme şu anda tamamlanamadı. Cevapların kayıtlı; lütfen tekrar dene." };
  }
}
