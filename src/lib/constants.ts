// Prisma enum'larıyla birebir aynı değerler. Saf (veritabanından bağımsız) modüller
// ve testler bu sabitleri kullanır.

export const QUESTION_TYPES = [
  "VOCABULARY",
  "GRAMMAR",
  "SENTENCE_COMPLETION",
  "TRANSLATION_EN_TR",
  "TRANSLATION_TR_EN",
  "READING",
  "COHERENCE",
  "DIALOGUE",
  "PARAPHRASE",
  "MISSING_SENTENCE",
  "IRRELEVANT_SENTENCE",
] as const;
export type QuestionTypeKey = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionTypeKey, string> = {
  VOCABULARY: "Kelime Bilgisi",
  GRAMMAR: "Dil Bilgisi",
  SENTENCE_COMPLETION: "Cümle Tamamlama",
  TRANSLATION_EN_TR: "İngilizce-Türkçe Çeviri",
  TRANSLATION_TR_EN: "Türkçe-İngilizce Çeviri",
  READING: "Paragraf Anlama",
  COHERENCE: "Anlam Bütünlüğü",
  DIALOGUE: "Diyalog Tamamlama",
  PARAPHRASE: "Yakın Anlamlı Cümle",
  MISSING_SENTENCE: "Paragrafta Eksik Cümle",
  IRRELEVANT_SENTENCE: "İlgisiz Cümleyi Bulma",
};

export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export type DifficultyKey = (typeof DIFFICULTIES)[number];
export const DIFFICULTY_LABELS: Record<DifficultyKey, string> = {
  EASY: "Kolay",
  MEDIUM: "Orta",
  HARD: "Zor",
};

export const OPTION_LABELS = ["A", "B", "C", "D", "E"] as const;
export type OptionLabel = (typeof OPTION_LABELS)[number];

export const EXAM_KINDS = ["PLACEMENT", "QUICK", "DAILY", "INTENSIVE", "FULL"] as const;
export type ExamKindKey = (typeof EXAM_KINDS)[number];
export const EXAM_KIND_LABELS: Record<ExamKindKey, string> = {
  PLACEMENT: "Seviye Belirleme",
  QUICK: "Hızlı Çalışma",
  DAILY: "Günlük Deneme",
  INTENSIVE: "Yoğun Çalışma",
  FULL: "Tam Prova",
};

export const QUALITY_STATUSES = ["PENDING_REVIEW", "APPROVED", "REJECTED", "DISABLED"] as const;
export type QualityStatusKey = (typeof QUALITY_STATUSES)[number];
export const QUALITY_STATUS_LABELS: Record<QualityStatusKey, string> = {
  PENDING_REVIEW: "İnceleme bekliyor",
  APPROVED: "Yayında",
  REJECTED: "Reddedildi",
  DISABLED: "Devre dışı",
};

export const VOCAB_STATUSES = ["NEW", "LEARNING", "REVIEW", "LEARNED"] as const;
export type VocabStatusKey = (typeof VOCAB_STATUSES)[number];
export const VOCAB_STATUS_LABELS: Record<VocabStatusKey, string> = {
  NEW: "Yeni",
  LEARNING: "Öğreniliyor",
  REVIEW: "Tekrar edilmeli",
  LEARNED: "Öğrenildi",
};

export const ROLES = ["USER", "ADMIN"] as const;
export type RoleKey = (typeof ROLES)[number];

/** YDS'deki genel ağırlığa yakın varsayılan soru tipi ağırlıkları (yönetici panelinden değiştirilebilir). */
export const DEFAULT_TYPE_WEIGHTS: Record<QuestionTypeKey, number> = {
  VOCABULARY: 2,
  GRAMMAR: 3,
  SENTENCE_COMPLETION: 2,
  TRANSLATION_EN_TR: 1.5,
  TRANSLATION_TR_EN: 1.5,
  READING: 3,
  COHERENCE: 1,
  DIALOGUE: 1.5,
  PARAPHRASE: 1.5,
  MISSING_SENTENCE: 1.5,
  IRRELEVANT_SENTENCE: 1.5,
};

export const APP_TIMEZONE = "Europe/Istanbul";
export const LEARNER_DISPLAY_NAME = "Yaren";
