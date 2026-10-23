import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ExamRunner, type RunnerQuestion } from "@/components/exam/exam-runner";
import { requireUser } from "@/lib/auth/guards";
import { QUESTION_TYPE_LABELS, type OptionLabel, type QuestionTypeKey } from "@/lib/constants";
import { isExpired } from "@/lib/exam/timing";
import { finalizeAttempt, getRunnerData } from "@/lib/services/exam-service";
import { idSchema } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Deneme" };
export const dynamic = "force-dynamic";

export default async function ExamPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const user = await requireUser();
  const { attemptId } = await params;
  if (!idSchema.safeParse(attemptId).success) notFound();
  const attempt = await getRunnerData(user.id, attemptId);
  if (!attempt) notFound();
  if (attempt.status === "COMPLETED") redirect(`/deneme/${attempt.id}/sonuc`);

  const now = new Date();
  if (isExpired(now, attempt.deadlineAt)) {
    // Sekme kapalıyken süre dolmuşsa deneme sunucuda güvenle tamamlanır.
    await finalizeAttempt(user.id, attempt.id);
    redirect(`/deneme/${attempt.id}/sonuc`);
  }

  const questions: RunnerQuestion[] = attempt.exam.questions.map(({ question }) => ({
    id: question.id,
    typeLabel: QUESTION_TYPE_LABELS[question.type as QuestionTypeKey],
    passage: question.passage,
    stem: question.stem,
    options: question.options,
  }));
  const initialAnswers = Object.fromEntries(
    attempt.answers.map((a) => [a.questionId, { selectedLabel: (a.selectedLabel as OptionLabel | null) ?? null, flagged: a.isFlagged, timeSpentSeconds: a.timeSpentSeconds }]),
  );

  return (
    <ExamRunner
      attemptId={attempt.id}
      title={attempt.exam.title}
      questions={questions}
      initialAnswers={initialAnswers}
      deadlineIso={attempt.deadlineAt.toISOString()}
      serverNowIso={now.toISOString()}
    />
  );
}
