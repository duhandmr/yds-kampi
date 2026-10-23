# Yaren'in YDS Kampı

Yaren'in YDS İngilizce sınavına düzenli ve kişiselleştirilmiş biçimde hazırlanması için geliştirilmiş, mobil uyumlu bir web uygulaması.

- Her gün performansa göre uyarlanan yeni bir deneme (hızlı 10 / günlük 20 / yoğun 40 soru / yönetici tanımlı tam prova)
- Deneme öncesi kısa konu anlatımı: kurallar, sık hatalar, strateji, çözümlü örnekler, kelimeler
- Süreli deneme: ilerleme çubuğu, geri sayım, işaretleme, boş bırakma, soru listesi, bitirme uyarısı, süre dolunca otomatik tamamlama
- Sonuç ekranı: D/Y/B, başarı yüzdesi, süre, konu ve zorluk kırılımı, önceki denemeye göre değişim, soru soru açıklamalar
- Yargılamayan kişisel geri bildirim ve günlük çalışma önerisi
- Panel: seri, toplam soru, genel başarı, son 7 deneme grafiği, güçlü/gelişen konular, kamp ilerlemesi, sınava kalan gün
- Kelime modülü: yanlış sorulardaki kelimeler otomatik eklenir, aralıklı tekrar (Yeni / Öğreniliyor / Tekrar edilmeli / Öğrenildi)
- Yönetici paneli: soru ekleme/düzenleme, devre dışı bırakma, inceleme, ayarlar, konu ağırlıkları, yapay zekâ ile üretim, JSON/CSV dışa aktarma
- Sağlayıcıdan bağımsız yapay zekâ katmanı (isteğe bağlı); kapalıyken onaylı soru havuzuyla çalışır

> Uygulamadaki seviye ve başarı göstergeleri **uygulama içi performans göstergeleridir**; gerçek bir ÖSYM puanı veya kesin sınav tahmini değildir.

---

## 1. Mimari özeti

| Katman | Seçim | Not |
|---|---|---|
| Çatı | Next.js 15 (App Router), React 19, TypeScript (strict) | Sunucu bileşenleri + Server Actions |
| Stil | Tailwind CSS v4 | Mor/lavanta/pembe tema, koyu tema, mobil öncelikli |
| Veri | PostgreSQL + Prisma 6 | Soft delete, indeksler, benzersizlik kuralları |
| Doğrulama | Zod 4 | Tüm form, action, API ve yapay zekâ çıktıları |
| Kimlik doğrulama | Kendi oturum sistemi | scrypt parola özeti, httpOnly çerez, oturum tokenının SHA-256 özeti veritabanında |
| Hız sınırlama | Veritabanı tabanlı sabit pencere | Sunucusuz ortamda örnekler arası paylaşılır |
| Yapay zekâ | `AiProvider` arayüzü + OpenAI / Azure OpenAI uyumlu sağlayıcı | JSON → şema → kalite kontrol → kör çözüm → inceleme |
| Test | Vitest (birim), Playwright (mobil/masaüstü uçtan uca) | |
| Dağıtım | Vercel + Vercel Cron | `vercel.json` |

**Neden NextAuth yerine kendi oturum sistemi?** Uygulama yalnızca kullanıcı adı/parola ile giren iki hesaba (Yaren ve yönetici) hizmet ediyor; dış OAuth sağlayıcısı yok. Veritabanı oturumları ile her istekte oturum ve rol sunucuda doğrulanır, oturumlar tek tıkla iptal edilebilir ve ek bağımlılık gerekmez.

### Güvenlik katmanları
1. `src/middleware.ts` – çerezi olmayan isteği korunan sayfalardan uzaklaştırır (ilk savunma).
2. Her sayfa / layout – `requireUser()`, `requireOnboardedUser()`, `requireAdmin()` ile oturumu ve rolü veritabanından doğrular.
3. Her Server Action ve API route – tekrar oturum + rol + Zod doğrulaması + hız sınırlaması.
4. Veri erişimi her zaman `userId` ile filtrelenir; başka kullanıcının denemesine erişilemez.
5. Deneme sırasında doğru cevaplar ve açıklamalar istemciye **gönderilmez**.

