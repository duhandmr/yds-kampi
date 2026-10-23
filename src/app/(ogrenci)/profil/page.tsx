import type { Metadata } from "next";
import { ChangePasswordForm, DeleteDataForm } from "@/components/profile/profile-forms";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/guards";
import { formatDateKeyTr } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/services/settings";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilePage() {
  const user = await requireUser();
  const [profile, settings] = await Promise.all([prisma.profile.findUnique({ where: { userId: user.id } }), getSettings()]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={`Profil · ${user.displayName}`} />
      <Card aria-labelledby="kamp-baslik">
        <CardTitle id="kamp-baslik">Kamp bilgileri</CardTitle>
        <dl className="mt-3 grid gap-3 text-[15px] sm:grid-cols-2">
          <div>
            <dt className="text-sm text-zinc-600 dark:text-zinc-400">Kamp başlangıcı</dt>
            <dd className="font-semibold">{formatDateKeyTr(settings.campStartDate)}</dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-600 dark:text-zinc-400">Sınav tarihi</dt>
            <dd className="font-semibold">{settings.examDate ? formatDateKeyTr(settings.examDate) : "Henüz belirlenmedi"}</dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-600 dark:text-zinc-400">Başlangıç seviyesi (uygulama içi gösterge)</dt>
            <dd className="font-semibold">{profile?.estimatedLevel ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-600 dark:text-zinc-400">Önerilen günlük süre</dt>
            <dd className="font-semibold">{profile?.recommendedDailyMinutes ? `${profile.recommendedDailyMinutes} dakika` : "—"}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink href="/karsilama?tekrar=1" variant="secondary">
            Bilgilendirmeyi tekrar göster
          </ButtonLink>
          <a href="/api/me/export" className="inline-flex min-h-11 items-center rounded-xl px-4 font-semibold text-brand-800 hover:bg-brand-100 dark:text-brand-200 dark:hover:bg-zinc-800" download>
            Verilerimi indir (JSON)
          </a>
        </div>
      </Card>
      <Card aria-labelledby="parola-baslik">
        <CardTitle id="parola-baslik">Parola</CardTitle>
        <CardDescription>Parolan güvenli biçimde (tuzlanmış özet olarak) saklanır.</CardDescription>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </Card>
      <Card aria-labelledby="sil-baslik">
        <CardTitle id="sil-baslik">Çalışma verilerini sil</CardTitle>
        <div className="mt-4">
          <DeleteDataForm />
        </div>
      </Card>
    </div>
  );
}
