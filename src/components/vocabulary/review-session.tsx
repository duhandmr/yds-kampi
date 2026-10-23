"use client";

import { useState } from "react";
import { reviewVocabularyAction } from "@/app/actions/vocabulary";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";

export interface ReviewCard {
  id: string;
  term: string;
  meaningTr: string;
  partOfSpeech: string;
  exampleEn: string | null;
  exampleTr: string | null;
  synonyms: string[];
  antonyms: string[];
}

const GRADES = [
  { grade: 0 as const, label: "Tekrar", hint: "Hatırlamadım", variant: "secondary" as const },
  { grade: 1 as const, label: "Zor", hint: "Zorlandım", variant: "secondary" as const },
  { grade: 2 as const, label: "İyi", hint: "Hatırladım", variant: "primary" as const },
  { grade: 3 as const, label: "Kolay", hint: "Çok kolaydı", variant: "soft" as const },
];

export function ReviewSession({ cards }: { cards: ReviewCard[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (index >= cards.length) {
    return (
      <div className="rounded-2xl border border-brand-100 bg-white/90 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/80">
        <p className="text-lg font-semibold">Bugünkü kelime tekrarını tamamladın.</p>
        <p className="mt-1 text-zinc-700 dark:text-zinc-300">Kelimeler, hatırlama durumuna göre ileriki günlere planlandı.</p>
        <ButtonLink href="/panel" className="mt-4">
          Panele dön
        </ButtonLink>
      </div>
    );
  }

  const card = cards[index]!;

  async function grade(g: 0 | 1 | 2 | 3) {
    setPending(true);
    setError(null);
    const res = await reviewVocabularyAction({ itemId: card.id, grade: g });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  return (
    <div className="space-y-4">
      <ProgressBar value={index} max={cards.length} label="Kelime tekrarı ilerlemesi" />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {index + 1} / {cards.length}
      </p>
      <article className="rounded-3xl border border-brand-100 bg-white/95 p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90" aria-live="polite">
        <p lang="en" className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {card.term}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{card.partOfSpeech}</p>
        {revealed ? (
          <div className="mt-5 space-y-3 text-left text-[15px]">
            <p>
              <span className="font-semibold">Anlamı:</span> {card.meaningTr}
            </p>
            {card.exampleEn ? (
              <p>
                <span className="font-semibold">Örnek:</span> <span lang="en">{card.exampleEn}</span>
                {card.exampleTr ? <span className="block text-zinc-700 dark:text-zinc-300">{card.exampleTr}</span> : null}
              </p>
            ) : null}
            {card.synonyms.length ? (
              <p>
                <span className="font-semibold">Eş anlamlılar:</span> <span lang="en">{card.synonyms.join(", ")}</span>
              </p>
            ) : null}
            {card.antonyms.length ? (
              <p>
                <span className="font-semibold">Zıt anlamlılar:</span> <span lang="en">{card.antonyms.join(", ")}</span>
              </p>
            ) : null}
          </div>
        ) : (
          <Button className="mt-6" onClick={() => setRevealed(true)}>
            Anlamı göster
          </Button>
        )}
      </article>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {revealed ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Ne kadar iyi hatırladın?">
          {GRADES.map((g) => (
            <Button key={g.grade} variant={g.variant} onClick={() => grade(g.grade)} disabled={pending} aria-label={`${g.label}: ${g.hint}`}>
              {g.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
