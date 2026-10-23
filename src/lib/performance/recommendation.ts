import type { QuestionTypeKey } from "../constants";
import type { Bucket } from "../exam/scoring";
import type { KeywordEntry } from "../questions/types";

export interface RecommendationInput {
  scorePercent: number;
  previousScorePercent: number | null;
  byTopic: Bucket[];
  wrongOrBlank: Array<{ questionId: string; topicName: string; keywords: KeywordEntry[] }>;
  totalQuestions: number;
}

export interface RecommendationOutput {
  message: string;
  focusTopics: Array<{ topicId: string; name: string; percent: number }>;
  strongTopics: Array<{ topicId: string; name: string; percent: number }>;
  reviewList: string[];
  vocabularyToReview: Array<{ term: string; meaningTr: string }>;
  extraQuestionCount: number;
  nextGoal: string;
}

function joinTr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} ve ${items[items.length - 1]}`;
}

/** Sonuçlara göre sıcak, yargılamayan ve somut bir günlük öneri üretir (yapay zekâ olmadan da çalışır). */
export function buildRecommendation(input: RecommendationInput): RecommendationOutput {
  const strong = input.byTopic.filter((b) => b.total >= 2 && b.percent >= 75).sort((a, b) => b.percent - a.percent);
  const weak = input.byTopic.filter((b) => b.percent < 60).sort((a, b) => a.percent - b.percent);
  const focus = weak.slice(0, 3);

  const parts: string[] = [];
  if (strong.length > 0) {
    parts.push(`Bugün ${joinTr(strong.slice(0, 2).map((s) => s.label))} sorularında güçlü bir sonuç aldın.`);
  } else if (input.scorePercent >= 60) {
    parts.push("Bugünkü çalışmanı dengeli bir sonuçla tamamladın.");
  } else {
    parts.push("Bugünkü çalışmanı tamamladın; bu, düzenli ilerlemenin en önemli adımı.");
  }
  if (focus.length > 0) {
    parts.push(
      `${strong.length > 0 ? "Ancak " : ""}${joinTr(focus.map((f) => f.label))} ${focus.length > 1 ? "konularında" : "konusunda"} tekrar yapman faydalı olacaktır.`,
    );
    parts.push(`Bir sonraki denemede ${focus.length > 1 ? "bu alanlara" : "bu alana"} biraz daha fazla ağırlık verilecek.`);
  } else {
    parts.push("Belirgin bir zayıf alan görünmüyor; bir sonraki denemede zor soruların oranı biraz artırılacak.");
  }
  if (input.previousScorePercent !== null) {
    const delta = Math.round((input.scorePercent - input.previousScorePercent) * 10) / 10;
    if (delta >= 5) parts.push(`Bir önceki denemeye göre başarı oranın ${delta} puan arttı.`);
    else if (delta <= -5) parts.push("Sonuç bir önceki denemenin biraz gerisinde; bu tür dalgalanmalar normaldir, istikrar daha önemli.");
  }

  const seen = new Set<string>();
  const vocabularyToReview: RecommendationOutput["vocabularyToReview"] = [];
  for (const w of input.wrongOrBlank) {
    for (const k of w.keywords) {
      const key = k.term.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      vocabularyToReview.push({ term: k.term, meaningTr: k.meaningTr });
    }
  }

  const reviewList = focus.map((f) => `${f.label}: konu özetini tekrar oku ve yanlış yaptığın soruların açıklamalarını incele.`);
  if (vocabularyToReview.length > 0) reviewList.push(`${vocabularyToReview.length} kelimeyi kelime tekrarında çalış.`);
  if (reviewList.length === 0) reviewList.push("Bugünkü soruların açıklamalarına kısaca göz at ve kelime tekrarını tamamla.");

  const wrongCount = input.wrongOrBlank.length;
  const extraQuestionCount = Math.min(20, Math.max(5, Math.ceil(wrongCount * 1.5 / 5) * 5));

  const target = Math.min(100, Math.round((Math.max(input.scorePercent, input.previousScorePercent ?? 0) + 5) / 5) * 5);
  const nextGoal =
    focus.length > 0
      ? `Bir sonraki denemede ${focus[0]!.label} sorularında en az bir doğru daha yapmak ve genel başarıyı %${target} civarına taşımak.`
      : `Genel başarıyı %${target} civarında tutarken zor sorulardaki doğru sayısını artırmak.`;

  return {
    message: parts.join(" "),
    focusTopics: focus.map((f) => ({ topicId: f.key, name: f.label, percent: f.percent })),
    strongTopics: strong.slice(0, 3).map((s) => ({ topicId: s.key, name: s.label, percent: s.percent })),
    reviewList,
    vocabularyToReview: vocabularyToReview.slice(0, 15),
    extraQuestionCount,
    nextGoal,
  };
}

/** Yanlış veya boş cevaplar için yargılamayan olası neden açıklaması. */
export function personalFeedback(params: {
  outcome: "correct" | "wrong" | "blank";
  type: QuestionTypeKey;
  timeSpentSeconds: number;
  averageSecondsPerQuestion: number;
}): string {
  const { outcome, type, timeSpentSeconds, averageSecondsPerQuestion } = params;
  if (outcome === "correct") {
    return timeSpentSeconds > averageSecondsPerQuestion * 1.8
      ? "Doğru cevapladın. Bu soruda biraz uzun süre harcadın; aşağıdaki strateji bir sonraki sefer daha hızlı karar vermene yardımcı olabilir."
      : "Doğru cevapladın. Çözüm yolunu pekiştirmek için açıklamaya kısaca göz atabilirsin.";
  }
  if (outcome === "blank") {
    return "Bu soruyu boş bıraktın. Bu durum süre yönetiminden ya da iki seçenek arasında kalmaktan kaynaklanmış olabilir. Aşağıdaki strateji, benzer sorularda daha hızlı eleme yapmana yardımcı olabilir.";
  }
  if (timeSpentSeconds > 0 && timeSpentSeconds < Math.min(25, averageSecondsPerQuestion * 0.4)) {
    return "Bu soruyu oldukça hızlı cevapladın; hata bir dikkat anından kaynaklanmış olabilir. Seçenekleri işaretlemeden önce kısa bir kontrol yapmak işe yarayabilir.";
  }
  if (type === "VOCABULARY" || type === "TRANSLATION_EN_TR" || type === "TRANSLATION_TR_EN") {
    return "Bu hata büyük olasılıkla bazı kelimelerin anlamından kaynaklanıyor. Aşağıdaki önemli kelimeler kelime listene eklendi; tekrarlarda yeniden karşılaşacaksın.";
  }
  if (timeSpentSeconds > averageSecondsPerQuestion * 2) {
    return "Bu soruda uzun süre harcadın; süre baskısı kararını etkilemiş olabilir. Aşağıdaki strateji daha hızlı eleme yapmana yardımcı olabilir.";
  }
  return "Bu konu biraz daha tekrar istiyor. Açıklamayı ve stratejiyi inceledikten sonra bir sonraki çalışmada bu konuyla yeniden karşılaşacaksın.";
}
