import { DIFFICULTY_LABELS, QUESTION_TYPE_LABELS, type DifficultyKey, type QuestionTypeKey } from "../constants";

/**
 * Yapay zekâya kişisel veri gönderilmez: istemlerde yalnızca soru tipi, konu, zorluk ve
 * anonim performans özetleri (yüzdeler) bulunur. "Yaren" adı veya hesap bilgisi gönderilmez.
 */

const TYPE_FORMAT: Record<QuestionTypeKey, string> = {
  VOCABULARY: "Tek bir akademik İngilizce cümle; boşluk '----' ile gösterilir; seçenekler aynı türden tek kelime veya phrasal verb olmalı. passage null.",
  GRAMMAR: "Tek bir akademik cümle; boşluk '----'; seçenekler dil bilgisi yapıları (zaman, bağlaç, edat, relative pronoun vb.). passage null.",
  SENTENCE_COMPLETION: "Yarım bir cümle ve '----'; seçenekler cümleyi tamamlayan yan cümleler. Yalnızca biri hem dil bilgisi hem anlam olarak uyumlu olmalı. passage null.",
  TRANSLATION_EN_TR: "stem: çevrilecek İngilizce cümle. Seçenekler Türkçe çeviriler; yalnızca biri anlamı ve zaman/kipliği eksiksiz korumalı. passage null.",
  TRANSLATION_TR_EN: "stem: çevrilecek Türkçe cümle. Seçenekler İngilizce çeviriler; yalnızca biri anlamı eksiksiz korumalı. passage null.",
  READING: "passage: 90-150 kelimelik akademik paragraf. stem: paragrafa dair tek bir soru (ör. 'According to the passage, ----.'). Cevap paragrafta açıkça desteklenmeli.",
  COHERENCE: "passage: son cümlesi '----' olan 3-4 cümlelik paragraf. stem: 'Which of the following best completes the paragraph?'.",
  DIALOGUE: "passage: iki kişi arasında, bir satırı '----' olan kısa diyalog. stem: 'Which of the following best completes the dialogue?'.",
  PARAPHRASE: "stem: bir İngilizce cümle ve 'Which of the following is closest in meaning to the sentence above?'. passage null.",
  MISSING_SENTENCE: "passage: ortasında '----' bulunan 4-5 cümlelik paragraf. stem: 'Which of the following best fills the blank in the passage?'.",
  IRRELEVANT_SENTENCE: "passage: (I), (II), (III), (IV), (V) ile numaralanmış beş cümle; yalnızca biri akışı bozar. Seçenekler A) I ... E) V. stem: 'Which of the following sentences is irrelevant to the overall meaning of the passage?'.",
};

export const QUESTION_SYSTEM_PROMPT = `Sen YDS (Yabancı Dil Sınavı) İngilizce bölümü için özgün soru yazan deneyimli bir ölçme-değerlendirme uzmanısın.
Kurallar:
- Gerçek ÖSYM sınavlarından veya telifli kaynaklardan soru KOPYALAMA; tüm içerik özgün olmalı.
- Akademik İngilizce düzeyi ve YDS üslubu kullan.
- Her soruda tam olarak beş seçenek (A-E) ve yalnızca BİR açık doğru cevap olmalı.
- Çeldiriciler mantıklı görünmeli ama kesin olarak yanlış olmalı. Birden fazla savunulabilir cevap varsa o soruyu yazma.
- Dil bilgisi ve yazım hatası yapma.
- "explanation" alanı Türkçe olmalı ve "Doğru cevap X." ifadesiyle başlamalı (X = correctLabel).
- Her seçeneğin "rationale" alanı Türkçe olmalı; doğru seçenek "Doğru:" ile, yanlış seçenekler "Yanlış:" ile başlamalı.
- "strategy" (çözüm stratejisi) ve "tip" (benzer sorularda dikkat edilecek nokta) Türkçe olmalı.
- "keywords": sorudaki önemli akademik kelimeler; her biri için term, meaningTr, partOfSpeech, exampleEn, exampleTr, synonyms, antonyms.
- Yalnızca istenen JSON nesnesini döndür; açıklama metni veya Markdown ekleme.`;

