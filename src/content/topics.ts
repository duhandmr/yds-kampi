import type { QuestionTypeKey } from "../lib/constants";

export interface LessonExample {
  question: string;
  answer: string;
  explanation: string;
}

export interface Lesson {
  summary: string;
  rules: string[];
  mistakes: string[];
  strategy: string;
  examples: LessonExample[];
  vocabulary: Array<{ term: string; meaning: string }>;
}

export interface TopicSeed {
  slug: string;
  name: string;
  questionType: QuestionTypeKey;
  description: string;
  sortOrder: number;
  lesson: Lesson;
}

/** Deneme öncesi hazırlık ekranında gösterilen özgün konu anlatımları. */
export const TOPICS: TopicSeed[] = [
  {
    slug: "kelime-bilgisi",
    name: "Kelime Bilgisi",
    questionType: "VOCABULARY",
    description: "Akademik kelimeler ve phrasal verb'ler",
    sortOrder: 1,
    lesson: {
      summary: "Kelime sorularında cümlenin genel anlamı, boşluğun hemen çevresindeki ipuçlarıyla birleştirilir. Amaç kelimeyi tek başına değil, bağlam içinde doğru seçmektir.",
      rules: [
        "Boşluktan önce ve sonra gelen kelimeler (edat, nesne, zarf) çoğu zaman tek doğru seçeneği belirler.",
        "Olumlu-olumsuz yön ipuçlarına dikkat et: despite, however, although gibi bağlaçlar anlamı tersine çevirir.",
        "Seçeneklerin hepsi aynı türdense (hepsi sıfat gibi) karar anlam üzerinden verilir.",
      ],
      mistakes: [
        "Bilinen bir kelimeyi cümle anlamını kontrol etmeden seçmek.",
        "Phrasal verb'lerde yalnızca fiile bakıp edatın anlamı değiştirdiğini unutmak.",
      ],
      strategy: "Önce cümleyi boşluk yokmuş gibi Türkçe özetle, boşluğa gelmesi gereken anlamı tahmin et, sonra bu anlama en yakın seçeneği bul.",
      examples: [
        {
          question: "The researchers tried to ---- the impact of noise on concentration. (A) measure (B) ignore (C) celebrate",
          answer: "A",
          explanation: "'Etkiyi ölçmeye çalıştılar' anlamı bilimsel bağlama uyar; ignore (görmezden gelmek) ve celebrate (kutlamak) bağlamla çelişir.",
        },
        {
          question: "Due to heavy snow, the match was ---- until next week. (A) put off (B) taken up (C) found out",
          answer: "A",
          explanation: "put off = ertelemek. 'until next week' ifadesi erteleme anlamını destekler.",
        },
      ],
      vocabulary: [
        { term: "significant", meaning: "önemli, kayda değer" },
        { term: "reluctant", meaning: "isteksiz" },
        { term: "inevitable", meaning: "kaçınılmaz" },
        { term: "call off", meaning: "iptal etmek" },
      ],
    },
  },
  {
    slug: "zamanlar",
    name: "Zamanlar (Tenses)",
    questionType: "GRAMMAR",
    description: "Zaman uyumu ve zaman ifadeleri",
    sortOrder: 2,
    lesson: {
      summary: "YDS'de zaman soruları çoğunlukla cümledeki zaman ifadesi (since, by the time, for, recently) ve diğer yan cümlenin zamanıyla uyum üzerinden çözülür.",
      rules: [
        "since + geçmiş an / for + süre → genellikle present perfect (continuous).",
        "By the time + past simple → ana cümlede past perfect (had V3).",
        "By the time + present simple → ana cümlede future perfect (will have V3).",
        "Geçmişte belirli bir zaman (in 2010, yesterday, ago) → past simple.",
      ],
      mistakes: [
        "since gördüğünde past simple seçmek.",
        "by the time yapısında iki eylemin sırasını karıştırmak.",
      ],
      strategy: "Önce zaman ifadesini bul ve altını çiz; ardından diğer yan cümlenin zamanını kontrol ederek uyumlu seçeneği seç.",
      examples: [
        {
          question: "She ---- in Ankara since 2019. (A) lived (B) has lived (C) will live",
          answer: "B",
          explanation: "since 2019 geçmişte başlayıp hâlâ süren bir durumu anlatır; present perfect gerekir.",
        },
        {
          question: "By the time we got to the station, the train ----. (A) had left (B) leaves (C) has left",
          answer: "A",
          explanation: "Tren, bizim varışımızdan önce ayrılmıştı: geçmişteki iki olaydan önce olanı past perfect ile anlatılır.",
        },
      ],
      vocabulary: [
        { term: "by the time", meaning: "-dığı zamana kadar" },
        { term: "so far", meaning: "şimdiye kadar" },
        { term: "recently", meaning: "son zamanlarda" },
      ],
    },
  },
  {
    slug: "baglaclar",
    name: "Bağlaçlar",
    questionType: "GRAMMAR",
    description: "Zıtlık, sebep-sonuç, koşul ve amaç bağlaçları",
    sortOrder: 3,
    lesson: {
      summary: "Bağlaç soruları iki cümle arasındaki mantıksal ilişkiyi ölçer: zıtlık, sebep, sonuç, koşul, amaç veya ekleme.",
      rules: [
        "Zıtlık: although, even though, while, whereas (+ cümle); despite, in spite of (+ isim/V-ing).",
        "Sebep: because, since, as (+ cümle); because of, due to (+ isim).",
        "Koşul: unless (= if not), as long as, provided that.",
        "Çift bağlaçlar: not only ... but also, both ... and, either ... or, neither ... nor.",
      ],
      mistakes: [
        "despite'tan sonra tam cümle getirmek.",
        "unless ile olumsuz fiili birlikte kullanıp anlamı ikiye katlamak.",
      ],
      strategy: "İki yan cümleyi ayrı ayrı oku ve aralarında 'ama mı, çünkü mü, eğer mi?' sorusunu sor. Sonra seçeneklerin dil bilgisi yapısını (cümle mi, isim mi alıyor) kontrol et.",
      examples: [
        {
          question: "---- it was raining, they continued the match. (A) Although (B) Because (C) Despite",
          answer: "A",
          explanation: "Yağmura rağmen maç devam etti: zıtlık ve ardından tam cümle → Although. Despite tam cümle almaz.",
        },
        {
          question: "You can't enter the lab ---- you wear protective glasses. (A) unless (B) so that (C) because",
          answer: "A",
          explanation: "'Koruyucu gözlük takmadıkça giremezsin' → unless (= if not).",
        },
      ],
      vocabulary: [
        { term: "whereas", meaning: "oysa, -iken" },
        { term: "provided that", meaning: "-mek şartıyla" },
        { term: "nevertheless", meaning: "yine de" },
      ],
    },
  },
  {
    slug: "relative-clauses",
    name: "Sıfat Cümlecikleri (Relative Clauses)",
    questionType: "GRAMMAR",
    description: "who, which, whose, whom, where, that",
    sortOrder: 4,
    lesson: {
      summary: "Relative clause, bir ismi tanımlayan yan cümledir. Doğru zamiri seçmek için tanımlanan ismin türüne ve yan cümledeki görevine bakılır.",
      rules: [
        "who: insan (özne), which: nesne/hayvan, whose: iyelik (onun ...'ı).",
        "whom: insan (nesne) ve edattan sonra (to whom).",
        "Virgülle ayrılan (non-defining) yan cümlelerde that kullanılmaz.",
        "where: yer, when: zaman bildiren isimlerden sonra tam cümleyle gelir.",
      ],
      mistakes: [
        "Virgülden sonra that seçmek.",
        "Arkasından isim gelen boşlukta whose yerine who kullanmak.",
      ],
      strategy: "Boşluktan sonraki kelimeye bak: hemen bir isim geliyorsa whose; fiil geliyorsa who/which; tam cümle geliyorsa where/when/whom adaylarını değerlendir.",
      examples: [
        {
          question: "The scientist ---- book won the award gave a speech. (A) whose (B) who (C) which",
          answer: "A",
          explanation: "Boşluktan sonra 'book' ismi geliyor: 'kitabı ödül kazanan bilim insanı' → whose.",
        },
        {
          question: "Istanbul, ---- has a long history, attracts millions of visitors. (A) that (B) which (C) where",
          answer: "B",
          explanation: "Virgülden sonra that kullanılmaz; ardından fiil (has) geldiği için where de uygun değildir.",
        },
      ],
      vocabulary: [
        { term: "define", meaning: "tanımlamak" },
        { term: "refer to", meaning: "-e atıfta bulunmak" },
      ],
    },
  },
  {
    slug: "edatlar",
    name: "Edatlar (Prepositions)",
    questionType: "GRAMMAR",
    description: "Fiil, isim ve sıfatlarla kalıplaşmış edatlar",
    sortOrder: 5,
    lesson: {
      summary: "Edat soruları çoğunlukla kalıplaşmış yapıları ölçer: depend on, responsible for, interested in gibi.",
      rules: [
        "Fiil + edat kalıpları: depend on, consist of, result in, result from, contribute to.",
        "Sıfat + edat kalıpları: aware of, capable of, similar to, famous for.",
        "İsim + edat kalıpları: increase in, demand for, impact on.",
      ],
      mistakes: [
        "result in (sonuçlanmak) ile result from (kaynaklanmak) arasındaki yönü karıştırmak.",
        "Türkçedeki hâl ekini birebir çevirip yanlış edat seçmek.",
      ],
      strategy: "Edatı tek başına değil, önündeki fiil/sıfat/isimle birlikte bir kalıp olarak düşün. Kalıpları kelime listende birlikte çalış.",
      examples: [
        {
          question: "The team consists ---- five researchers. (A) of (B) in (C) on",
          answer: "A",
          explanation: "consist of = -den oluşmak.",
        },
        {
          question: "There has been a sharp increase ---- prices. (A) in (B) at (C) to",
          answer: "A",
          explanation: "increase in + alan (fiyatlarda artış).",
        },
      ],
      vocabulary: [
        { term: "depend on", meaning: "-e bağlı olmak" },
        { term: "result in", meaning: "ile sonuçlanmak" },
        { term: "contribute to", meaning: "-e katkıda bulunmak" },
      ],
    },
  },
  {
    slug: "edilgen-ve-kipler",
    name: "Edilgen Yapı ve Kipler",
    questionType: "GRAMMAR",
    description: "Passive voice, modals ve modal perfect yapıları",
    sortOrder: 6,
    lesson: {
      summary: "Eylemi yapan değil, eylemden etkilenen önemliyse edilgen yapı kullanılır. Modal perfect (could have V3, should have V3) geçmişe dair olasılık, eleştiri veya pişmanlık bildirir.",
      rules: [
        "Edilgen: be + V3 (The bridge was built in 1990).",
        "could have V3: geçmişte mümkündü ama olmadı.",
        "should have V3: geçmişte yapılmalıydı ama yapılmadı.",
        "must have V3: geçmişe dair güçlü çıkarım.",
        "Edilgen modal perfect: could have been V3.",
      ],
      mistakes: [
        "Özne eylemi yapamıyorsa (köprü, rapor) etken yapı seçmek.",
        "Geçmişe dair bir yorumda present modal (can, may) seçmek.",
      ],
      strategy: "Önce öznenin eylemi yapıp yapamayacağına bak (edilgen mi?), sonra cümlenin geçmişe mi şimdiye mi ait olduğunu kontrol et.",
      examples: [
        {
          question: "The results ---- next week. (A) will announce (B) will be announced (C) announced",
          answer: "B",
          explanation: "Sonuçlar kendi kendini açıklayamaz; gelecek zaman edilgen yapı gerekir.",
        },
        {
          question: "You ---- me earlier; I could have helped. (A) should have told (B) must tell (C) can tell",
          answer: "A",
          explanation: "Geçmişte yapılması gereken ama yapılmayan bir eylem: should have V3.",
        },
      ],
      vocabulary: [
        { term: "prevent", meaning: "önlemek" },
        { term: "announce", meaning: "duyurmak" },
      ],
    },
  },
  {
    slug: "cumle-tamamlama",
    name: "Cümle Tamamlama",
    questionType: "SENTENCE_COMPLETION",
    description: "Yan cümle ile ana cümle arasındaki anlam ve yapı uyumu",
    sortOrder: 7,
    lesson: {
      summary: "Cümle tamamlama sorularında hem anlam ilişkisi (bağlacın gerektirdiği mantık) hem de zaman uyumu aynı anda kontrol edilir.",
      rules: [
        "Bağlacın türü (zıtlık, sebep, koşul) doğru seçeneğin mantığını belirler.",
        "Verilen yarımın zamanı ile seçeneğin zamanı uyumlu olmalıdır.",
        "Zamir ve özne tutarlılığına (it, they, this) dikkat et.",
      ],
      mistakes: [
        "Konuyla ilgili ama bağlacın gerektirdiği ilişkiyi kurmayan seçeneği seçmek.",
        "Zaman uyumsuzluğunu gözden kaçırmak.",
      ],
      strategy: "Önce zaman uyumu bozuk seçenekleri ele, sonra kalanlar arasında bağlacın gerektirdiği mantıksal ilişkiyi kuranı seç.",
      examples: [
        {
          question: "Although the hotel was expensive, ----. (A) the service was disappointing (B) it was very luxurious",
          answer: "A",
          explanation: "Although zıtlık ister: pahalı olmasına rağmen hizmet hayal kırıklığıydı.",
        },
        {
          question: "If you had left earlier, ----. (A) you would have caught the bus (B) you will catch the bus",
          answer: "A",
          explanation: "Third conditional: would have V3.",
        },
      ],
      vocabulary: [
        { term: "consequently", meaning: "sonuç olarak" },
        { term: "unless", meaning: "-medikçe" },
      ],
    },
  },
  {
    slug: "ceviri-en-tr",
    name: "İngilizce-Türkçe Çeviri",
    questionType: "TRANSLATION_EN_TR",
    description: "Anlamı, zamanı ve vurguyu koruyan çeviri",
    sortOrder: 8,
    lesson: {
      summary: "Çeviri sorularında doğru seçenek; öznesi, zamanı, kipliği (can, must, likely) ve niceliği (most, not all, few) eksiksiz aktaran seçenektir.",
      rules: [
        "Ana öğeleri (özne, yüklem, nesne) tek tek eşleştir.",
        "Zaman ve kiplik farklarını kontrol et (will have / has / had).",
        "Nicelik ifadeleri kritik: not all ≠ none, few ≠ a few.",
      ],
      mistakes: [
        "Kelimeleri doğru ama zamanı yanlış çevrilmiş seçeneği seçmek.",
        "Anlamı genişleten veya daraltan seçenekleri fark etmemek.",
      ],
      strategy: "İngilizce cümleyi 2-3 anlam parçasına böl ve her parçayı seçeneklerde ara; bir parçası eksik ya da değişmiş olan seçeneği hemen ele.",
      examples: [
        {
          question: "Few people attended the meeting. (A) Toplantıya az sayıda kişi katıldı. (B) Toplantıya birkaç kişi katıldı ve memnun kaldı.",
          answer: "A",
          explanation: "B'de 'memnun kaldı' kaynak cümlede yok; anlam genişletilmiş.",
        },
        {
          question: "The plan may be changed. (A) Plan değiştirilebilir. (B) Plan değiştirildi.",
          answer: "A",
          explanation: "may be changed olasılık bildiren edilgen yapıdır.",
        },
      ],
      vocabulary: [
        { term: "likely", meaning: "muhtemel" },
        { term: "not all", meaning: "hepsi değil" },
      ],
    },
  },
  {
    slug: "ceviri-tr-en",
    name: "Türkçe-İngilizce Çeviri",
    questionType: "TRANSLATION_TR_EN",
    description: "Türkçe yapıların İngilizce karşılıkları",
    sortOrder: 9,
    lesson: {
      summary: "Türkçe cümledeki yüklem en sondadır; önce yüklemi ve zamanını bul, sonra İngilizce seçeneklerde aynı yapıyı ara.",
      rules: [
        "'-mesi muhtemeldir' → is likely to; '-ebilir' → can/may.",
        "'göz önüne alındığında' → given / considering.",
        "'hem ... hem de' → both ... and.",
      ],
      mistakes: [
        "Türkçe ve İngilizce cümlelerin farklı sıralanmasından dolayı özneyi karıştırmak.",
        "Kiplik ifadelerini (muhtemelen, gerekir) atlamak.",
      ],
      strategy: "Türkçe cümleden yüklem, özne ve kiplik içeren bir kontrol listesi çıkar; her seçeneği bu listeyle karşılaştır.",
      examples: [
        {
          question: "Bu ilacın yan etkileri olabilir. (A) This drug may have side effects. (B) This drug has no side effects.",
          answer: "A",
          explanation: "'olabilir' olasılık bildirir: may have.",
        },
        {
          question: "Hem öğrenciler hem de öğretmenler katıldı. (A) Both students and teachers attended. (B) Either students or teachers attended.",
          answer: "A",
          explanation: "'hem ... hem de' → both ... and.",
        },
      ],
      vocabulary: [
        { term: "given", meaning: "göz önüne alındığında" },
        { term: "earn a living", meaning: "geçimini sağlamak" },
      ],
    },
  },
  {
    slug: "paragraf-anlama",
    name: "Paragraf Anlama",
    questionType: "READING",
    description: "Ana fikir, ayrıntı ve çıkarım soruları",
    sortOrder: 10,
    lesson: {
      summary: "Paragraf sorularında cevap mutlaka metinde dayanağı olan seçenektir. Metinde olmayan genellemeler ve 'always, only, never' gibi kesin ifadeler çoğunlukla çeldiricidir.",
      rules: [
        "Ana fikir soruları: ilk ve son cümleler çoğunlukla ana fikri taşır.",
        "Ayrıntı soruları: soru kökündeki anahtar kelimeyi metinde bul ve çevresini oku.",
        "Çıkarım (inferred) soruları: metinden mantıken çıkan ama birebir yazmayan bilgiyi ister.",
      ],
      mistakes: [
        "Genel bilgi olarak doğru ama metinde olmayan seçeneği işaretlemek.",
        "Metindeki kesinlik derecesini (may, some) seçenekte artırılmış hâliyle (always, all) kabul etmek.",
      ],
      strategy: "Önce soru kökünü oku, sonra paragrafı oku. Her seçenek için metinde 'kanıt cümlesini' göstermeye çalış; gösteremiyorsan ele.",
      examples: [
        {
          question: "Metin: 'Some studies suggest that green tea may lower blood pressure.' Hangisi doğrudur? (A) Green tea always lowers blood pressure. (B) Green tea might help reduce blood pressure.",
          answer: "B",
          explanation: "Metindeki 'may' ihtimal bildirir; 'always' kesinlik içerdiği için A yanlıştır.",
        },
        {
          question: "Metin bir şehirdeki trafik sorunu ve çözüm olarak toplu taşımanın güçlendirilmesini anlatıyorsa ana fikir nedir?",
          answer: "Toplu taşımanın güçlendirilmesi trafik sorununa bir çözüm olarak önerilmektedir.",
          explanation: "Ana fikir hem sorunu hem de yazarın önerdiği çözümü kapsamalıdır.",
        },
      ],
      vocabulary: [
        { term: "infer", meaning: "çıkarım yapmak" },
        { term: "attribute to", meaning: "-e bağlamak, -e atfetmek" },
        { term: "decline", meaning: "düşüş; azalmak" },
      ],
    },
  },
  {
    slug: "anlam-butunlugu",
    name: "Anlam Bütünlüğü",
    questionType: "COHERENCE",
    description: "Paragrafı mantıklı biçimde sürdüren veya bitiren cümle",
    sortOrder: 11,
    lesson: {
      summary: "Anlam bütünlüğü sorularında paragrafın konusu, yönü (olumlu/olumsuz) ve son cümlenin işlevi (sonuç, karşı görüş, öneri) birlikte değerlendirilir.",
      rules: [
        "Doğru cümle paragrafın konusunu sürdürür ve önceki cümleye mantıksal bağla bağlanır.",
        "Therefore, consequently gibi bağlaçlar önceki bilgiden çıkan bir sonuç gerektirir.",
        "Konuyla ilgili ama farklı bir alt konuya geçen cümleler çeldiricidir.",
      ],
      mistakes: [
        "Anahtar kelimesi paragrafta geçtiği için konudan sapan cümleyi seçmek.",
        "Aşırı genelleme yapan sonuç cümlelerini seçmek.",
      ],
      strategy: "Paragrafın son cümlesini özetle ve 'bundan sonra ne gelmeli?' diye sor; seçeneklerdeki bağlaçların bu beklentiyle uyumunu kontrol et.",
      examples: [
        {
          question: "Exercise improves mood. It also reduces stress. ---- (A) Therefore, doctors often recommend regular physical activity. (B) Football is popular in Brazil.",
          answer: "A",
          explanation: "A, egzersizin faydalarından mantıklı bir sonuç çıkarır; B konudan sapar.",
        },
        {
          question: "Paragraf bir teknolojinin avantajlarını anlatıyorsa son cümle neden 'However, ...' ile başlayabilir?",
          answer: "Dengeli bir değerlendirme için olası dezavantajı sunmak amacıyla.",
          explanation: "However, öncekiyle zıt yönde ama aynı konudaki bilgiyi getirir.",
        },
      ],
      vocabulary: [
        { term: "consequently", meaning: "sonuç olarak" },
        { term: "urge", meaning: "teşvik etmek, ısrarla istemek" },
      ],
    },
  },
  {
    slug: "diyalog-tamamlama",
    name: "Diyalog Tamamlama",
    questionType: "DIALOGUE",
    description: "Konuşma akışına uygun ifadeyi bulma",
    sortOrder: 12,
    lesson: {
      summary: "Diyalog sorularında boşluktan hem önceki hem de sonraki konuşma dikkate alınır. Özellikle boşluktan sonraki cevap, boşluğa gelen ifadenin bir soru mu, görüş mü olduğunu gösterir.",
      rules: [
        "Boşluktan sonraki cümle bir cevapsa, boşluğa uygun bir soru gelmelidir.",
        "'I agree' gibi tepkiler, boşlukta bir görüş bildirildiğini gösterir.",
        "Konuşmacının ses tonu (rica, öneri, şikâyet) korunmalıdır.",
      ],
      mistakes: [
        "Yalnızca önceki konuşmaya bakıp sonraki satırla uyumu kontrol etmemek.",
      ],
      strategy: "Boşluktan sonraki satırı önce oku ve 'Bu cümle neye cevap veriyor?' diye sor.",
      examples: [
        {
          question: "A: ---- B: About two hours by train. (A) How long does it take to get there? (B) Do you like trains?",
          answer: "A",
          explanation: "B'nin cevabı bir süre bildiriyor; 'How long' sorusu buna uyar.",
        },
        {
          question: "A: I think we should leave early. B: ---- (A) Good idea, the traffic will be heavy. (B) I've never been there.",
          answer: "A",
          explanation: "A'nın önerisine mantıklı bir tepki veriliyor.",
        },
      ],
      vocabulary: [
        { term: "relief", meaning: "rahatlama" },
        { term: "submit", meaning: "teslim etmek" },
      ],
    },
  },
  {
    slug: "yakin-anlam",
    name: "Yakın Anlamlı Cümle",
    questionType: "PARAPHRASE",
    description: "Aynı anlamı farklı yapıyla ifade eden cümle",
    sortOrder: 13,
    lesson: {
      summary: "Yakın anlam sorularında doğru seçenek, kaynak cümlenin anlamını ekleme veya çıkarma yapmadan farklı kelime ve yapılarla ifade eder.",
      rules: [
        "No sooner ... than / Hardly ... when → '... yapar yapmaz'.",
        "Much as / Although → zıtlık; It is unlikely that → probably not.",
        "Olumluluk/olumsuzluk ve kesinlik derecesi aynı kalmalıdır.",
      ],
      mistakes: [
        "Aynı kelimeleri kullanan ama anlam ilişkisini değiştiren seçeneği seçmek.",
        "Sebep-sonuç yönünün tersine çevrildiğini fark etmemek.",
      ],
      strategy: "Kaynak cümlenin Türkçe özetini çıkar; her seçeneğin özetini bununla karşılaştır. Kelime benzerliğine değil anlam ilişkisine güven.",
      examples: [
        {
          question: "Hardly had I arrived when it started to rain. ≈ ?",
          answer: "It started to rain as soon as I arrived.",
          explanation: "Hardly ... when, iki eylemin hemen ardı ardına gerçekleştiğini anlatır.",
        },
        {
          question: "She is too tired to continue. ≈ ?",
          answer: "She is so tired that she can't continue.",
          explanation: "too ... to = so ... that ... can't.",
        },
      ],
      vocabulary: [
        { term: "bring about", meaning: "neden olmak, yol açmak" },
        { term: "much as", meaning: "-e rağmen, her ne kadar" },
      ],
    },
  },
  {
    slug: "eksik-cumle",
    name: "Paragrafta Eksik Cümle",
    questionType: "MISSING_SENTENCE",
    description: "Paragraftaki boşluğu dolduran cümle",
    sortOrder: 14,
    lesson: {
      summary: "Boşluğa gelecek cümle hem kendinden önceki cümleyle hem de sonraki cümleyle bağlantı kurmalıdır. Sonraki cümledeki 'For example, However, This' gibi ifadeler en güçlü ipucudur.",
      rules: [
        "Sonraki cümle 'For example' ile başlıyorsa boşluk genel bir iddia içerir.",
        "Sonraki cümle 'However' ile başlıyorsa boşluk, ona zıt bir fikir içerir.",
        "'This, these, such' zamirleri boşluktaki bir isme atıfta bulunabilir.",
      ],
      mistakes: [
        "Yalnızca önceki cümleye bakıp sonraki cümleyle bağlantıyı kontrol etmemek.",
      ],
      strategy: "Boşluktan sonraki cümlenin ilk kelimelerine odaklan, sonra her seçeneği boşluğa koyup paragrafı baştan sona hızlıca oku.",
      examples: [
        {
          question: "Cities are becoming hotter. ---- For instance, trees can lower street temperatures by several degrees. (A) Green spaces can help reduce this heat. (B) Many people live in cities.",
          answer: "A",
          explanation: "'For instance' ağaçlarla ilgili bir örnek veriyor; A bu örneğin genel iddiasını sunuyor.",
        },
        {
          question: "Boşluktan sonra 'This approach...' geliyorsa boşlukta ne olmalıdır?",
          answer: "Bir yaklaşım veya yöntem tanıtılmalıdır.",
          explanation: "'This approach' bir önceki cümlede adı geçen yönteme atıftır.",
        },
      ],
      vocabulary: [
        { term: "vulnerable", meaning: "savunmasız, hassas" },
        { term: "persist", meaning: "sürmek, devam etmek" },
      ],
    },
  },
  {
    slug: "ilgisiz-cumle",
    name: "İlgisiz Cümleyi Bulma",
    questionType: "IRRELEVANT_SENTENCE",
    description: "Paragrafın akışını bozan cümle",
    sortOrder: 15,
    lesson: {
      summary: "Beş cümlelik paragrafta bir cümle, konu olarak benzer görünse de paragrafın ana düşüncesinden sapar. Genellikle aynı anahtar kelimeyi içerir ama farklı bir yöne gider.",
      rules: [
        "İlk cümle genellikle konuyu belirler; diğerleri onu destekler.",
        "Anahtar kelimeyi içeren ama farklı bir alt konuya (tarih, coğrafya, ticaret) geçen cümle şüphelidir.",
        "İlgisiz cümle çıkarıldığında paragraf daha akıcı olmalıdır.",
      ],
      mistakes: [
        "Ortak kelime içerdiği için sapan cümleyi ilgili sanmak.",
      ],
      strategy: "Paragrafın ana fikrini tek cümleyle yaz; her cümlenin bu ana fikre hizmet edip etmediğini kontrol et ve şüpheli cümleyi çıkarıp akışı yeniden oku.",
      examples: [
        {
          question: "(I) Bees pollinate crops. (II) This helps food production. (III) Honey has been used as medicine for centuries. (IV) Without bees, yields would fall.",
          answer: "III",
          explanation: "Paragraf arıların tozlaşmadaki rolünü anlatıyor; balın tıbbi kullanımı farklı bir alt konudur.",
        },
        {
          question: "İlgisiz cümleyi bulduktan sonra nasıl kontrol edersin?",
          answer: "Cümleyi çıkarıp paragrafı baştan okursun.",
          explanation: "Akış bozulmadan devam ediyorsa doğru cümleyi bulmuşsundur.",
        },
      ],
      vocabulary: [
        { term: "irrelevant", meaning: "ilgisiz" },
        { term: "overall", meaning: "genel" },
      ],
    },
  },
];
