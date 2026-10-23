import type { Metadata } from "next";
import Link from "next/link";
import { GenerationForm } from "@/components/admin/generation-form";
import { StatusButton } from "@/components/admin/status-button";
import { Alert } from "@/components/ui/alert";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getAiProvider } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth/guards";
import { DIFFICULTY_LABELS, QUESTION_TYPE_LABELS, type DifficultyKey, type QuestionTypeKey } from "@/lib/constants";
import { prisma } from "@/lib/db";
import type { QualityReport } from "@/lib/questions/quality";
import { getSettings } from "@/lib/services/settings";

export const metadata: Metadata = { title: "Soru üretimi" };
export const dynamic = "force-dynamic";

export default async function GenerationPage({ searchParams }: { searchParams: Promise<{ durum?: string; hata?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const [settings, topics, pending] = await Promise.all([
    getSettings(),
    prisma.topic.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { slug: true, name: true, questionType: true } }),
    prisma.question.findMany({
      where: { qualityStatus: "PENDING_REVIEW", deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { options: { orderBy: { label: "asc" } }, topic: { select: { name: true } } },
    }),
  ]);
  const configured = getAiProvider() !== null;

  return (
    <div className="space-y-6">
      <PageHeader title="Soru üretimi ve inceleme" description="Yapay zekâ çıktıları doğrudan güvenilir kabul edilmez: şema doğrulaması, otomatik kalite kontrolü ve bağımsız çözüm kontrolünden geçer, ardından incelemenize sunulur." />
      {!configured || !settings.aiEnabled ? (
        <Alert tone="info">
          Yapay zekâ şu anda {configured ? "ayarlardan kapalı" : "yapılandırılmamış"}. Uygulama, kalite kontrolünden geçmiş soru havuzuyla çalışmaya devam eder.
        </Alert>
      ) : null}
      {sp.hata === "kalite" ? <Alert tone="error">Soru kalite kontrolünden geçemediği için yayımlanamadı.</Alert> : null}
      <Card>
        <CardTitle>Manuel üretim</CardTitle>
        <div className="mt-4">
          <GenerationForm topics={topics} />
        </div>
      </Card>
      <section aria-labelledby="inceleme-baslik" className="space-y-3">
        <h2 id="inceleme-baslik" className="text-xl font-bold">
          İnceleme bekleyen sorular ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <EmptyState title="İnceleme bekleyen soru yok" />
        ) : (
          pending.map((q) => {
            const report = q.qualityReport as QualityReport | null;
            return (
              <Card key={q.id}>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {QUESTION_TYPE_LABELS[q.type as QuestionTypeKey]} · {q.topic.name} · {DIFFICULTY_LABELS[q.difficulty as DifficultyKey]} · {q.source}
                </p>
                {q.passage ? (
                  <p lang="en" className="mt-2 whitespace-pre-line rounded-lg bg-brand-50 p-3 text-[15px] dark:bg-zinc-800/60">
                    {q.passage}
                  </p>
                ) : null}
                <p lang="en" className="mt-2 whitespace-pre-line font-medium">
                  {q.stem}
                </p>
                <ul className="mt-2 space-y-1 text-[15px]">
                  {q.options.map((o) => (
                    <li key={o.id} className={o.isCorrect ? "font-semibold text-emerald-800 dark:text-emerald-200" : undefined}>
                      {o.label}) <span lang="en">{o.text}</span>
                      {o.isCorrect ? " ✓" : ""}
                      <span className="block text-sm font-normal text-zinc-600 dark:text-zinc-400">{o.rationale}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[15px]">{q.explanation}</p>
                {report && !report.passed ? (
                  <Alert tone="warning" className="mt-2">
                    {report.issues.map((i) => i.message).join(" ")}
                  </Alert>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusButton id={q.id} status="APPROVED" label="Onayla ve yayımla" back="/yonetim/uretim" variant="primary" />
                  <StatusButton id={q.id} status="REJECTED" label="Reddet" back="/yonetim/uretim" variant="danger" />
                  <Link href={`/yonetim/sorular/${q.id}`} className="inline-flex min-h-9 items-center rounded-xl px-3 text-sm font-semibold text-brand-800 hover:bg-brand-100 dark:text-brand-200 dark:hover:bg-zinc-800">
                    Düzenle
                  </Link>
                </div>
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}
