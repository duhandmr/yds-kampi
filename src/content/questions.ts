import { OPTION_LABELS, type DifficultyKey, type OptionLabel, type QuestionTypeKey } from "../lib/constants";
import type { KeywordEntry, QuestionDraft } from "../lib/questions/types";
import { QUESTIONS_PART_2 } from "./questions-part2";

/**
 * Özgün başlangıç soru bankası. Sorular bu proje için yazılmıştır; gerçek ÖSYM sınavlarından alınmamıştır.
 * Tüm sorular seed sırasında ve testlerde otomatik kalite kontrolünden geçirilir.
 */

export interface SeedQuestionInput {
  type: QuestionTypeKey;
  topic: string;
  subtopic: string;
  difficulty: DifficultyKey;
  passage?: string;
  stem: string;
  options: [string, string, string, string, string];
  rationales: [string, string, string, string, string];
  correct: OptionLabel;
  explanation: string;
  strategy: string;
  tip: string;
  keywords: KeywordEntry[];
}

export function toDraft(q: SeedQuestionInput): QuestionDraft {
  return {
    type: q.type,
    topicSlug: q.topic,
    subtopic: q.subtopic,
    difficulty: q.difficulty,
    passage: q.passage ?? null,
    stem: q.stem,
    options: OPTION_LABELS.map((label, i) => ({ label, text: q.options[i]!, rationale: q.rationales[i]! })),
    correctLabel: q.correct,
    explanation: q.explanation,
    strategy: q.strategy,
    tip: q.tip,
    keywords: q.keywords,
  };
}

