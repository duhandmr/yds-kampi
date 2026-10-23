import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { startPlacementAction } from "@/app/actions/exam";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth/guards";
import { QUESTION_TYPE_LABELS, QUESTION_TYPES } from "@/lib/constants";
import { getSettings } from "@/lib/services/settings";

export const metadata: Metadata = { title: "Seviye belirleme" };

export default async function PlacementIntroPage() {
  const user = await requireUser();
  if (!user.onboardingCompleted && user.role !== "ADMIN") redirect("/karsilama");
  if (user.placementCompleted) redirect("/panel");
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Başlangıç"
        title="Seviye belirleme"
        description={`Yaklaşık ${settings.placementQuestionCount} soru ve ${settings.placementDurationMinutes} dakika. Bilmediğin soruyu boş bırakabilirsin; amaç başlangıç noktanı doğru görmek.`}
      />
      <Card>
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Ölçülen alanlar</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {QUESTION_TYPES.map((t) => (
            <li key={t} className="flex items-center gap-2 text-[15px] text-zinc-800 dark:text-zinc-200">
              <span aria-hidden="true" className="text-brand-600">
                ●
              </span>
              {QUESTION_TYPE_LABELS[t]}
            </li>
          ))}
        </ul>
        <Alert tone="info" className="mt-5">
          Sonuç, uygulama içi bir performans göstergesidir; gerçek bir ÖSYM puanı veya kesin sınav tahmini değildir.
        </Alert>
        <form action={startPlacementAction} className="mt-5">
          <SubmitButton size="lg" pendingText="Sorular hazırlanıyor…">
            Seviye belirlemeye başla
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
