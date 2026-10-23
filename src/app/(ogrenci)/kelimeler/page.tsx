import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { VOCAB_STATUSES, VOCAB_STATUS_LABELS, type VocabStatusKey } from "@/lib/constants";
import { formatDateTimeTr } from "@/lib/dates";
import { listVocabulary } from "@/lib/services/vocabulary";

export const metadata: Metadata = { title: "Kelimeler" };
export const dynamic = "force-dynamic";

const TONE: Record<VocabStatusKey, "brand" | "warning" | "success" | "neutral"> = { NEW: "brand", LEARNING: "neutral", REVIEW: "warning", LEARNED: "success" };

export default async function VocabularyPage({ searchParams }: { searchParams: Promise<{ durum?: string }> }) {
  const user = await requireOnboardedUser();
  const { durum } = await searchParams;
  const status = (VOCAB_STATUSES as readonly string[]).includes(durum ?? "") ? (durum as VocabStatusKey) : undefined;
  const items = await listVocabulary(user.id, status);
  const now = new Date();

  return (
    <div>
      <PageHeader
        title="Kelime listem"
        description="Yanlış yaptığın sorulardaki önemli kelimeler otomatik olarak buraya eklenir ve aralıklı tekrarla planlanır."
        actions={<ButtonLink href="/kelimeler/tekrar">Tekrara başla</ButtonLink>}
      />
      <nav aria-label="Duruma göre filtrele" className="mb-4 flex flex-wrap gap-2">
        {[{ key: "", label: "Tümü" }, ...VOCAB_STATUSES.map((s) => ({ key: s, label: VOCAB_STATUS_LABELS[s] }))].map((f) => {
          const active = (status ?? "") === f.key;
          return (
            <Link
              key={f.key || "tumu"}
              href={f.key ? `/kelimeler?durum=${f.key}` : "/kelimeler"}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold",
                active ? "bg-brand-700 text-white dark:bg-brand-400 dark:text-zinc-950" : "bg-white text-zinc-800 hover:bg-brand-50 dark:bg-zinc-900 dark:text-zinc-200",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>
      {items.length === 0 ? (
        <EmptyState title="Bu listede kelime yok">Denemelerde yanlış veya boş bıraktığın sorulardaki kelimeler burada görünecek.</EmptyState>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((v) => (
            <li key={v.id} className="rounded-2xl border border-brand-100 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p lang="en" className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    {v.term}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{v.partOfSpeech}</p>
                </div>
                <Badge tone={TONE[v.status as VocabStatusKey]}>{VOCAB_STATUS_LABELS[v.status as VocabStatusKey]}</Badge>
              </div>
              <p className="mt-2 text-[15px]">{v.meaningTr}</p>
              {v.exampleEn ? (
                <p className="mt-2 text-[15px]">
                  <span lang="en" className="italic">
                    {v.exampleEn}
                  </span>
                  {v.exampleTr ? <span className="block text-sm text-zinc-700 dark:text-zinc-300">{v.exampleTr}</span> : null}
                </p>
              ) : null}
              {v.synonyms.length || v.antonyms.length ? (
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {v.synonyms.length ? <>Eş: <span lang="en">{v.synonyms.join(", ")}</span></> : null}
                  {v.synonyms.length && v.antonyms.length ? " · " : null}
                  {v.antonyms.length ? <>Zıt: <span lang="en">{v.antonyms.join(", ")}</span></> : null}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                Son görülme: {v.lastSeenAt ? formatDateTimeTr(v.lastSeenAt) : "—"} · {v.dueAt <= now ? "Tekrar zamanı geldi" : `Sonraki tekrar: ${formatDateTimeTr(v.dueAt)}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
