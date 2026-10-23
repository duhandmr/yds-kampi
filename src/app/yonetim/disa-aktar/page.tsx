import type { Metadata } from "next";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Dışa aktar" };

const DATASETS = [
  { key: "questions", title: "Soru havuzu", text: "Tüm sorular, seçenekler, açıklamalar ve kalite durumu." },
  { key: "attempts", title: "Denemeler", text: "Tamamlanan ve devam eden denemelerin sonuçları." },
  { key: "performance", title: "Konu performansı", text: "Konu bazlı doğru/yanlış/boş ve ustalık skorları." },
  { key: "vocabulary", title: "Kelime listesi", text: "Kelimeler, anlamlar ve tekrar durumu." },
];

export default async function ExportPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Verileri dışa aktar" description="Dosyalar yalnızca yönetici oturumuyla indirilebilir. CSV dosyaları Excel ile uyumludur." />
      <ul className="grid gap-4 sm:grid-cols-2">
        {DATASETS.map((d) => (
          <li key={d.key}>
            <Card>
              <CardTitle>{d.title}</CardTitle>
              <CardDescription>{d.text}</CardDescription>
              <div className="mt-4 flex gap-2">
                <a className="inline-flex min-h-11 items-center rounded-xl bg-brand-700 px-4 font-semibold text-white hover:bg-brand-800 dark:bg-brand-500 dark:text-zinc-950" href={`/api/admin/export?dataset=${d.key}&format=csv`} download>
                  CSV
                </a>
                <a className="inline-flex min-h-11 items-center rounded-xl border border-brand-200 px-4 font-semibold text-brand-800 hover:bg-brand-50 dark:border-brand-800 dark:text-brand-200" href={`/api/admin/export?dataset=${d.key}&format=json`} download>
                  JSON
                </a>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
