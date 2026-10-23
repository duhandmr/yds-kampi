import { Disclosure } from "@/components/ui/disclosure";
import type { Lesson } from "@/content/topics";

export function LessonCard({ name, lesson, questionCount, defaultOpen }: { name: string; lesson: Lesson; questionCount: number; defaultOpen?: boolean }) {
  return (
    <article className="rounded-2xl border border-brand-100 bg-white/90 p-5 dark:border-zinc-800 dark:bg-zinc-900/80">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{name}</h2>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Bugün {questionCount} soru</span>
      </header>
      <p className="mt-2 text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200">{lesson.summary}</p>
      <div className="mt-4 space-y-2">
        <Disclosure summary="Temel kurallar" defaultOpen={defaultOpen}>
          <ul className="list-disc space-y-1 pl-5">
            {lesson.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Disclosure>
        <Disclosure summary="Sık yapılan hatalar">
          <ul className="list-disc space-y-1 pl-5">
            {lesson.mistakes.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Disclosure>
        <Disclosure summary="Sınav stratejisi">
          <p>{lesson.strategy}</p>
        </Disclosure>
        <Disclosure summary="Çözümlü örnekler">
          <ol className="space-y-3">
            {lesson.examples.map((e) => (
              <li key={e.question} className="rounded-lg bg-brand-50 p-3 dark:bg-zinc-800/60">
                <p className="font-medium">{e.question}</p>
                <p className="mt-1">
                  <span className="font-semibold text-brand-800 dark:text-brand-200">Cevap:</span> {e.answer}
                </p>
                <p className="mt-1 text-zinc-700 dark:text-zinc-300">{e.explanation}</p>
              </li>
            ))}
          </ol>
        </Disclosure>
        <Disclosure summary="Bilinmesi gereken kelimeler">
          <dl className="grid gap-2 sm:grid-cols-2">
            {lesson.vocabulary.map((v) => (
              <div key={v.term} className="rounded-lg bg-blush-50 px-3 py-2 dark:bg-zinc-800/60">
                <dt className="font-semibold">{v.term}</dt>
                <dd className="text-zinc-700 dark:text-zinc-300">{v.meaning}</dd>
              </div>
            ))}
          </dl>
        </Disclosure>
      </div>
    </article>
  );
}