### Deneme bütünlüğü
- `Exam(userId, studyDate, kind)` benzersiz → aynı gün aynı türde ikinci deneme oluşmaz.
- `ExamAttempt.examId` benzersiz → bir denemenin tek oturumu vardır.
- Bitirme işlemi, `status = IN_PROGRESS` koşullu güncelleme (compare-and-set) ile tek transaction'da yapılır → aynı deneme iki kez tamamlanamaz, puanlama iki kez çalışmaz.
- Her cevap değişikliği önce tarayıcıdaki kuyruğa (localStorage) yazılır, sunucu onaylayana kadar silinmez; bağlantı kesilirse 5 sn'de bir yeniden denenir.
- Süre sunucu saatine göre tutulur. Süre dolduğunda istemci denemeyi otomatik bitirir; sekme kapalıysa da sayfa/sonuç ziyaretinde sunucu denemeyi son teslim anına sabitleyerek tamamlar. Son teslimden sonra (5 sn ağ payı hariç) cevap kabul edilmez.

### Kişiselleştirme algoritması (özet)
- Her konu için `masteryScore`: az veride 0,5'e doğru temkinli, veri arttıkça son başarı (EMA) ve genel başarıya yaklaşır.
- Soru tipi ağırlığı = yönetici temel ağırlığı × (1 + zayıflık). Zayıf tipler daha çok soru alır.
- Zorluk karışımı ortalama ustalığa göre (ör. orta seviye: %30 kolay, %45 orta, %25 zor).
- Önce hiç görülmemiş sorular; sonra görülmemiş ama son 14 günde görülenlere benzemeyenler; havuz tükenince 7 günden eski ve yanlış yapılan sorular. Jaccard benzerliği ≥ 0,7 olan sorular aynı denemeye girmez.

---

## 2. Sayfa ve route haritası

| Route | Erişim | Açıklama |
|---|---|---|
| `/` | Herkes | Karşılama: "Yaren'in YDS Kampı", Kampa Başla / Nasıl Çalışıyor? |
| `/giris` | Herkes | Giriş |
| `/karsilama` (`?tekrar=1`) | Öğrenci | İlk giriş bilgilendirmesi (hesapta saklanır; profilden tekrar açılır) |
| `/seviye-belirleme` | Öğrenci | Seviye belirleme girişi (11 soru tipi) |
| `/panel` | Öğrenci | Gösterge paneli |
| `/calisma` | Öğrenci | Çalışma modu seçimi |
| `/calisma/[examId]` | Öğrenci | Aşama 1: Deneme öncesi hazırlık |
| `/deneme/[attemptId]` | Öğrenci | Aşama 2: Süreli deneme |
| `/deneme/[attemptId]/sonuc` | Öğrenci | Aşama 3–4: Sonuç, açıklamalar, günlük öneri (seviye belirlemede başlangıç planı) |
| `/kelimeler`, `/kelimeler/tekrar` | Öğrenci | Kelime listesi ve aralıklı tekrar |
| `/profil` | Öğrenci | Kamp bilgisi, parola, verileri indir / sil |
| `/yonetim` | Yönetici | İlerleme, soru havuzu durumu, yapay zekâ kayıtları |
| `/yonetim/sorular`, `/yeni`, `/[id]` | Yönetici | Soru listesi, ekleme, düzenleme, yayımlama, devre dışı bırakma |
| `/yonetim/uretim` | Yönetici | Manuel yapay zekâ üretimi ve yayın öncesi inceleme |
| `/yonetim/ayarlar` | Yönetici | Kamp/sınav tarihi, deneme ayarları, konu ağırlıkları, yapay zekâ |
| `/yonetim/disa-aktar` | Yönetici | JSON / CSV dışa aktarma |
| `GET /api/health` | Herkes | Sağlık kontrolü |
| `GET /api/me/export` | Öğrenci | Kendi verilerini JSON indir |
| `GET /api/admin/export` | Yönetici | Veri dışa aktarma |
| `GET /api/cron/daily` | Vercel Cron (`CRON_SECRET`) | Bakım + eksik soru tiplerinde üretim |

---

## 3. Veri modeli

