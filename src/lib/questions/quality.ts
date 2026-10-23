import { OPTION_LABELS, type QuestionTypeKey } from "../constants";
import type { QuestionDraft } from "./types";
import { NEAR_DUPLICATE_THRESHOLD, normalizeText, questionSignatureText, shingles, jaccard } from "./similarity";

export interface QualityIssue {
  code: string;
  message: string;
}

export interface QualityReport {
  passed: boolean;
  issues: QualityIssue[];
  checkedAt: string;
  maxSimilarity: number;
}

export interface ExistingSignature {
  id: string;
  text: string;
}

const PLACEHOLDER_PATTERNS = [/lorem ipsum/i, /\bTODO\b/, /\[.*?(ekle|add|placeholder).*?\]/i, /\bXXX\b/, /buraya/i];

const BLANK_REQUIRED: QuestionTypeKey[] = ["VOCABULARY", "GRAMMAR", "SENTENCE_COMPLETION", "DIALOGUE", "MISSING_SENTENCE", "COHERENCE"];
const PASSAGE_REQUIRED: QuestionTypeKey[] = ["READING", "MISSING_SENTENCE", "IRRELEVANT_SENTENCE", "COHERENCE", "DIALOGUE"];

const CORRECT_CLAIM = /do(?:ğ|g)ru\s+(?:cevap|se(?:ç|c)enek|yan[ıi]t)\s*[:\-–]?\s*\(?([A-E])\)?/giu;

/** Açıklamada "Doğru cevap X" ifadeleriyle iddia edilen tüm etiketleri döndürür. */
export function claimedCorrectLabels(text: string): string[] {
  const labels = new Set<string>();
  for (const m of text.matchAll(CORRECT_CLAIM)) if (m[1]) labels.add(m[1].toUpperCase());
  return [...labels];
}

/**
 * Otomatik kalite kontrolü. Yapay zekâ veya yönetici tarafından eklenen her soru
 * yayımlanmadan önce bu kontrolden geçmelidir.
 */
export function runQualityChecks(
  draft: QuestionDraft,
  existing: ExistingSignature[] = [],
  options: { selfId?: string; now?: Date } = {},
): QualityReport {
  const issues: QualityIssue[] = [];
  const add = (code: string, message: string) => issues.push({ code, message });

  // 1) Seçenek yapısı: tam olarak A-E, benzersiz metinler
  const labels = draft.options.map((o) => o.label);
  if (draft.options.length !== 5 || OPTION_LABELS.some((l) => !labels.includes(l))) {
    add("OPTIONS_SHAPE", "Soru tam olarak A, B, C, D ve E seçeneklerini içermelidir.");
  }
  const normTexts = draft.options.map((o) => normalizeText(o.text));
  if (new Set(normTexts).size !== normTexts.length) add("OPTIONS_DUPLICATE", "Seçenek metinleri birbirinden farklı olmalıdır.");
  if (draft.options.some((o) => o.text.trim().length === 0)) add("OPTION_EMPTY", "Boş seçenek bulunamaz.");

  // 2) Tek ve açık doğru cevap
  if (!OPTION_LABELS.includes(draft.correctLabel)) add("KEY_INVALID", "Doğru cevap A-E arasında olmalıdır.");
  if (!draft.options.some((o) => o.label === draft.correctLabel)) add("KEY_MISSING", "Doğru cevap seçeneklerde bulunmuyor.");

  // 3) Açıklama - cevap anahtarı tutarlılığı
  const claims = claimedCorrectLabels(draft.explanation);
  if (claims.length === 0) {
    add("EXPLANATION_NO_KEY", "Açıklama 'Doğru cevap X' ifadesiyle doğru seçeneği belirtmelidir.");
  } else if (claims.length > 1 || claims[0] !== draft.correctLabel) {
    add("EXPLANATION_KEY_MISMATCH", `Açıklamadaki doğru cevap (${claims.join(", ")}) cevap anahtarıyla (${draft.correctLabel}) uyuşmuyor.`);
  }
  for (const o of draft.options) {
    const r = o.rationale.trim();
    if (r.length < 8) add("RATIONALE_MISSING", `${o.label} seçeneği için gerekçe yazılmalıdır.`);
    const startsCorrect = /^do(?:ğ|g)ru(?!\p{L})/iu.test(r);
    const startsWrong = /^yanl[ıi][şs](?!\p{L})/iu.test(r);
    if (o.label === draft.correctLabel && startsWrong) add("RATIONALE_KEY_MISMATCH", `${o.label} doğru cevap olduğu hâlde gerekçesi 'Yanlış' diye başlıyor.`);
    if (o.label !== draft.correctLabel && startsCorrect) add("RATIONALE_KEY_MISMATCH", `${o.label} yanlış seçenek olduğu hâlde gerekçesi 'Doğru' diye başlıyor.`);
    const otherClaims = claimedCorrectLabels(r).filter((l) => l !== draft.correctLabel);
    if (otherClaims.length > 0) add("RATIONALE_KEY_MISMATCH", `${o.label} gerekçesi başka bir seçeneği doğru gösteriyor.`);
  }

  // 4) Biçim kuralları
  if (draft.stem.trim().length < 10) add("STEM_SHORT", "Soru kökü çok kısa.");
  if (BLANK_REQUIRED.includes(draft.type)) {
    const target = `${draft.passage ?? ""} ${draft.stem}`;
    if (!/-{3,}/.test(target)) add("BLANK_MISSING", "Bu soru tipinde boşluk '----' ile gösterilmelidir.");
  }
  if (PASSAGE_REQUIRED.includes(draft.type) && !draft.passage?.trim()) add("PASSAGE_MISSING", "Bu soru tipi bir paragraf/diyalog metni gerektirir.");
  if (draft.type === "IRRELEVANT_SENTENCE") {
    const p = draft.passage ?? "";
    if (!["(I)", "(II)", "(III)", "(IV)", "(V)"].every((m) => p.includes(m))) add("IRRELEVANT_MARKERS", "İlgisiz cümle sorusunda (I)-(V) numaralı beş cümle bulunmalıdır.");
  }
  const allText = [draft.passage ?? "", draft.stem, draft.explanation, ...draft.options.map((o) => `${o.text} ${o.rationale}`)].join(" ");
  if (PLACEHOLDER_PATTERNS.some((p) => p.test(allText))) add("PLACEHOLDER", "Metinde yer tutucu veya tamamlanmamış içerik var.");
  if (draft.explanation.trim().length < 30) add("EXPLANATION_SHORT", "Açıklama yeterince ayrıntılı değil.");
  if (draft.strategy.trim().length < 10) add("STRATEGY_MISSING", "Çözüm stratejisi eksik.");
  if (draft.keywords.length === 0) add("KEYWORDS_MISSING", "En az bir önemli kelime eklenmelidir.");

  // 5) Tekrar / benzerlik kontrolü
  const sig = shingles(questionSignatureText(draft));
  let maxSimilarity = 0;
  for (const e of existing) {
    if (options.selfId && e.id === options.selfId) continue;
    const s = jaccard(sig, shingles(e.text));
    if (s > maxSimilarity) maxSimilarity = s;
  }
  if (maxSimilarity >= NEAR_DUPLICATE_THRESHOLD) add("NEAR_DUPLICATE", "Soru, havuzdaki başka bir soruya çok benziyor.");

  return {
    passed: issues.length === 0,
    issues,
    checkedAt: (options.now ?? new Date()).toISOString(),
    maxSimilarity: Math.round(maxSimilarity * 100) / 100,
  };
}
