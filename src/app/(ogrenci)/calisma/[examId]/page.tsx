import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { startAttemptAction } from "@/app/actions/exam";
import { LessonCard } from "@/components/exam/lesson-card";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Lesson } from "@/content/topics";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { getExamTopics } from "@/lib/services/exam-service";
import { idSchema } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Deneme öncesi hazırlık" };

export default async function PreparationPage({ params }: { params: Promise<{ examId: string }> }) {
  const user = await requireOnboardedUser();
  const { examId } = await params;
  if (!idSchema.safeParse(examId).success) notFound();
  const data = await getExamTopics(user.id, examId);
  if (!data) notFound();
  const { exam, topics } = data;
  if (exam.attempt?.status === "COMPLETED") redirect(`/deneme/${exam.attempt.id}/sonuc`);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Aşama 1 · Hazırlık"
        title={exam.title}
        description={`Bugünkü denemede ${exam.questionCount} soru var ve süren ${Math.round(exam.durationSeconds / 60)} dakika. Aşağıdaki konuları kısaca gözden geçir; hazır olduğunda denemeyi başlat.`}
      />
      <div className="space-y-4">
        {topics.map((t, i) => (
          <LessonCard key={t.id} name={t.name} lesson={t.lesson as Lesson} questionCount={t.count} defaultOpen={i === 0} />
        ))}
      </div>
      <Card className="sticky bottom-20 mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between md:bottom-4">
        <p className="text-[15px] text-zinc-800 dark:text-zinc-200">
          {exam.attempt ? "Denemen devam ediyor; kaldığın yerden sürdürebilirsin." : "Süre, denemeyi başlattığın anda işlemeye başlar."}
        </p>
        <form action={startAttemptAction}>
          <input type="hidden" name="examId" value={exam.id} />
          <SubmitButton size="lg" pendingText="Başlatılıyor…">
            {exam.attempt ? "Denemeye dön" : "Denemeyi başlat"}
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