`prisma/schema.prisma` içinde: **User, Session, Profile, CampSettings, Topic, Question, QuestionOption, QuestionExposure, Exam, ExamQuestion, ExamAttempt, UserAnswer, TopicPerformance, VocabularyItem, VocabularyReview, DailyRecommendation, StudyStreak, AiGenerationLog, RateLimit.**

- "Yaren bu soruyu gördü mü?" → `QuestionExposure(userId, questionId)` (görülme sayısı, son görülme, son sonuç).
- Performans tabloları (`ExamAttempt`, `UserAnswer`, `TopicPerformance`, `VocabularyItem` …) kullanıcıya `onDelete: Restrict` ile bağlıdır → kullanıcı kaydı yanlışlıkla fiziksel olarak silinirse veritabanı engeller. Kullanıcının "verilerimi sil" işlemi `deletedAt` (soft delete) kullanır; 30 gün sonra `npm run data:purge -- --onayla` ile kalıcı silinir.
- Sorular silinmez; `DISABLED` / `REJECTED` durumuna alınır.

---

## 4. Klasör yapısı

```
prisma/              schema.prisma, seed.ts
scripts/             create-user.ts (güvenli hesap oluşturma), purge-deleted.ts
src/middleware.ts    ilk savunma hattı
src/app/             sayfalar (App Router), actions/ (Server Actions), api/ (route'lar)
  (ogrenci)/         öğrenci sayfaları (ortak layout + oturum kontrolü)
  yonetim/           yönetici sayfaları (rol kontrolü)
src/components/      ui/, layout/, exam/, dashboard/, vocabulary/, profile/, admin/
src/content/         konu anlatımları ve özgün başlangıç soru bankası (49 soru, 11 tip)
src/lib/             saf iş mantığı (test edilir) + services/ (Prisma erişimi) + ai/ + auth/
tests/unit/          Vitest birim testleri
tests/e2e/           Playwright (mobil/masaüstü)
```

---

## 5. Yerel kurulum

Gereksinimler: Node.js 20.18+ (veya 22), PostgreSQL 14+ (yerel, Docker veya Neon/Supabase gibi bir servis).

```bash
# 1) Bağımlılıklar
npm install

# 2) Ortam değişkenleri
cp .env.example .env
#   DATABASE_URL ve DATABASE_URL_UNPOOLED değerlerini kendi veritabanınıza göre doldurun.

# 3) Veritabanı şeması (ilk migration'ı oluşturur ve uygular)
npm run db:migrate:dev -- --name init

# 4) Konular, özgün soru bankası ve varsayılan ayarlar
npm run db:seed

# 5) İlk yönetici ve Yaren'in hesabı (parola gizli olarak sorulur, koda/geçmişe yazılmaz)
npm run user:create -- --username yonetici --role ADMIN
npm run user:create -- --username yaren --role USER

# 6) Geliştirme sunucusu
npm run dev        # http://localhost:3000
```

Yerel PostgreSQL için Docker örneği:

```bash
docker run --name yds-db -e POSTGRES_PASSWORD=yerel_parola -e POSTGRES_DB=yds_kampi -p 5432:5432 -d postgres:16
```

