import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireAdmin } from "@/lib/auth/guards";
import { QUALITY_STATUS_LABELS, QUALITY_STATUSES } from "@/lib/constants";
import { formatDateTimeTr } from "@/lib/dates";
import { getAdminOverview } from "@/lib/services/admin";

export const metadata: Metadata = { title: "Yönetim" };
export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  await requireAdmin();
  const data = await getAdminOverview();

  return (
    <div className="space-y-6">
      <PageHeader title="Yönetim paneli" description="Soru havuzunun durumu, öğrenci ilerlemesi ve son yapay zekâ işlemleri." />
      <section aria-labelledby="havuz-baslik">
        <h2 id="havuz-baslik" className="mb-3 text-lg font-semibold">
          Soru havuzu
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {QUALITY_STATUSES.map((s) => (
            <StatCard key={s} label={QUALITY_STATUS_LABELS[s]} value={data.questionCounts[s] ?? 0} />
          ))}
        </div>
      </section>

      {data.learners.length === 0 ? (
        <EmptyState title="Henüz öğrenci hesabı yok">README içindeki adımlarla öğrenci hesabını oluşturabilirsiniz.</EmptyState>
      ) : (
        data.learners.map((l) => (
          <Card key={l.id} aria-labelledby={`ogrenci-${l.id}`}>
            <CardTitle id={`ogrenci-${l.id}`}>{l.profile?.displayName ?? "Öğrenci"} · ilerleme</CardTitle>
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
              Başlangıç seviyesi: {l.profile?.estimatedLevel ?? "—"} · Seri: {l.streak?.currentStreak ?? 0} gün · Toplam çalışma günü: {l.streak?.totalStudyDays ?? 0}
            </p>
            <div className="mt-4 grid gap-5 lg:grid-cols-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="mb-2 text-left font-semibold">Son denemeler</caption>
                  <thead className="text-zinc-600 dark:text-zinc-400">
                    <tr>
                      <th scope="col" className="py-1 pr-2">Tarih</th>
                      <th scope="col" className="py-1 pr-2">Deneme</th>
                      <th scope="col" className="py-1 pr-2">D/Y/B</th>
                      <th scope="col" className="py-1">Başarı</th>
                    </tr>
                  </thead>
                  <tbody>
                    {l.attempts.map((a) => (
                      <tr key={a.id} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="py-1.5 pr-2">{a.completedAt ? formatDateTimeTr(a.completedAt) : "—"}</td>
                        <td className="py-1.5 pr-2">
                          {a.exam.title}
                          {a.autoSubmitted ? <Badge tone="neutral" className="ml-1">süre doldu</Badge> : null}
                        </td>
                        <td className="py-1.5 pr-2 tabular-nums">
                          {a.correctCount}/{a.wrongCount}/{a.blankCount}
                        </td>
                        <td className="py-1.5 tabular-nums">%{a.scorePercent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="mb-2 text-left font-semibold">Konu performansı (zayıftan güçlüye)</caption>
                  <thead className="text-zinc-600 dark:text-zinc-400">
                    <tr>
                      <th scope="col" className="py-1 pr-2">Konu</th>
                      <th scope="col" className="py-1 pr-2">Soru</th>
                      <th scope="col" className="py-1">Ustalık</th>
                    </tr>
                  </thead>
                  <tbody>
                    {l.topicPerformances.map((p) => (
                      <tr key={p.id} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="py-1.5 pr-2">{p.topic.name}</td>
                        <td className="py-1.5 pr-2 tabular-nums">{p.questionsSeen}</td>
                        <td className="py-1.5 tabular-nums">%{Math.round(p.masteryScore * 100)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        ))
      )}

      <Card aria-labelledby="ai-log-baslik">
        <CardTitle id="ai-log-baslik">Son yapay zekâ işlemleri</CardTitle>
        {data.recentLogs.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">Henüz kayıt yok.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {data.recentLogs.map((log) => (
              <li key={log.id} className="flex flex-wrap items-center gap-2">
                <span className="text-zinc-600 dark:text-zinc-400">{formatDateTimeTr(log.createdAt)}</span>
                <Badge tone={log.status === "SUCCESS" ? "success" : log.status === "PARTIAL" ? "warning" : "danger"}>{log.status}</Badge>
                <span>{log.task}</span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {log.requestSummary} · kabul {log.itemsAccepted} / red {log.itemsRejected}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
