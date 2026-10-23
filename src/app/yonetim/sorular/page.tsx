import type { Metadata } from "next";
import Link from "next/link";
import { StatusButton } from "@/components/admin/status-button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth/guards";
import {
  DIFFICULTY_LABELS,
  QUALITY_STATUSES,
  QUALITY_STATUS_LABELS,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  type DifficultyKey,
  type QualityStatusKey,
  type QuestionTypeKey,
} from "@/lib/constants";
import { listQuestions } from "@/lib/services/questions-admin";

export const metadata: Metadata = { title: "Sorular" };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<QualityStatusKey, "success" | "warning" | "danger" | "neutral"> = {
  APPROVED: "success",
  PENDING_REVIEW: "warning",
  REJECTED: "danger",
  DISABLED: "neutral",
};

export default async function AdminQuestionsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (QUALITY_STATUSES as readonly string[]).includes(sp.durumFiltre ?? "") ? (sp.durumFiltre as QualityStatusKey) : undefined;
  const type = (QUESTION_TYPES as readonly string[]).includes(sp.tip ?? "") ? (sp.tip as QuestionTypeKey) : undefined;
  const q = (sp.q ?? "").slice(0, 100) || undefined;
  const page = Math.max(1, Math.min(1000, Number(sp.sayfa) || 1));
  const { items, total, pages } = await listQuestions({ status, type, q, page });
  const qs = new URLSearchParams(Object.entries({ durumFiltre: status ?? "", tip: type ?? "", q: q ?? "" }).filter(([, v]) => v) as Array<[string, string]>);
  const back = `/yonetim/sorular${qs.toString() ? `?${qs.toString()}` : ""}`;

  return (
    <div>
      <PageHeader title="Sorular" description={`${total} soru bulundu.`} actions={<ButtonLink href="/yonetim/sorular/yeni">Yeni soru</ButtonLink>} />
      {sp.hata === "kalite" ? <Alert tone="error" className="mb-4">Soru kalite kontrolünden geçemediği için yayımlanamadı. Düzenleme sayfasında ayrıntıları görebilirsiniz.</Alert> : null}
      {sp.durum === "guncellendi" ? <Alert tone="success" className="mb-4">Soru durumu güncellendi.</Alert> : null}
      <form className="mb-5 grid gap-3 rounded-2xl border border-brand-100 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70 sm:grid-cols-4" role="search">
        <Field label="Durum" htmlFor="durumFiltre">
          <Select id="durumFiltre" name="durumFiltre" defaultValue={status ?? ""}>
            <option value="">Tümü</option>
            {QUALITY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {QUALITY_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Soru tipi" htmlFor="tip">
          <Select id="tip" name="tip" defaultValue={type ?? ""}>
            <option value="">Tümü</option>
            {QUESTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {QUESTION_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Metinde ara" htmlFor="q">
          <Input id="q" name="q" defaultValue={q ?? ""} />
        </Field>
        <div className="flex items-end">
          <button type="submit" className="min-h-11 w-full rounded-xl bg-brand-700 px-4 font-semibold text-white hover:bg-brand-800 dark:bg-brand-500 dark:text-zinc-950">
            Filtrele
          </button>
        </div>
      </form>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-2xl border border-brand-100 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge tone={STATUS_TONE[item.qualityStatus as QualityStatusKey]}>{QUALITY_STATUS_LABELS[item.qualityStatus as QualityStatusKey]}</Badge>
              <span className="font-semibold">{QUESTION_TYPE_LABELS[item.type as QuestionTypeKey]}</span>
              <span className="text-zinc-600 dark:text-zinc-400">
                {item.topic.name} · {DIFFICULTY_LABELS[item.difficulty as DifficultyKey]} · {item.source}
              </span>
              <span className="text-zinc-600 dark:text-zinc-400">{item._count.exposures > 0 ? "Yaren gördü" : "Henüz görülmedi"}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-[15px]" lang="en">
              {item.passage ? `${item.passage.slice(0, 120)}… ` : ""}
              {item.stem}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ButtonLink href={`/yonetim/sorular/${item.id}`} size="sm" variant="soft">
                Görüntüle / düzenle
              </ButtonLink>
              {item.qualityStatus !== "APPROVED" ? <StatusButton id={item.id} status="APPROVED" label="Yayımla" back={back} variant="primary" /> : null}
              {item.qualityStatus !== "DISABLED" ? <StatusButton id={item.id} status="DISABLED" label="Devre dışı bırak" back={back} /> : null}
            </div>
          </li>
        ))}
      </ul>
      {pages > 1 ? (
        <nav aria-label="Sayfalar" className="mt-5 flex flex-wrap gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams(qs);
            params.set("sayfa", String(p));
            return (
              <Link
                key={p}
                href={`/yonetim/sorular?${params.toString()}`}
                aria-current={p === page ? "page" : undefined}
                className={`inline-flex size-10 items-center justify-center rounded-lg font-semibold ${p === page ? "bg-brand-700 text-white" : "bg-white dark:bg-zinc-900"}`}
              >
                {p}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
