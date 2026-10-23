import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BarList } from "@/components/exam/bar-list";
import { QuestionReview, type ReviewItem } from "@/components/exam/question-review";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireUser } from "@/lib/auth/guards";
import { DIFFICULTY_LABELS, QUESTION_TYPE_LABELS, type DifficultyKey, type QuestionTypeKey } from "@/lib/constants";
import { outcomeOf, type Bucket } from "@/lib/exam/scoring";
import { formatDurationTr, isExpired } from "@/lib/exam/timing";
import { readKeywords } from "@/lib/json";
import type { PlacementResult } from "@/lib/performance/level";
import { personalFeedback } from "@/lib/performance/recommendation";
import { prisma } from "@/lib/db";
import { finalizeAttempt, getResultData } from "@/lib/services/exam-service";
import { idSchema } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Sonuçlar" };
export const dynamic = "force-dynamic";

interface Summary {
  byTopic?: Bucket[];
  byDifficulty?: Bucket[];
  byType?: Bucket[];
  avgSecondsPerQuestion?: number;
  previousScorePercent?: number | null;
}

export default async function ResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const user = await requireUser();
  const { attemptId } = await params;
  if (!idSchema.safeParse(attemptId).success) notFound();

  let attempt = await getResultData(user.id, attemptId);
  if (!attempt) notFound();
  if (attempt.status === "IN_PROGRESS") {
    if (!isExpired(new Date(), attempt.deadlineAt)) redirect(`/deneme/${attempt.id}`);
    await finalizeAttempt(user.id, attempt.id);
    attempt = await getResultData(user.id, attemptId);
    if (!attempt) notFound();
  }

  const summary = (attempt.summary ?? {}) as Summary;
  const total = attempt.exam.questions.length;
  const avg = summary.avgSecondsPerQuestion ?? (total ? Math.round((attempt.durationSeconds ?? 0) / total) : 0);
  const prev = summary.previousScorePercent ?? null;
  const delta = prev === null || attempt.scorePercent === null ? null : Math.round((attempt.scorePercent - prev) * 10) / 10;
  const answerByQ = new Map<string, { selectedLabel: string | null; timeSpentSeconds: number }>(
    attempt.answers.map((a) => [a.questionId, a] as const),
  );
  const rec = attempt.recommendation;
  const recFocus = (rec?.focusTopics ?? {}) as { focus?: Array<{ name: string; percent: number }>; strong?: Array<{ name: string; percent: number }> };
  const recReview = (rec?.reviewList ?? []) as string[];
  const recVocab = (rec?.vocabularyToReview ?? []) as Array<{ term: string; meaningTr: string }>;

  const placement =
    attempt.exam.kind === "PLACEMENT"
      ? ((await prisma.profile.findUnique({ where: { userId: user.id }, select: { startingPlan: true } }))?.startingPlan as PlacementResult | null)
      : null;

  const items: ReviewItem[] = attempt.exam.questions.map(({ position, question }) => {
    const a = answerByQ.get(question.id);
    const selected = a?.selectedLabel ?? null;
    const outcome = outcomeOf(selected, question.correctLabel);
    return {
      position,
      typeLabel: QUESTION_TYPE_LABELS[question.type as QuestionTypeKey],
      topicName: question.topic.name,
      subtopic: question.subtopic,
      difficultyLabel: DIFFICULTY_LABELS[question.difficulty as DifficultyKey],
      passage: question.passage,
      stem: question.stem,
      options: question.options.map((o) => ({ label: o.label, text: o.text, rationale: o.rationale, isCorrect: o.isCorrect })),
      correctLabel: question.correctLabel,
      selectedLabel: selected,
      outcome,
      explanation: question.explanation,
      strategy: question.strategy,
      tip: question.tip,
      keywords: readKeywords(question.keywords),
      feedback: personalFeedback({ outcome, type: question.type as QuestionTypeKey, timeSpentSeconds: a?.timeSpentSeconds ?? 0, averageSecondsPerQuestion: avg || 60 }),
      timeSpentSeconds: a?.timeSpentSeconds ?? 0,
    };
  });

  const headline =
    (attempt.scorePercent ?? 0) >= 70 ? "Bugünkü çalışmanı güçlü bir sonuçla tamamladın." : "Bugünkü çalışmanı tamamladın.";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Aşama 3 · Sonuç ve açıklamalar"
        title={attempt.exam.title}
        description={
          <>
            {headline}
            {attempt.autoSubmitted ? " Süre dolduğu için deneme otomatik olarak tamamlandı; o ana kadarki tüm cevapların değerlendirildi." : ""}
          </>
        }
        actions={
          <>
            <ButtonLink href="/panel" variant="secondary">
              Panele dön
            </ButtonLink>
            <ButtonLink href="/kelimeler/tekrar">Kelime tekrarı</ButtonLink>
          </>
        }
      />

      {placement ? (
        <Card aria-labelledby="seviye-baslik">
          <CardTitle id="seviye-baslik">Başlangıç seviyesi</CardTitle>
          <p className="mt-2 text-3xl font-extrabold text-brand-800 dark:text-brand-200">{placement.levelLabel}</p>
          <p className="mt-1 text-[15px] text-zinc-800 dark:text-zinc-200">{placement.levelDescription}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="font-semibold">Güçlü konular</h3>
              <p className="mt-1 text-[15px]">{placement.strongTypes.length ? placement.strongTypes.map((t) => QUESTION_TYPE_LABELS[t]).join(", ") : "Henüz belirgin değil; ilk denemelerle netleşecek."}</p>
            </div>
            <div>
              <h3 className="font-semibold">Geliştirilmesi gereken konular</h3>
              <p className="mt-1 text-[15px]">{placement.weakTypes.length ? placement.weakTypes.map((t) => QUESTION_TYPE_LABELS[t]).join(", ") : "Belirgin bir zayıf alan görünmüyor."}</p>
            </div>
          </div>
          <p className="mt-4 text-[15px]">
            <span className="font-semibold">Önerilen günlük çalışma süresi:</span> yaklaşık {placement.recommendedDailyMinutes} dakika
          </p>
          <h3 className="mt-4 font-semibold">Başlangıç kamp planı (ilk hafta)</h3>
          <ol className="mt-2 grid gap-2 sm:grid-cols-2">
            {placement.plan.map((p) => (
              <li key={p.day} className="rounded-xl bg-brand-50 px-3 py-2 text-[15px] dark:bg-zinc-800/60">
                <span className="font-semibold">{p.day}. gün:</span> {p.focus.join(", ")}
              </li>
            ))}
          </ol>
          <Alert tone="info" className="mt-4">
            {placement.disclaimer}
          </Alert>
        </Card>
      ) : null}

      <section aria-labelledby="ozet-baslik">
        <h2 id="ozet-baslik" className="sr-only">
          Özet
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Doğru" value={attempt.correctCount ?? 0} />
          <StatCard label="Yanlış" value={attempt.wrongCount ?? 0} />
          <StatCard label="Boş" value={attempt.blankCount ?? 0} />
          <StatCard label="Başarı" value={`%${attempt.scorePercent ?? 0}`} />
          <StatCard label="Toplam süre" value={formatDurationTr(attempt.durationSeconds ?? 0)} />
          <StatCard label="Soru başına" value={formatDurationTr(avg)} />
          <StatCard
            label="Önceki denemeye göre"
            value={delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta} puan`}
            hint={prev === null ? "İlk değerlendirme" : `Önceki: %${prev}`}
          />
          <StatCard label="Soru sayısı" value={total} />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card aria-labelledby="konu-baslik">
          <CardTitle id="konu-baslik">Konu bazlı başarı</CardTitle>
          <div className="mt-4">
            <BarList caption="Konu bazlı başarı yüzdeleri" items={(summary.byTopic ?? []).map((b) => ({ label: b.label, percent: b.percent, detail: `${b.correct}/${b.total}` }))} />
          </div>
        </Card>
        <Card aria-labelledby="zorluk-baslik">
          <CardTitle id="zorluk-baslik">Zorluk seviyesine göre</CardTitle>
          <div className="mt-4">
            <BarList caption="Zorluk seviyesine göre başarı" items={(summary.byDifficulty ?? []).map((b) => ({ label: b.label, percent: b.percent, detail: `${b.correct}/${b.total}` }))} />
          </div>
        </Card>
      </div>

      {rec ? (
        <Card aria-labelledby="oneri-baslik" className="border-brand-200 bg-gradient-to-br from-white to-brand-50 dark:from-zinc-900 dark:to-brand-900/20">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">Aşama 4 · Günlük öneri</p>
          <CardTitle id="oneri-baslik" className="mt-1">
            Sana özel çalışma önerisi
          </CardTitle>
          <p className="mt-2 text-[16px] leading-relaxed">{rec.message}</p>
          {recFocus.focus && recFocus.focus.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {recFocus.focus.map((f) => (
                <Badge key={f.name} tone="warning">
                  Tekrar: {f.name}
                </Badge>
              ))}
            </div>
          ) : null}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <section>
              <h3 className="font-semibold">Bugünün tekrar listesi</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
                {recReview.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="font-semibold">Tekrar edilmesi gereken kelimeler</h3>
              {recVocab.length ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {recVocab.map((v) => (
                    <li key={v.term} className="rounded-lg bg-blush-100 px-2.5 py-1 text-sm text-blush-700 dark:bg-blush-700/30 dark:text-blush-100">
                      <span lang="en" className="font-semibold">
                        {v.term}
                      </span>{" "}
                      — {v.meaningTr}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[15px]">Bugün yeni kelime eklenmedi.</p>
              )}
            </section>
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white/80 px-3 py-2 dark:bg-zinc-800/60">
              <dt className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Önerilen ek soru</dt>
              <dd className="text-lg font-bold">{rec.extraQuestionCount} soru</dd>
            </div>
            <div className="rounded-xl bg-white/80 px-3 py-2 dark:bg-zinc-800/60">
              <dt className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Bir sonraki hedef</dt>
              <dd className="text-[15px]">{rec.nextGoal}</dd>
            </div>
          </dl>
        </Card>
      ) : null}

      <section aria-labelledby="aciklama-baslik" className="space-y-3">
        <h2 id="aciklama-baslik" className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Soru soru açıklamalar
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">Yanlış ve boş bıraktığın sorular açık olarak gösterilir.</p>
        {items.map((it) => (
          <QuestionReview key={it.position} item={it} defaultOpen={it.outcome !== "correct"} />
        ))}
      </section>
    </div>
  );
}