const PART_1: SeedQuestionInput[] = [
  // ---------------- KELİME BİLGİSİ ----------------
  {
    type: "VOCABULARY",
    topic: "kelime-bilgisi",
    subtopic: "Sıfat",
    difficulty: "EASY",
    stem: "The new vaccine proved highly ---- in preventing the spread of the disease among elderly patients.",
    options: ["reluctant", "effective", "obsolete", "fragile", "hostile"],
    rationales: [
      "Yanlış: reluctant (isteksiz) insanlar için kullanılır; bir aşının 'isteksiz' olması anlamsızdır.",
      "Doğru: effective in doing something (bir şeyi yapmakta etkili) kalıbı, hastalığın yayılmasını önleme bağlamına tam uyar.",
      "Yanlış: obsolete (modası geçmiş) yeni bir aşıyla çelişir.",
      "Yanlış: fragile (kırılgan) önleme başarısıyla ilgili bir anlam taşımaz.",
      "Yanlış: hostile (düşmanca) bağlamla ilgisizdir.",
    ],
    correct: "B",
    explanation: "Doğru cevap B. Cümle, aşının hastalığın yayılmasını önlemede başarılı olduğunu anlatıyor. 'proved highly effective in preventing' (önlemede son derece etkili olduğunu kanıtladı) hem anlam hem de 'effective in + V-ing' kalıbı açısından tek uygun seçenektir.",
    strategy: "Boşluktan sonraki 'in preventing' ifadesi, 'bir şeyi yapmada başarılı' anlamı veren bir sıfat ister. Olumlu bir sonuç anlatıldığı için olumsuz anlamlı sıfatları hızla ele.",
    tip: "'proved + sıfat' yapısı 'olduğu ortaya çıktı' anlamı verir; sıfatın yönü (olumlu/olumsuz) bağlamla uyumlu olmalıdır.",
    keywords: [
      { term: "effective", meaningTr: "etkili", partOfSpeech: "sıfat", exampleEn: "Regular revision is an effective way to remember new words.", exampleTr: "Düzenli tekrar, yeni kelimeleri hatırlamanın etkili bir yoludur.", synonyms: ["efficient", "successful"], antonyms: ["ineffective", "useless"] },
      { term: "obsolete", meaningTr: "modası geçmiş, kullanılmayan", partOfSpeech: "sıfat", exampleEn: "Many of these machines became obsolete within a decade.", exampleTr: "Bu makinelerin çoğu on yıl içinde kullanılmaz hâle geldi.", synonyms: ["outdated"], antonyms: ["modern", "current"] },
    ],
  },
  {
    type: "VOCABULARY",
    topic: "kelime-bilgisi",
    subtopic: "Fiil",
    difficulty: "MEDIUM",
    stem: "Despite years of research, scientists have not yet been able to ---- the exact cause of the condition, which affects millions of people worldwide.",
    options: ["determine", "neglect", "postpone", "exaggerate", "abandon"],
    rationales: [
      "Doğru: determine the cause (nedenini belirlemek) araştırma bağlamına ve 'despite' ile kurulan zıtlığa uyar.",
      "Yanlış: neglect (ihmal etmek) araştırmanın amacıyla çelişir; 'ihmal edemediler' anlamsızdır.",
      "Yanlış: postpone (ertelemek) bir nedeni ertelemek mantıklı değildir.",
      "Yanlış: exaggerate (abartmak) bağlamla ilgisizdir.",
      "Yanlış: abandon (terk etmek) 'yıllarca araştırmaya rağmen terk edemediler' anlamsız bir zıtlık kurar.",
    ],
    correct: "A",
    explanation: "Doğru cevap A. 'Yıllarca süren araştırmaya rağmen bilim insanları hastalığın kesin nedenini henüz belirleyemedi.' Despite ile kurulan zıtlık, beklenen sonucun (nedeni bulmak) gerçekleşmediğini anlatır; bu anlamı yalnızca 'determine' verir.",
    strategy: "'Despite years of research' ifadesi, araştırmanın beklenen sonucunun elde edilemediğini gösterir. Araştırmanın doğal hedefini anlatan fiili ara.",
    tip: "'the cause of' gibi isim öbekleri hangi fiillerle kullanıldığını gösterir: determine/identify/find the cause.",
    keywords: [
      { term: "determine", meaningTr: "belirlemek, saptamak", partOfSpeech: "fiil", exampleEn: "Tests were carried out to determine the age of the fossil.", exampleTr: "Fosilin yaşını belirlemek için testler yapıldı.", synonyms: ["identify", "establish"], antonyms: ["overlook"] },
      { term: "neglect", meaningTr: "ihmal etmek", partOfSpeech: "fiil", exampleEn: "The old building had been neglected for years.", exampleTr: "Eski bina yıllarca ihmal edilmişti.", synonyms: ["disregard"], antonyms: ["attend to"] },
    ],
  },
  {
    type: "VOCABULARY",
    topic: "kelime-bilgisi",
    subtopic: "Fiil",
    difficulty: "MEDIUM",
    stem: "Urban planners warn that the city's rapid population growth will inevitably ---- its already overstretched public transport system.",
    options: ["strain", "praise", "imitate", "dismiss", "cherish"],
    rationales: [
      "Doğru: strain (zorlamak, yük bindirmek), 'already overstretched' (zaten aşırı yüklenmiş) ifadesiyle birlikte olumsuz bir sonucu doğru anlatır.",
      "Yanlış: praise (övmek) nüfus artışının ulaşım sistemi üzerindeki etkisini anlatamaz.",
      "Yanlış: imitate (taklit etmek) bağlamla ilgisizdir.",
      "Yanlış: dismiss (reddetmek, göz ardı etmek) nüfusun bir sistemi 'göz ardı etmesi' anlamsızdır.",
      "Yanlış: cherish (değer vermek) olumlu bir anlam taşır ve 'warn' ile kurulan uyarı bağlamına uymaz.",
    ],
    correct: "A",
    explanation: "Doğru cevap A. Planlamacılar bir tehlikeye karşı uyarıyor (warn) ve ulaşım sistemi zaten aşırı yüklenmiş (already overstretched). Hızlı nüfus artışının bu sisteme daha fazla yük bindireceği anlamını yalnızca 'strain' verir.",
    strategy: "'warn' ve 'already overstretched' ifadeleri olumsuz bir etkiyi işaret eder. Olumlu veya nötr anlamlı fiilleri ele.",
    tip: "'already' içeren ifadeler, boşluktaki kelimenin aynı yönde (burada olumsuz) bir durumu artırdığını gösterebilir.",
    keywords: [
      { term: "strain", meaningTr: "zorlamak, baskı uygulamak", partOfSpeech: "fiil", exampleEn: "The heatwave strained the country's electricity supply.", exampleTr: "Sıcak hava dalgası ülkenin elektrik arzını zorladı.", synonyms: ["burden", "stretch"], antonyms: ["ease", "relieve"] },
      { term: "inevitably", meaningTr: "kaçınılmaz olarak", partOfSpeech: "zarf", exampleEn: "Rising costs will inevitably affect prices.", exampleTr: "Artan maliyetler kaçınılmaz olarak fiyatları etkileyecek.", synonyms: ["unavoidably"], antonyms: ["possibly"] },
    ],
  },
  {
    type: "VOCABULARY",
    topic: "kelime-bilgisi",
    subtopic: "Sıfat",
    difficulty: "HARD",
    stem: "The committee's report was widely criticised for being ----, as it offered only vague recommendations rather than concrete measures.",
    options: ["meticulous", "inconclusive", "compelling", "unanimous", "explicit"],
    rationales: [
      "Yanlış: meticulous (titiz, çok dikkatli) olumlu bir özelliktir; eleştiri gerekçesi olamaz.",
      "Doğru: inconclusive (kesin bir sonuca varmayan) 'yalnızca belirsiz öneriler sundu' açıklamasıyla tam örtüşür.",
      "Yanlış: compelling (ikna edici) olumlu anlamlıdır ve eleştiriyle çelişir.",
      "Yanlış: unanimous (oybirliğiyle alınmış) raporun belirsiz olmasıyla ilişkili değildir.",
      "Yanlış: explicit (açık, net) 'vague' (belirsiz) kelimesinin tam tersidir.",
    ],
    correct: "B",
    explanation: "Doğru cevap B. 'as' ile verilen gerekçe, raporun somut önlemler yerine belirsiz öneriler sunduğunu söylüyor. Bu nedenle rapor 'kesin bir sonuca ulaşmadığı' (inconclusive) için eleştirilmiştir.",
    strategy: "Gerekçe bildiren 'as' bölümünü boşluğun tanımı gibi kullan: 'vague, not concrete' anlamına en yakın sıfatı ara ve olumlu sıfatları ele.",
    tip: "criticised for being ---- kalıbında boşluğa olumsuz bir nitelik gelir.",
    keywords: [
      { term: "inconclusive", meaningTr: "sonuçsuz, kesin sonuca varmayan", partOfSpeech: "sıfat", exampleEn: "The evidence from the first trial was inconclusive.", exampleTr: "İlk denemeden elde edilen kanıtlar kesin değildi.", synonyms: ["indefinite", "unresolved"], antonyms: ["conclusive", "decisive"] },
      { term: "vague", meaningTr: "belirsiz, muğlak", partOfSpeech: "sıfat", exampleEn: "He gave only a vague answer to the question.", exampleTr: "Soruya yalnızca belirsiz bir cevap verdi.", synonyms: ["unclear", "ambiguous"], antonyms: ["precise", "clear"] },
    ],
  },
  {
    type: "VOCABULARY",
    topic: "kelime-bilgisi",
    subtopic: "Phrasal verb",
    difficulty: "MEDIUM",
    stem: "Following weeks of widespread public protests, the government decided to ---- the controversial tax reform.",
    options: ["call off", "look up", "take after", "run into", "put up with"],
    rationales: [
      "Doğru: call off (iptal etmek), protestolar sonrasında hükümetin tartışmalı reformdan vazgeçmesini anlatır.",
      "Yanlış: look up (sözlükte aramak) bir reformla kullanılmaz.",
      "Yanlış: take after (birine benzemek) aile üyeleri için kullanılır.",
      "Yanlış: run into (rastlamak) bir kararın içeriği olamaz.",
      "Yanlış: put up with (katlanmak) reformu yapan hükümetin onu 'katlanmaya karar vermesi' anlamsızdır.",
    ],
    correct: "A",
    explanation: "Doğru cevap A. Yaygın protestolar, hükümetin tartışmalı reformdan vazgeçmesine yol açan bir neden olarak verilmiştir. 'call off the reform' (reformu iptal etmek) bu sebep-sonuç ilişkisine uyan tek seçenektir.",
    strategy: "Phrasal verb sorularında her seçeneğin anlamını kısaca Türkçeye çevir ve cümleye yerleştir. Protesto → geri adım ilişkisine uyanı seç.",
    tip: "call off = cancel; put off = postpone. Bu iki phrasal verb sık karıştırılır.",
    keywords: [
      { term: "call off", meaningTr: "iptal etmek", partOfSpeech: "phrasal verb", exampleEn: "The match was called off because of the storm.", exampleTr: "Maç fırtına nedeniyle iptal edildi.", synonyms: ["cancel", "abandon"], antonyms: ["carry out"] },
      { term: "controversial", meaningTr: "tartışmalı", partOfSpeech: "sıfat", exampleEn: "The decision proved highly controversial.", exampleTr: "Karar oldukça tartışmalı oldu.", synonyms: ["debatable", "disputed"], antonyms: ["uncontroversial"] },
    ],
  },
  // ---------------- DİL BİLGİSİ ----------------
  {
    type: "GRAMMAR",
    topic: "zamanlar",
    subtopic: "Past perfect",
    difficulty: "EASY",
    stem: "By the time the rescue team arrived, the fire ---- most of the building.",
    options: ["destroys", "has destroyed", "had destroyed", "will destroy", "is destroying"],
    rationales: [
      "Yanlış: present simple, geçmişte tamamlanmış bir olayı anlatamaz.",
      "Yanlış: present perfect, 'arrived' ile belirtilen geçmiş zaman çerçevesine uymaz.",
      "Doğru: 'By the time + past simple' yapısında ana cümle past perfect olur; yangın, ekip gelmeden önce binanın çoğunu yok etmişti.",
      "Yanlış: gelecek zaman, geçmişte olmuş bir olayla çelişir.",
      "Yanlış: present continuous, geçmiş zaman bağlamına uymaz.",
    ],
    correct: "C",
    explanation: "Doğru cevap C. 'By the time the rescue team arrived' geçmişte bir anı gösterir. Yangının binayı yok etmesi bu andan önce tamamlandığı için 'had destroyed' (past perfect) kullanılır.",
    strategy: "'By the time' gördüğünde yan cümlenin zamanına bak: past simple ise ana cümlede past perfect, present simple ise future perfect ara.",
    tip: "Geçmişteki iki olaydan önce olanı past perfect ile anlatılır.",
    keywords: [
      { term: "by the time", meaningTr: "-dığı zamana kadar", partOfSpeech: "bağlaç öbeği", exampleEn: "By the time I finished, everyone had left.", exampleTr: "Bitirdiğimde herkes gitmişti.", synonyms: ["before"], antonyms: [] },
    ],
  },
  {
    type: "GRAMMAR",
    topic: "zamanlar",
    subtopic: "Present perfect continuous",
    difficulty: "MEDIUM",
    stem: "Researchers ---- the effects of social media use on sleep quality since 2015, but their findings remain inconsistent.",
    options: ["have been studying", "studied", "were studying", "will have studied", "study"],
    rationales: [
      "Doğru: since 2015 geçmişte başlayıp hâlâ süren bir eylemi gösterir; 'remain' (hâlâ) ifadesi de süreklilik bildirir.",
      "Yanlış: past simple, 'since' ile kullanılmaz ve eylemin bittiğini ima eder.",
      "Yanlış: past continuous, geçmişteki belirli bir anda süren eylem içindir; since ile uyumlu değildir.",
      "Yanlış: future perfect, geleceğe ait bir zaman çerçevesi gerektirir.",
      "Yanlış: present simple, since ile belirtilen süreyi anlatamaz.",
    ],
    correct: "A",
    explanation: "Doğru cevap A. 'since 2015' ifadesi eylemin geçmişte başladığını ve hâlâ devam ettiğini gösterir. Bu nedenle present perfect continuous (have been studying) kullanılır. 'remain inconsistent' ifadesi de durumun şimdiye uzandığını destekler.",
    strategy: "Önce zaman ifadesini (since 2015) bul. 'since' → present perfect (continuous) kuralıyla seçenekleri tek adımda ele.",
    tip: "since + geçmiş bir an, for + süre: ikisi de çoğunlukla present perfect ister.",
    keywords: [
      { term: "inconsistent", meaningTr: "tutarsız", partOfSpeech: "sıfat", exampleEn: "The results of the two surveys were inconsistent.", exampleTr: "İki anketin sonuçları tutarsızdı.", synonyms: ["contradictory", "conflicting"], antonyms: ["consistent"] },
      { term: "findings", meaningTr: "bulgular", partOfSpeech: "isim", exampleEn: "The findings were published in a scientific journal.", exampleTr: "Bulgular bilimsel bir dergide yayımlandı.", synonyms: ["results", "conclusions"], antonyms: [] },
    ],
  },
  {
    type: "GRAMMAR",
    topic: "baglaclar",
    subtopic: "Zıtlık bağlaçları",
    difficulty: "MEDIUM",
    stem: "---- the experiment was repeated several times, the researchers failed to obtain consistent results.",
    options: ["Because", "Although", "Unless", "So that", "As long as"],
    rationales: [
      "Yanlış: Because sebep bildirir; deneyin tekrarlanması tutarsız sonucun sebebi değildir.",
      "Doğru: Although zıtlık bildirir: deney defalarca tekrarlanmasına rağmen tutarlı sonuç alınamadı.",
      "Yanlış: Unless (-medikçe) koşul bildirir ve geçmişteki gerçek bir olayla anlamsız olur.",
      "Yanlış: So that amaç bildirir; ayrıca cümle başında bu anlamı kurmaz.",
      "Yanlış: As long as (-dığı sürece) koşul bildirir; zıtlık ilişkisini kuramaz.",
    ],
    correct: "B",
    explanation: "Doğru cevap B. Deneyin birçok kez tekrarlanması, tutarlı sonuçlar beklenmesine yol açar; ancak bu sonuç elde edilememiştir. Beklentiyle sonuç arasındaki bu zıtlığı 'Although' kurar.",
    strategy: "İki yan cümle arasındaki ilişkiyi Türkçe olarak 'rağmen mi, çünkü mü, eğer mi?' diye test et.",
    tip: "Although/even though + tam cümle; despite/in spite of + isim veya V-ing.",
    keywords: [
      { term: "obtain", meaningTr: "elde etmek", partOfSpeech: "fiil", exampleEn: "You need to obtain permission before using the data.", exampleTr: "Verileri kullanmadan önce izin almanız gerekir.", synonyms: ["acquire", "gain"], antonyms: ["lose"] },
      { term: "consistent", meaningTr: "tutarlı", partOfSpeech: "sıfat", exampleEn: "Her performance has been consistent all year.", exampleTr: "Performansı yıl boyunca tutarlı oldu.", synonyms: ["steady", "stable"], antonyms: ["inconsistent"] },
    ],
  },
  {
    type: "GRAMMAR",
    topic: "baglaclar",
    subtopic: "Çift bağlaçlar",
    difficulty: "HARD",
    stem: "The project was not only far more expensive than planned ---- also two years behind schedule, which eventually led to its cancellation.",
    options: ["and", "but", "or", "yet", "so"],
    rationales: [
      "Yanlış: 'not only ... and also' standart bir kalıp değildir.",
      "Doğru: 'not only ... but also' (sadece ... değil, aynı zamanda ...) çift bağlacı tamamlar.",
      "Yanlış: or, 'either ... or' kalıbının parçasıdır.",
      "Yanlış: yet zıtlık bildirir ve 'not only' ile kalıp oluşturmaz.",
      "Yanlış: so sonuç bildirir ve 'not only' kalıbını tamamlamaz.",
    ],
    correct: "B",
    explanation: "Doğru cevap B. Cümlede 'not only' ifadesi kullanılmıştır ve devamında 'also' gelmektedir. Bu çift bağlaç yalnızca 'not only ... but also' biçiminde tamamlanır.",
    strategy: "Cümlenin başında veya ortasında 'not only, both, either, neither' gördüğünde, eşini (but also, and, or, nor) ara; bu soru kalıp bilgisiyle saniyeler içinde çözülür.",
    tip: "both ... and, either ... or, neither ... nor, not only ... but also: eşleşmeler değiştirilemez.",
    keywords: [
      { term: "behind schedule", meaningTr: "programın gerisinde", partOfSpeech: "deyim", exampleEn: "The construction work is three months behind schedule.", exampleTr: "İnşaat çalışmaları programın üç ay gerisinde.", synonyms: ["delayed", "late"], antonyms: ["ahead of schedule", "on time"] },
      { term: "eventually", meaningTr: "sonunda", partOfSpeech: "zarf", exampleEn: "After many attempts, she eventually passed the exam.", exampleTr: "Birçok denemeden sonra sonunda sınavı geçti.", synonyms: ["finally", "ultimately"], antonyms: [] },
    ],
  },
  {
    type: "GRAMMAR",
    topic: "relative-clauses",
    subtopic: "whose",
    difficulty: "MEDIUM",
    stem: "Marie Curie, ---- research on radioactivity earned her two Nobel Prizes, remains an inspiration for scientists around the world.",
    options: ["who", "which", "whose", "whom", "that"],
    rationales: [
      "Yanlış: who özne zamiridir; ardından 'research' ismi gelemez.",
      "Yanlış: which insanlar için kullanılmaz.",
      "Doğru: whose iyelik bildirir: 'araştırması ona iki Nobel kazandıran Marie Curie'.",
      "Yanlış: whom nesne zamiridir ve ardından doğrudan bir isim gelmez.",
      "Yanlış: that virgülle ayrılan (non-defining) yan cümlede kullanılmaz.",
    ],
    correct: "C",
    explanation: "Doğru cevap C. Boşluktan hemen sonra 'research' ismi geliyor ve bu araştırma Marie Curie'ye ait. Sahiplik ilişkisi 'whose' ile kurulur.",
    strategy: "Boşluktan sonraki ilk kelimeye bak: isim geliyorsa (research, book, car) önce whose seçeneğini kontrol et.",
    tip: "Virgülle ayrılan relative clause'larda that kullanılmaz.",
    keywords: [
      { term: "radioactivity", meaningTr: "radyoaktivite", partOfSpeech: "isim", exampleEn: "Radioactivity was discovered at the end of the nineteenth century.", exampleTr: "Radyoaktivite on dokuzuncu yüzyılın sonunda keşfedildi.", synonyms: [], antonyms: [] },
      { term: "inspiration", meaningTr: "ilham kaynağı", partOfSpeech: "isim", exampleEn: "Her courage is an inspiration to us all.", exampleTr: "Onun cesareti hepimiz için bir ilham kaynağıdır.", synonyms: ["motivation"], antonyms: [] },
    ],
  },
  {
    type: "GRAMMAR",
    topic: "edatlar",
    subtopic: "Fiil + edat",
    difficulty: "EASY",
    stem: "The success of the recycling campaign depends largely ---- the active support of local communities.",
    options: ["at", "on", "with", "for", "in"],
    rationales: [
      "Yanlış: 'depend at' diye bir kalıp yoktur.",
      "Doğru: depend on (bir şeye bağlı olmak) kalıplaşmış fiil-edat birleşimidir.",
      "Yanlış: 'depend with' standart İngilizcede kullanılmaz.",
      "Yanlış: 'depend for' bu anlamı vermez.",
      "Yanlış: 'depend in' yanlış bir kalıptır.",
    ],
    correct: "B",
    explanation: "Doğru cevap B. 'depend' fiili 'on' edatıyla kalıplaşmıştır: kampanyanın başarısı büyük ölçüde yerel toplulukların desteğine bağlıdır. Araya giren 'largely' zarfı kalıbı değiştirmez.",
    strategy: "Araya giren zarfları (largely, heavily, mainly) görmezden gel ve fiil + edat kalıbını tanı.",
    tip: "depend on / rely on / be based on: 'dayanmak' anlamındaki fiiller genellikle 'on' alır.",
    keywords: [
      { term: "depend on", meaningTr: "-e bağlı olmak", partOfSpeech: "phrasal verb", exampleEn: "Our plans depend on the weather.", exampleTr: "Planlarımız havaya bağlı.", synonyms: ["rely on", "hinge on"], antonyms: [] },
      { term: "largely", meaningTr: "büyük ölçüde", partOfSpeech: "zarf", exampleEn: "The project was largely successful.", exampleTr: "Proje büyük ölçüde başarılıydı.", synonyms: ["mainly", "mostly"], antonyms: ["slightly"] },
    ],
  },
  {
    type: "GRAMMAR",
    topic: "edilgen-ve-kipler",
    subtopic: "Modal perfect (edilgen)",
    difficulty: "HARD",
    stem: "If the warning signs had been noticed earlier, the collapse of the bridge ----.",
    options: ["could have been prevented", "can be prevented", "would prevent", "had been prevented", "was prevented"],
    rationales: [
      "Doğru: Third conditional'da ana cümle 'would/could have V3' olur; köprünün çöküşü kendi kendini önleyemeyeceği için edilgen 'could have been prevented' gerekir.",
      "Yanlış: can be prevented şimdiki/genel zamana aittir; geçmişe dair varsayımla uyuşmaz.",
      "Yanlış: would prevent second conditional yapısıdır ve etken çatıdadır.",
      "Yanlış: had been prevented, if cümlesinin zamanıdır; ana cümlede modal gerekir.",
      "Yanlış: was prevented gerçekleşmiş bir olayı anlatır; oysa cümle gerçekleşmemiş bir durumu varsayıyor.",
    ],
    correct: "A",
    explanation: "Doğru cevap A. 'If ... had been noticed' yapısı geçmişte gerçekleşmemiş bir koşulu (third conditional) anlatır. Ana cümlede 'could/would have + V3' gerekir. Çöküş bir eylemi yapan değil, etkilenen olduğu için edilgen 'could have been prevented' kullanılır.",
    strategy: "Önce if cümlesinin türünü belirle (had V3 → third conditional), sonra öznenin eylemi yapıp yapamayacağına bakarak etken/edilgen seçimini yap.",
    tip: "Third conditional: If + had V3, would/could/might have V3.",
    keywords: [
      { term: "collapse", meaningTr: "çökme; çökmek", partOfSpeech: "isim/fiil", exampleEn: "The collapse of the old mine shocked the town.", exampleTr: "Eski madenin çökmesi kasabayı şoke etti.", synonyms: ["breakdown", "fall"], antonyms: [] },
      { term: "prevent", meaningTr: "önlemek", partOfSpeech: "fiil", exampleEn: "Early treatment can prevent serious complications.", exampleTr: "Erken tedavi ciddi komplikasyonları önleyebilir.", synonyms: ["avert", "stop"], antonyms: ["allow", "cause"] },
    ],
  },
  // ---------------- CÜMLE TAMAMLAMA ----------------
  {
    type: "SENTENCE_COMPLETION",
    topic: "cumle-tamamlama",
    subtopic: "Koşul (unless)",
    difficulty: "EASY",
    stem: "Unless people significantly reduce their consumption of single-use plastics, ----.",
    options: [
      "many marine species will continue to be threatened",
      "recycling facilities were built in many coastal towns",
      "the ocean had been much cleaner in the past",
      "plastic was invented in the early twentieth century",
      "scientists have recently discovered a new species of fish",
    ],
    rationales: [
      "Doğru: Unless + present simple yapısı ana cümlede gelecek zaman ister; plastik tüketimi azalmazsa deniz canlılarının tehdit altında kalmaya devam edeceği mantıklı bir sonuçtur.",
      "Yanlış: past simple, unless + present simple ile kurulan koşul yapısına uymaz.",
      "Yanlış: past perfect hem zaman olarak uyumsuzdur hem de koşulun sonucunu anlatmaz.",
      "Yanlış: plastiğin icadı, tüketimi azaltma koşuluna bağlı bir sonuç değildir.",
      "Yanlış: yeni bir tür keşfi, plastik tüketimiyle koşul ilişkisi kurmaz.",
    ],
    correct: "A",
    explanation: "Doğru cevap A. 'Unless' (-medikçe) ile kurulan birinci tip koşul cümlesinde ana cümle gelecek zamanda olur. 'İnsanlar tek kullanımlık plastik tüketimini azaltmadıkça birçok deniz canlısı tehdit altında kalmaya devam edecek' hem anlam hem zaman olarak uyumludur.",
    strategy: "Önce zaman uyumuna bak: unless + present simple → ana cümlede will. Geçmiş zamanlı seçenekleri hemen ele, sonra anlamı kontrol et.",
    tip: "Unless = if ... not. Koşulun sonucu, koşulla mantıksal olarak bağlantılı olmalıdır.",
    keywords: [
      { term: "consumption", meaningTr: "tüketim", partOfSpeech: "isim", exampleEn: "Energy consumption rises in winter.", exampleTr: "Enerji tüketimi kışın artar.", synonyms: ["use", "usage"], antonyms: ["production"] },
      { term: "threaten", meaningTr: "tehdit etmek", partOfSpeech: "fiil", exampleEn: "Pollution threatens many rare plants.", exampleTr: "Kirlilik birçok nadir bitkiyi tehdit ediyor.", synonyms: ["endanger", "jeopardise"], antonyms: ["protect"] },
    ],
  },
  {
    type: "SENTENCE_COMPLETION",
    topic: "cumle-tamamlama",
    subtopic: "Zıtlık (although)",
    difficulty: "MEDIUM",
    stem: "Although remote work offers employees greater flexibility in organising their time, ----.",
    options: [
      "it can also lead to feelings of isolation and blurred boundaries between work and home",
      "many companies have adopted it since the beginning of the pandemic",
      "employees prefer it because they save time that would otherwise be spent commuting",
      "it allows people to plan their daily schedules more freely",
      "productivity tends to increase when workers feel comfortable",
    ],
    rationales: [
      "Doğru: Although zıtlık ister; esnekliğin olumlu yanına karşılık yalnızlık ve sınırların bulanıklaşması gibi olumsuz bir sonuç sunulmuştur.",
      "Yanlış: şirketlerin uzaktan çalışmayı benimsemesi, esneklikle zıt bir fikir değildir.",
      "Yanlış: çalışanların tercih etmesi de olumlu bir bilgidir; zıtlık kurmaz.",
      "Yanlış: esnek planlama, verilen olumlu bilginin tekrarıdır; zıtlık yoktur.",
      "Yanlış: verimliliğin artması olumlu yönde devam eder; Although'ın gerektirdiği zıtlığı kurmaz.",
    ],
    correct: "A",
    explanation: "Doğru cevap A. 'Although' iki zıt fikri bağlar. Cümlenin ilk kısmı uzaktan çalışmanın olumlu bir yanını (esneklik) verdiği için ikinci kısım olumsuz bir yön içermelidir. Yalnızca A seçeneği yalnızlık ve iş-ev sınırlarının bulanıklaşması gibi bir dezavantaj sunar.",
    strategy: "Bağlacın türünü belirle (zıtlık), ardından verilen yarımın olumlu mu olumsuz mu olduğuna bak ve ters yönde olan seçeneği bul.",
    tip: "Although ile başlayan sorularda, verilen yarımla aynı yönde (olumlu-olumlu) ilerleyen seçenekler en güçlü çeldiricilerdir.",
    keywords: [
      { term: "flexibility", meaningTr: "esneklik", partOfSpeech: "isim", exampleEn: "The job offers a lot of flexibility.", exampleTr: "Bu iş çok fazla esneklik sunuyor.", synonyms: ["adaptability"], antonyms: ["rigidity"] },
      { term: "isolation", meaningTr: "yalnızlık, yalıtılmışlık", partOfSpeech: "isim", exampleEn: "Many elderly people suffer from social isolation.", exampleTr: "Birçok yaşlı insan sosyal yalnızlıktan muzdarip.", synonyms: ["loneliness", "seclusion"], antonyms: ["connection"] },
    ],
  },
  {
    type: "SENTENCE_COMPLETION",
    topic: "cumle-tamamlama",
    subtopic: "Sebep (since)",
    difficulty: "MEDIUM",
    stem: "----, the museum was forced to close several of its galleries to the public.",
    options: [
      "Since its funding was cut drastically last year",
      "As soon as the new director is appointed",
      "Provided that the renovations are completed on time",
      "In order that visitors will enjoy the exhibitions",
      "So that more tourists could visit the collection",
    ],
    rationales: [
      "Doğru: Since (çünkü) sebep bildirir; fonların ciddi şekilde kesilmesi galerilerin kapatılmasının mantıklı bir nedenidir ve zamanlar uyumludur.",
      "Yanlış: present simple (is appointed) geçmiş zamanlı ana cümleyle uyumlu değildir.",
      "Yanlış: Provided that koşul bildirir ve present zaman kullanır; geçmişte olmuş bir kapanışla uyuşmaz.",
      "Yanlış: amaç ifadesi, galerilerin kapatılmasıyla çelişir; ayrıca 'will' zaman uyumunu bozar.",
      "Yanlış: daha fazla turistin ziyaret edebilmesi amacıyla galerileri kapatmak çelişkilidir.",
    ],
    correct: "A",
    explanation: "Doğru cevap A. Ana cümle geçmiş zamanda ve olumsuz bir olayı (galerilerin kapatılması) anlatıyor. Bu olayın mantıklı nedeni, geçen yıl fonların ciddi şekilde kesilmesidir. Diğer seçenekler ya zaman uyumunu bozar ya da kapanışla çelişen bir amaç bildirir.",
    strategy: "Ana cümlenin zamanını (was forced) ve anlamını (olumsuz sonuç) belirle; sonra sebep bildiren ve zamanı uyumlu seçeneği ara.",
    tip: "Since iki anlamlıdır: 'çünkü' (sebep) ve '-den beri' (zaman). Cümlenin zamanına bakarak hangisi olduğunu anla.",
    keywords: [
      { term: "drastically", meaningTr: "ciddi ölçüde, büyük oranda", partOfSpeech: "zarf", exampleEn: "Prices have fallen drastically this year.", exampleTr: "Fiyatlar bu yıl büyük oranda düştü.", synonyms: ["severely", "sharply"], antonyms: ["slightly"] },
      { term: "funding", meaningTr: "finansman, fon", partOfSpeech: "isim", exampleEn: "The project received funding from the government.", exampleTr: "Proje hükümetten fon aldı.", synonyms: ["financing"], antonyms: [] },
    ],
  },
  {
    type: "SENTENCE_COMPLETION",
    topic: "cumle-tamamlama",
    subtopic: "The more ... the ...",
    difficulty: "HARD",
    stem: "The more scientists learn about the human microbiome, ----.",
    options: [
      "the clearer it becomes that it plays a vital role in our overall health",
      "the most bacteria live in the digestive system",
      "they had studied it carefully for several decades",
      "much more research was needed in this field",
      "so complex the interactions between microbes seem",
    ],
    rationales: [
      "Doğru: 'The more ..., the + karşılaştırmalı sıfat ...' kalıbı 'ne kadar çok ..., o kadar ...' anlamı verir; 'the clearer' bu yapıyı tamamlar.",
      "Yanlış: 'the most' üstünlük derecesidir; kalıp karşılaştırmalı (comparative) yapı ister.",
      "Yanlış: past perfect hem kalıba hem de present simple ile kurulan zamana uymaz.",
      "Yanlış: 'the + comparative' yapısıyla başlamadığı için kalıbı tamamlamaz ve zaman uyumsuzdur.",
      "Yanlış: 'so ... seem' devrik yapısı bu kalıpla kullanılmaz.",
    ],
    correct: "A",
    explanation: "Doğru cevap A. 'The more ... , the + comparative ...' kalıbı iki şeyin birlikte arttığını anlatır: 'Bilim insanları mikrobiyom hakkında ne kadar çok şey öğrenirse, onun genel sağlığımızda hayati bir rol oynadığı o kadar netleşiyor.'",
    strategy: "Cümle 'The more/The less' ile başlıyorsa ikinci yarı mutlaka 'the + comparative' ile başlamalıdır; bu kuralla seçenekleri hızla ele.",
    tip: "The sooner, the better gibi kısa kalıplar da aynı yapıyı izler.",
    keywords: [
      { term: "vital", meaningTr: "hayati, çok önemli", partOfSpeech: "sıfat", exampleEn: "Water is vital for all living things.", exampleTr: "Su, tüm canlılar için hayatidir.", synonyms: ["essential", "crucial"], antonyms: ["trivial", "unimportant"] },
      { term: "microbiome", meaningTr: "mikrobiyom (vücuttaki mikroorganizma topluluğu)", partOfSpeech: "isim", exampleEn: "Diet can change the composition of the gut microbiome.", exampleTr: "Beslenme, bağırsak mikrobiyomunun yapısını değiştirebilir.", synonyms: [], antonyms: [] },
    ],
  },
];

export const SEED_QUESTIONS: SeedQuestionInput[] = [...PART_1, ...QUESTIONS_PART_2];