export function buildQuestionPrompt(params: {
  type: QuestionTypeKey;
  topicName: string;
  difficulty: DifficultyKey;
  count: number;
  avoidStems: string[];
}): string {
  const avoid = params.avoidStems.slice(0, 25).map((s) => `- ${s.slice(0, 140)}`).join("\n");
  return `Soru tipi: ${QUESTION_TYPE_LABELS[params.type]} (${params.type})
Konu: ${params.topicName}
Zorluk: ${DIFFICULTY_LABELS[params.difficulty]} (${params.difficulty})
Adet: ${params.count}
Biçim: ${TYPE_FORMAT[params.type]}

Aşağıdaki mevcut sorulara benzer (aynı cümle yapısı, aynı bağlam veya aynı cevap) sorular YAZMA:
${avoid || "- (yok)"}

Şu JSON şemasına birebir uy:
{"questions":[{"subtopic":"string","difficulty":"EASY|MEDIUM|HARD","passage":"string veya null","stem":"string","options":[{"label":"A","text":"string","rationale":"Doğru: ... / Yanlış: ..."},{"label":"B",...},{"label":"C",...},{"label":"D",...},{"label":"E",...}],"correctLabel":"A-E","explanation":"Doğru cevap X. ...","strategy":"string","tip":"string","keywords":[{"term":"string","meaningTr":"string","partOfSpeech":"string","exampleEn":"string","exampleTr":"string","synonyms":["string"],"antonyms":["string"]}]}]}`;
}

export const SOLVER_SYSTEM_PROMPT = `Sen YDS sorularını çözen titiz bir uzmansın. Sana cevap anahtarı verilmeden bir soru gösterilecek.
Soruyu bağımsız olarak çöz. Birden fazla seçenek savunulabiliyorsa ya da hiçbiri tam doğru değilse "ambiguous": true döndür.
Yalnızca şu JSON'u döndür: {"answer":"A-E","ambiguous":true|false,"reason":"kısa gerekçe"}`;

export function buildSolverPrompt(q: { passage?: string | null; stem: string; options: Array<{ label: string; text: string }> }): string {
  return `${q.passage ? `Metin:\n${q.passage}\n\n` : ""}Soru:\n${q.stem}\n\nSeçenekler:\n${q.options.map((o) => `${o.label}) ${o.text}`).join("\n")}`;
}

export const REVIEW_SYSTEM_PROMPT = `Sen YDS'ye hazırlanan bir öğrenciye geri bildirim veren sıcak ama profesyonel bir eğitim koçusun.
Türkçe yaz. Çocukça, abartılı veya yargılayıcı ifadeler kullanma. Öğrencinin adını kullanma. 2-4 cümle yaz.
Yalnızca şu JSON'u döndür: {"message":"string"}`;

export function buildReviewPrompt(summary: {
  scorePercent: number;
  previousScorePercent: number | null;
  topics: Array<{ name: string; percent: number; total: number }>;
}): string {
  return `Deneme özeti (anonim):
Başarı: %${summary.scorePercent}
Önceki deneme: ${summary.previousScorePercent === null ? "yok" : `%${summary.previousScorePercent}`}
Konular: ${summary.topics.map((t) => `${t.name}: %${t.percent} (${t.total} soru)`).join("; ")}
Güçlü yönü kısaca belirt, tekrar edilmesi gereken 1-2 konuyu öner ve bir sonraki denemede bu konulara ağırlık verileceğini söyle.`;
}

export const VOCAB_SYSTEM_PROMPT = `Sen akademik İngilizce kelime öğreten bir uzmansın. Verilen kelimeler için Türkçe anlam, kelime türü,
YDS düzeyinde özgün bir örnek İngilizce cümle, cümlenin Türkçe açıklaması, eş ve zıt anlamlılar üret.
Yalnızca şu JSON'u döndür: {"items":[{"term":"","meaningTr":"","partOfSpeech":"","exampleEn":"","exampleTr":"","synonyms":[],"antonyms":[]}]}`;

export function buildVocabPrompt(terms: Array<{ term: string; meaningTr: string }>): string {
  return `Kelimeler:\n${terms.map((t) => `- ${t.term} (${t.meaningTr})`).join("\n")}`;
}