### Kontrol komutları

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # next lint (uyarı toleransı 0)
npm run test        # Vitest birim testleri
npm run build       # prisma generate + next build
npm run check       # typecheck + lint + test
E2E_USERNAME=... E2E_PASSWORD=... npm run test:e2e   # Playwright (mobil + masaüstü)
```

İlk girişte yönetici panelinden **Ayarlar → Sınav tarihi** alanını doldurun; panelde geri sayım ve kamp ilerlemesi bu tarihe göre hesaplanır.

---

## 6. Testler

| Gereksinim | Test |
|---|---|
| Yetkisiz kullanıcı korunan sayfalara erişemez | `tests/unit/access.test.ts`, `tests/e2e/mobile.spec.ts` |
| Aynı deneme iki kez tamamlanamaz (eşzamanlı istek dahil) | `tests/unit/attempt-core.test.ts` |
| Cevaplar deneme bitmeden kaybolmaz | `attempt-core.test.ts`, `answer-queue.test.ts` |
| Süre dolunca otomatik tamamlama | `attempt-core.test.ts` |
| D/Y/B doğru hesaplanır | `scoring.test.ts` |
| Açıklama cevap anahtarıyla tutarlı | `quality.test.ts` (tüm banka + negatif senaryolar) |
| Yapay zekâ geçersiz JSON → kayıt yok | `ai-generation.test.ts` |
| Aynı soru gereksiz tekrar edilmez | `selection.test.ts` |
| Mobilde temel işlevler | `tests/e2e/mobile.spec.ts` (Pixel 7, iPhone 13, masaüstü) |

---

## 7. Yapay zekâ entegrasyonu (isteğe bağlı)

`.env` içinde:

```
AI_PROVIDER="openai"          # veya "azure-openai" / "none"
AI_API_KEY="..."              # yalnızca sunucuda okunur
AI_MODEL="..."                # openai için model adı
# Azure için: AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT, AZURE_OPENAI_API_VERSION
```

Ardından **Yönetim → Ayarlar → Yapay zekâ özelliklerini kullan** seçeneğini açın.

Üretim hattı: sağlayıcı yanıtı → JSON ayrıştırma → Zod şeması → otomatik kalite kontrolü (5 seçenek, tek doğru, açıklama ↔ anahtar ↔ gerekçe tutarlılığı, biçim, yer tutucu, benzerlik) → **kör çözüm** (model anahtarı görmeden çözer; farklı cevap veya "belirsiz" → red) → `PENDING_REVIEW`. Herhangi bir adımda başarısızlık kaydı engeller ve `AiGenerationLog`'a yazılır. Yapay zekâya kişisel veri (ad, kullanıcı adı, e-posta) gönderilmez; yalnızca konu, zorluk ve anonim yüzdeler gider.

Yeni bir sağlayıcı eklemek için `src/lib/ai/types.ts` içindeki `AiProvider` arayüzünü uygulayıp `src/lib/ai/index.ts` içinde seçin.

---

## 8. Canlıya alma (Vercel)

> **Önemli:** Gerçek dağıtım için proje sahibinin kendi **Vercel** hesabına, bir **PostgreSQL** servisine (ör. Neon, Supabase, Vercel Postgres) ve isteğe bağlı olarak bir **yapay zekâ sağlayıcısı** hesabına erişimi olması gerekir. Bu belgede veya kaynak kodda hiçbir gerçek parola ya da API anahtarı bulunmaz; bunlar yalnızca Vercel ortam değişkenlerine proje sahibi tarafından girilir.

1. Kodu bir Git deposuna (GitHub/GitLab/Bitbucket) gönderin.
2. Bir PostgreSQL veritabanı oluşturun. Neon için havuzlu (pooled) bağlantıyı `DATABASE_URL`, doğrudan bağlantıyı `DATABASE_URL_UNPOOLED` olarak kullanın. Prisma runtime istemcisi Neon soğuk başlangıçlarında `connect_timeout` ve `pool_timeout` değerlerini 30 saniyeye yükseltir; migration bağlantısında `connect_timeout=30` kullanın (`neon connection-string --prisma`).
3. Vercel → **Add New Project** → depoyu seçin. Framework: Next.js (otomatik). Build komutu `vercel.json` içinden gelir: `prisma generate && prisma migrate deploy && next build`.
4. **Environment Variables** (Production): `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `APP_URL` (ör. `https://yds.ornek.com`), `SESSION_TTL_DAYS`, `CRON_SECRET` (`openssl rand -base64 48`), isteğe bağlı `AI_*`.
5. Yerelde `npm run db:migrate:dev -- --name init` ile oluşan `prisma/migrations` klasörünü depoya ekleyin; Vercel her build'de `prisma migrate deploy` çalıştırır.
6. İlk dağıtımdan sonra, yerel makinenizden **production veritabanına** bir kez bağlanarak:
   ```bash
   DATABASE_URL="<production>" DATABASE_URL_UNPOOLED="<production-direct>" npm run db:seed
   DATABASE_URL="<production>" DATABASE_URL_UNPOOLED="<production-direct>" npm run user:create -- --username yonetici --role ADMIN
   DATABASE_URL="<production>" DATABASE_URL_UNPOOLED="<production-direct>" npm run user:create -- --username yaren --role USER
   ```
   Değerleri kabuk geçmişine yazmamak için bir `.env.production.local` dosyası kullanıp `dotenv` ile yükleyebilir veya CI'da gizli değişken olarak tanımlayabilirsiniz.
