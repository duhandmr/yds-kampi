import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/cn";
import type { KeywordEntry } from "@/lib/questions/types";

export interface ReviewItem {
  position: number;
  typeLabel: string;
  topicName: string;
  subtopic: string;
  difficultyLabel: string;
  passage: string | null;
  stem: string;
  options: Array<{ label: string; text: string; rationale: string; isCorrect: boolean }>;
  correctLabel: string;
  selectedLabel: string | null;
  outcome: "correct" | "wrong" | "blank";
  explanation: string;
  strategy: string;
  tip: string;
  keywords: KeywordEntry[];
  feedback: string;
  timeSpentSeconds: number;
}

const OUTCOME = {
  correct: { text: "Doğru", tone: "success" as const, icon: "✓" },
  wrong: { text: "Yanlış", tone: "danger" as const, icon: "✕" },
  blank: { text: "Boş", tone: "neutral" as const, icon: "–" },
};

export function QuestionReview({ item, defaultOpen }: { item: ReviewItem; defaultOpen?: boolean }) {
  const o = OUTCOME[item.outcome];
  return (
    <details open={defaultOpen} className="group rounded-2xl border border-brand-100 bg-white/95 dark:border-zinc-800 dark:bg-zinc-900/85">
      <summary className="flex cursor-pointer flex-wrap items-center gap-2 rounded-2xl px-4 py-3 hover:bg-brand-50 dark:hover:bg-zinc-800/70">
        <span className="font-bold text-zinc-900 dark:text-zinc-50">{item.position}. soru</span>
        <Badge tone={o.tone}>
          <span aria-hidden="true" className="mr-1">
            {o.icon}
          </span>
          {o.text}
        </Badge>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {item.typeLabel} · {item.difficultyLabel}
        </span>
        <span aria-hidden="true" className="ml-auto text-brand-700 transition-transform group-open:rotate-180 dark:text-brand-300">
          ▾
        </span>
      </summary>
      <div className="space-y-4 px-4 pb-5 text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200">
        {item.passage ? (
          <div lang="en" className="whitespace-pre-line rounded-xl bg-brand-50 p-3 dark:bg-zinc-800/60">
            {item.passage}
          </div>
        ) : null}
        <p className="whitespace-pre-line font-medium text-zinc-900 dark:text-zinc-50">{item.stem}</p>

        <dl className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-emerald-50 px-3 py-2 dark:bg-emerald-900/30">
            <dt className="text-xs font-semibold uppercase text-emerald-800 dark:text-emerald-200">Doğru cevap</dt>
            <dd className="font-bold text-emerald-900 dark:text-emerald-100">{item.correctLabel}</dd>
          </div>
          <div className={cn("rounded-xl px-3 py-2", item.outcome === "wrong" ? "bg-red-50 dark:bg-red-900/30" : "bg-zinc-50 dark:bg-zinc-800/60")}>
            <dt className="text-xs font-semibold uppercase text-zinc-700 dark:text-zinc-300">Senin cevabın</dt>
            <dd className="font-bold">{item.selectedLabel ?? "Boş bırakıldı"}</dd>
          </div>
        </dl>

        <p className="rounded-xl border border-brand-100 bg-brand-50/60 px-3 py-2 dark:border-brand-900 dark:bg-brand-900/20">{item.feedback}</p>

        <section>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Açıklama</h3>
          <p className="mt-1">{item.explanation}</p>
        </section>

        <section>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Seçenekler</h3>
          <ul className="mt-2 space-y-2">
            {item.options.map((opt) => {
              const chosen = item.selectedLabel === opt.label;
              return (
                <li
                  key={opt.label}
                  className={cn(
                    "rounded-xl border px-3 py-2",
                    opt.isCorrect
                      ? "border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-900/20"
                      : chosen
                        ? "border-red-300 bg-red-50/70 dark:border-red-800 dark:bg-red-900/20"
                        : "border-zinc-200 dark:border-zinc-700",
                  )}
                >
                  <p>
                    <span className="font-bold">{opt.label})</span> <span lang="en">{opt.text}</span>
                    {opt.isCorrect ? <span className="ml-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200">(doğru seçenek)</span> : null}
                    {chosen && !opt.isCorrect ? <span className="ml-2 text-xs font-semibold text-red-800 dark:text-red-200">(senin seçimin)</span> : null}
                  </p>
                  <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{opt.rationale}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <section className="rounded-xl bg-blush-50 p-3 dark:bg-zinc-800/60">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Ölçülen konu</h3>
            <p className="mt-1">
              {item.topicName} · {item.subtopic}
            </p>
          </section>
          <section className="rounded-xl bg-blush-50 p-3 dark:bg-zinc-800/60">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Çözüm stratejisi</h3>
            <p className="mt-1">{item.strategy}</p>
          </section>
        </div>
        <section>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Benzer sorularda dikkat</h3>
          <p className="mt-1">{item.tip}</p>
        </section>
        {item.keywords.length > 0 ? (
          <section>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Önemli kelimeler</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {item.keywords.map((k) => (
                <li key={k.term} className="rounded-lg bg-brand-100 px-2.5 py-1 text-sm text-brand-900 dark:bg-brand-900/40 dark:text-brand-100">
                  <span className="font-semibold" lang="en">
                    {k.term}
                  </span>{" "}
                  — {k.meaningTr}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </details>
  );
}
