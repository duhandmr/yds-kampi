import type { Metadata } from "next";
import { completeOnboardingAction } from "@/app/actions/onboarding";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Hoş geldin" };

const STEPS = [
  {
    title: "Önce kısa bir seviye belirleme",
    text: "11 soru tipinden dengeli sorularla başlangıç noktanı belirleriz. Sonuç, uygulama içi bir göstergedir; gerçek bir ÖSYM puanı değildir.",
  },
  {
    title: "Her gün dört adım",
    text: "Konu hazırlığı, süreli mini deneme, ayrıntılı açıklamalar ve sana özel bir çalışma önerisi.",
  },
  {
    title: "Uyarlanan program",
    text: "Daha çok tekrar isteyen konular sonraki denemelerde biraz daha fazla yer alır; daha önce gördüğün sorular mümkün olduğunca tekrar edilmez.",
  },
  {
    title: "Kelimeler seninle gelir",
    text: "Yanlış yaptığın sorulardaki önemli kelimeler listene eklenir ve aralıklı tekrarla planlanır.",
  },
];

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ tekrar?: string }> }) {
  const user = await requireUser();
  const { tekrar } = await searchParams;
  const isReplay = tekrar === "1" || user.onboardingCompleted;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">Kampa hoş geldin</p>
      <h1 className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">Merhaba {user.displayName}</h1>
      <p className="mt-2 text-lg text-zinc-700 dark:text-zinc-300">
        Bu kamp, YDS hazırlığını düzenli ve ölçülebilir bir programa dönüştürmek için hazırlandı. Başlamadan önce nasıl çalıştığına kısaca bakalım.
      </p>
      <ol className="mt-6 space-y-3">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <Card className="flex gap-4">
              <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-100 font-bold text-brand-800 dark:bg-brand-900/50 dark:text-brand-200">
                {i + 1}
              </span>
              <div>
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">{s.title}</h2>
                <p className="mt-1 text-[15px] text-zinc-700 dark:text-zinc-300">{s.text}</p>
              </div>
            </Card>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {isReplay ? (
          <ButtonLink href="/panel" size="lg">
            Panele dön
          </ButtonLink>
        ) : (
          <form action={completeOnboardingAction}>
            <SubmitButton size="lg" pendingText="Hazırlanıyor…">
              Anladım, devam edelim
            </SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}