7. Vercel Cron, `vercel.json` içindeki takvimle (`0 3 * * *` UTC = 06:00 İstanbul) `/api/cron/daily` uç noktasını `Authorization: Bearer $CRON_SECRET` ile çağırır.

### İlk yönetici hesabını güvenli oluşturma
- Kayıt (sign-up) sayfası **yoktur**; hesaplar yalnızca `scripts/create-user.ts` ile oluşturulur.
- Parola komut satırı argümanı olarak alınmaz; terminalde gizli olarak sorulur (veya CI'da `NEW_USER_PASSWORD`).
- Parola en az 12 karakter, büyük/küçük harf ve rakam içermeli; scrypt ile tuzlanarak saklanır.
- Parola sıfırlama: `npm run user:create -- --username yaren --reset-password` (tüm oturumları kapatır).

### Özel alan adı bağlama
1. Vercel → Project → **Settings → Domains** → alan adını ekleyin (ör. `yds.ornek.com`).
2. Alt alan adı için DNS sağlayıcınızda Vercel'in gösterdiği değere işaret eden bir **CNAME** kaydı ekleyin; kök alan adı (`ornek.com`) için Vercel'in gösterdiği **A** kaydını kullanın.
3. Doğrulama tamamlanınca Vercel HTTPS sertifikasını otomatik üretir.
4. `APP_URL` ortam değişkenini yeni adresle güncelleyip yeniden dağıtın.

---

## 9. Production güvenlik kontrol listesi

- [ ] `.env` dosyaları depoda yok (`.gitignore`), tüm gizli değerler yalnızca Vercel ortam değişkenlerinde
- [ ] `CRON_SECRET` en az 32 karakter ve rastgele
- [ ] Veritabanı kullanıcısı yalnızca bu veritabanına yetkili; SSL zorunlu (`?sslmode=require`)
- [ ] Yönetici ve öğrenci parolaları güçlü ve birbirinden farklı; yönetici hesabı yalnızca yönetim için kullanılıyor
- [ ] `prisma/migrations` depoda; production'da yalnızca `migrate deploy` çalışıyor (asla `migrate dev` / `db push`)
- [ ] Güvenlik başlıkları aktif (`next.config.ts`: HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy)
- [ ] Arama motorları engelli (`robots` noindex + `robots.txt` disallow)
- [ ] Yapay zekâ otomatik yayın kapalı (varsayılan); üretilen sorular incelemeden yayımlanmıyor
- [ ] Veritabanı yedeklemesi (sağlayıcının otomatik yedekleme / point-in-time recovery özelliği) açık
- [ ] Vercel Deployment Protection veya en azından önizleme dağıtımlarına parola koruması açık
- [ ] Hata mesajları gizli bilgi içermiyor (kullanıcıya genel mesaj, sunucu loguna yalnızca hata türü)
- [ ] `npm audit` ve bağımlılık güncellemeleri düzenli kontrol ediliyor

---

## 10. Varsayımlar

1. Uygulamayı yalnızca iki hesap kullanır: Yaren (öğrenci) ve bir yönetici. Arayüzde yalnızca "Yaren" adı gösterilir; soyadı, e-posta veya fotoğraf tutulmaz.
2. Zaman dilimi Europe/Istanbul'dur; "gün" hesapları (seri, günlük deneme) buna göre yapılır.
3. YDS'de yanlış cevaplar doğruları götürmez; başarı yüzdesi = doğru / toplam soru.
4. Başlangıç soru bankası 49 özgün sorudan oluşur (her tipten en az 4). Uzun süreli kullanım için soru havuzunun yönetici veya yapay zekâ ile büyütülmesi gerekir; havuz tükendiğinde algoritma en eski ve yanlış yapılan soruları önce tekrar eder.
5. Seviye belirleme, her soru tipinden 2 soru (varsayılan 22 soru / 30 dk) ile yapılır.
6. Kelime tekrarı SM-2'den uyarlanmış basit bir algoritma kullanır; 21 gün ve üzeri aralık "Öğrenildi" sayılır.
