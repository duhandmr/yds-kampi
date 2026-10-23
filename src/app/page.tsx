import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";

const FEATURES = [
  { title: "Her gün yeni bir deneme", text: "Performansına göre hazırlanan, YDS tarzında özgün sorular." },
  { title: "Deneme öncesi konu anlatımı", text: "O gün ölçülecek konuların kısa özeti, kurallar ve çözümlü örnekler." },
  { title: "Cevaplara özel açıklamalar", text: "Her seçeneğin neden doğru ya da yanlış olduğu, strateji ve ipuçları." },
  { title: "Güçlü ve gelişen alanlar", text: "Konu bazlı başarı takibi ile hangi alanın tekrar istediğini net gör." },
  { title: "Günlük çalışma serisi", text: "Düzenli çalışmayı görünür kılan, sade bir seri takibi." },
  { title: "Kişiselleşen sorular", text: "Zorluk ve konu dağılımı geçmiş sonuçlarına göre her gün uyarlanır." },
  { title: "Sınava kadar ilerleme", text: "Kamp takvimi, kalan gün sayacı ve son denemelerin gelişimi." },
];

const STEPS = [
  { title: "Hazırlan", text: "Günün konularını kısa anlatımlar ve çözümlü örneklerle gözden geçir." },
  { title: "Çöz", text: "Süreli mini denemeyi çöz; cevapların otomatik olarak kaydedilir." },
  { title: "İncele", text: "Sonuçlarını konu ve zorluk bazında gör, her sorunun ayrıntılı açıklamasını oku." },
  { title: "Tekrarla", text: "Günlük öneri ve kelime tekrarıyla bir sonraki denemeye hazır ol." },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const startHref = user ? (user.role === "ADMIN" ? "/yonetim" : "/panel") : "/giris";

  return (
    <main id="ana-icerik" className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:pt-16">
      <section aria-labelledby="karsilama-baslik" className="text-center">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-brand-800 shadow-sm dark:bg-zinc-900 dark:text-brand-200">
          <span aria-hidden="true">✦</span> Yaren&apos;in YDS çalışma programı
        </p>
        <h1 id="karsilama-baslik" className="mt-5 text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Yaren’in <span className="bg-gradient-to-r from-brand-700 to-blush-600 bg-clip-text text-transparent dark:from-brand-300 dark:to-blush-200">YDS Kampı</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
          Bu kamp, Yaren’in YDS çalışması ve takip edebilmesi için biri tarafından oluşturuldu.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href={startHref} size="lg" className="w-full sm:w-auto">
            Kampa Başla
          </ButtonLink>
          <ButtonLink href="#nasil-calisir" variant="secondary" size="lg" className="w-full sm:w-auto">
            Nasıl Çalışıyor?
          </ButtonLink>
        </div>
      </section>

      <section aria-labelledby="ozellikler-baslik" className="mt-14">
        <h2 id="ozellikler-baslik" className="sr-only">
          Kampın özellikleri
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title} className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{f.title}</h3>
              <p className="mt-1 text-[15px] text-zinc-700 dark:text-zinc-300">{f.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="nasil-calisir" aria-labelledby="nasil-baslik" className="mt-16 scroll-mt-6">
        <h2 id="nasil-baslik" className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Nasıl çalışıyor?
        </h2>
        <p className="mt-2 text-zinc-700 dark:text-zinc-300">
          İlk girişte kısa bir seviye belirleme yapılır. Ardından her gün dört adımlık bir çalışma seni bekler:
        </p>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl bg-gradient-to-br from-brand-100 to-blush-100 p-5 dark:from-brand-900/40 dark:to-blush-700/20">
              <span className="text-sm font-bold text-brand-800 dark:text-brand-200">Adım {i + 1}</span>
              <h3 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{s.title}</h3>
              <p className="mt-1 text-[15px] text-zinc-800 dark:text-zinc-200">{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Uygulamadaki tüm göstergeler kişisel çalışma takibi içindir; gerçek bir ÖSYM puanı veya kesin sınav tahmini değildir.
        </p>
      </section>
    </main>
  );
}
