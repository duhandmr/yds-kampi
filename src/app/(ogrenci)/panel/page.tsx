import type { Metadata } from "next";
import Link from "next/link";
import { ScoreTrendChart } from "@/components/dashboard/score-trend-chart";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { VOCAB_STATUS_LABELS, type VocabStatusKey } from "@/lib/constants";
import { formatDateKeyTr } from "@/lib/dates";
import { formatDurationTr } from "@/lib/exam/timing";
import { getDashboardData } from "@/lib/services/dashboard";

export const metadata: Metadata = { title: "Panel" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireOnboardedUser();
  const d = await getDashboardData(user.id);

  const daily = d.todayDaily;
  const dailyState = !daily ? "new" : !daily.attempt ? "ready" : daily.attempt.status === "COMPLETED" ? "done" : "progress";

  return (
    <div className="space-y-6">
      <section aria-labelledby="merhaba" className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 id="merhaba" className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Merhaba {user.displayName}
          </h1>
          <p className="mt-1 text-[15px] text-zinc-700 dark:text-zinc-300">
            {d.studiedToday ? "Seriyi devam ettiriyorsun. Bugün de hedef tamamlandı." : "Bugünkü çalışman seni bekliyor."}
          </p>
        </div>
        {d.progress.daysLeft !== null ? (
          <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-blush-600 px-5 py-3 text-white shadow-md">
            <p className="text-sm font-medium opacity-90">Sınava kalan</p>
            <p className="text-3xl font-extrabold">{d.progress.daysLeft} gün</p>
            {d.settings.examDate ? <p className="text-xs opacity-90">{formatDateKeyTr(d.settings.examDate)}</p> : null}
          </div>
        ) : null}
      </section>

      <Card aria-labelledby="bugun-baslik" className="border-brand-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle id="bugun-baslik">Bugünün denemesi</CardTitle>
            <CardDescription>
              {dailyState === "done"
                ? `Bugünkü çalışmanı tamamladın. Başarı: %${daily?.attempt?.scorePercent ?? 0}`
                : dailyState === "progress"
                  ? "Denemen devam ediyor; cevapların kayıtlı."
                  : "Konu hazırlığı + süreli mini deneme + ayrıntılı açıklamalar."}
            </CardDescription>
          </div>
          {dailyState === "done" && daily?.attempt ? (
            <ButtonLink href={`/deneme/${daily.attempt.id}/sonuc`} variant="secondary">
              Sonuçları incele
            </ButtonLink>
          ) : dailyState === "progress" && daily?.attempt ? (
            <ButtonLink href={`/deneme/${daily.attempt.id}`}>Denemeye dön</ButtonLink>
          ) : daily ? (
            <ButtonLink href={`/calisma/${daily.examId}`}>Hazırlığa geç</ButtonLink>
          ) : (
            <ButtonLink href="/calisma">Bugünün denemesini hazırla</ButtonLink>
          )}
        </div>
        {d.progress.percent !== null ? (
          <div className="mt-5">
            <div className="flex justify-between text-sm text-zinc-700 dark:text-zinc-300">
              <span>Kampın tamamlanma oranı</span>
              <span className="font-semibold">%{d.progress.percent}</span>
            </div>
            <ProgressBar value={d.progress.percent} label="Kampın tamamlanma oranı" className="mt-1.5" />
          </div>
        ) : null}
      </Card>

      <section aria-labelledby="istatistik-baslik">
        <h2 id="istatistik-baslik" className="sr-only">
          Genel istatistikler
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Çalışma serisi" value={`${d.streak} gün`} hint={`En uzun: ${d.longestStreak} gün`} icon="🔥" />
          <StatCard label="Toplam çözülen soru" value={d.totalSolved} icon="✎" />
          <StatCard label="Genel başarı oranı" value={`%${d.overallPercent}`} icon="◎" />
          <StatCard label="Tekrar bekleyen kelime" value={d.dueVocabCount} icon="Aa" />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card aria-labelledby="gelisim-baslik" className="lg:col-span-2">
          <CardTitle id="gelisim-baslik">Son {Math.max(1, d.lastSeven.length)} denemenin gelişimi</CardTitle>
          <div className="mt-4">
            <ScoreTrendChart data={d.lastSeven} />
          </div>
        </Card>
        <Card aria-labelledby="son-baslik">
          <CardTitle id="son-baslik">Son deneme</CardTitle>
          {d.lastAttempt ? (
            <div className="mt-3 space-y-2 text-[15px]">
              <p className="font-medium">{d.lastAttempt.exam.title}</p>
              <p>
                {d.lastAttempt.correctCount} doğru · {d.lastAttempt.wrongCount} yanlış · {d.lastAttempt.blankCount} boş
              </p>
              <p>
                Başarı <span className="font-bold">%{d.lastAttempt.scorePercent}</span> · {formatDurationTr(d.lastAttempt.durationSeconds ?? 0)}
              </p>
              <Link href={`/deneme/${d.lastAttempt.id}/sonuc`} className="inline-block font-semibold text-brand-800 underline underline-offset-4 dark:text-brand-200">
                Açıklamaları gör
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-[15px] text-zinc-700 dark:text-zinc-300">Henüz tamamlanmış deneme yok.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card aria-labelledby="guclu-baslik">
          <CardTitle id="guclu-baslik">Güçlü konular</CardTitle>
          {d.strong.length ? (
            <ul className="mt-3 space-y-2">
              {d.strong.map((t) => (
                <li key={t.name} className="flex items-center justify-between gap-2 text-[15px]">
                  <span>{t.name}</span>
                  <Badge tone="success">%{Math.round(t.mastery * 100)}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[15px] text-zinc-700 dark:text-zinc-300">Birkaç deneme sonra güçlü konuların burada görünecek.</p>
          )}
        </Card>
        <Card aria-labelledby="gelisen-baslik">
          <CardTitle id="gelisen-baslik">Geliştirilmesi gereken konular</CardTitle>
          {d.weak.length ? (
            <ul className="mt-3 space-y-2">
              {d.weak.map((t) => (
                <li key={t.name} className="flex items-center justify-between gap-2 text-[15px]">
                  <span>{t.name}</span>
                  <Badge tone="warning">%{Math.round(t.mastery * 100)}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[15px] text-zinc-700 dark:text-zinc-300">Şu an belirgin bir zayıf alan görünmüyor.</p>
          )}
          {d.weak.length ? <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Bu konular biraz daha tekrar istiyor; sonraki denemelerde daha sık karşılaşacaksın.</p> : null}
        </Card>
        <Card aria-labelledby="kelime-baslik">
          <CardTitle id="kelime-baslik">Tekrar bekleyen kelimeler</CardTitle>
          {d.dueVocab.length ? (
            <>
              <ul className="mt-3 space-y-1.5 text-[15px]">
                {d.dueVocab.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2">
                    <span>
                      <span lang="en" className="font-semibold">
                        {v.term}
                      </span>{" "}
                      — {v.meaningTr}
                    </span>
                    <Badge tone="neutral">{VOCAB_STATUS_LABELS[v.status as VocabStatusKey]}</Badge>
                  </li>
                ))}
              </ul>
              <ButtonLink href="/kelimeler/tekrar" variant="soft" size="sm" className="mt-4">
                Tekrara başla
              </ButtonLink>
            </>
          ) : (
            <p className="mt-3 text-[15px] text-zinc-700 dark:text-zinc-300">Şu an tekrar bekleyen kelime yok.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
