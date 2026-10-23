import { z } from "zod";
import { DIFFICULTIES, EXAM_KINDS, OPTION_LABELS, QUALITY_STATUSES, QUESTION_TYPES } from "../constants";
import { isValidDateKey } from "../dates";

export const optionLabelSchema = z.enum(OPTION_LABELS);
export const questionTypeSchema = z.enum(QUESTION_TYPES);
export const difficultySchema = z.enum(DIFFICULTIES);
export const qualityStatusSchema = z.enum(QUALITY_STATUSES);
export const idSchema = z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/);
export const dateKeySchema = z.string().refine(isValidDateKey, "Geçerli bir tarih girin (YYYY-AA-GG).");

export const loginSchema = z.object({
  username: z.string().trim().min(3, "Kullanıcı adı en az 3 karakter olmalı.").max(40),
  password: z.string().min(1, "Parola gerekli.").max(200),
  next: z.string().max(200).optional(),
});

export const passwordSchema = z
  .string()
  .min(12, "Parola en az 12 karakter olmalı.")
  .max(200)
  .refine((v) => /[a-zçğıöşü]/.test(v) && /[A-ZÇĞİÖŞÜ]/.test(v) && /\d/.test(v), "Parola büyük harf, küçük harf ve rakam içermeli.");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: "Yeni parolalar eşleşmiyor.", path: ["confirmPassword"] });

export const examKindSchema = z.enum(EXAM_KINDS);
export const studyKindSchema = z.enum(["QUICK", "DAILY", "INTENSIVE", "FULL"]);

export const saveAnswerSchema = z.object({
  attemptId: idSchema,
  questionId: idSchema,
  selectedLabel: optionLabelSchema.nullable(),
  flagged: z.boolean(),
  timeSpentSeconds: z.number().int().min(0).max(6 * 3600),
});

export const finishAttemptSchema = z.object({ attemptId: idSchema });

export const vocabularyReviewSchema = z.object({
  itemId: idSchema,
  grade: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
});

export const keywordSchema = z.object({
  term: z.string().trim().min(1).max(80),
  meaningTr: z.string().trim().min(1).max(200),
  partOfSpeech: z.string().trim().min(1).max(40),
  exampleEn: z.string().trim().max(400).optional(),
  exampleTr: z.string().trim().max(400).optional(),
  synonyms: z.array(z.string().trim().min(1).max(60)).max(8).optional(),
  antonyms: z.array(z.string().trim().min(1).max(60)).max(8).optional(),
});

export const questionOptionSchema = z.object({
  label: optionLabelSchema,
  text: z.string().trim().min(1, "Seçenek metni gerekli.").max(1200),
  rationale: z.string().trim().min(8, "Her seçenek için gerekçe yazın.").max(1500),
});

export const questionDraftSchema = z.object({
  type: questionTypeSchema,
  topicSlug: z.string().trim().min(1).max(80),
  subtopic: z.string().trim().min(1).max(120),
  difficulty: difficultySchema,
  passage: z.string().trim().max(6000).nullable().optional(),
  stem: z.string().trim().min(10).max(3000),
  options: z.array(questionOptionSchema).length(5),
  correctLabel: optionLabelSchema,
  explanation: z.string().trim().min(30).max(4000),
  strategy: z.string().trim().min(10).max(2000),
  tip: z.string().trim().min(5).max(1000),
  keywords: z.array(keywordSchema).min(1).max(8),
});

export const adminQuestionFormSchema = questionDraftSchema.extend({
  id: idSchema.optional(),
  status: qualityStatusSchema,
});

const weightsShape = Object.fromEntries(QUESTION_TYPES.map((t) => [t, z.coerce.number().min(0).max(10)])) as Record<
  (typeof QUESTION_TYPES)[number],
  z.ZodCoercedNumber
>;

export const topicWeightsSchema = z.object(weightsShape);

export const settingsSchema = z
  .object({
    campStartDate: dateKeySchema,
    examDate: z.union([dateKeySchema, z.literal("")]),
    dailyQuestionCount: z.coerce.number().int().min(5).max(80),
    dailyDurationMinutes: z.coerce.number().int().min(5).max(240),
    quickQuestionCount: z.coerce.number().int().min(5).max(40),
    quickDurationMinutes: z.coerce.number().int().min(5).max(120),
    intensiveQuestionCount: z.coerce.number().int().min(10).max(80),
    intensiveDurationMinutes: z.coerce.number().int().min(10).max(240),
    fullMockEnabled: z.boolean(),
    fullMockQuestionCount: z.coerce.number().int().min(20).max(120),
    fullMockDurationMinutes: z.coerce.number().int().min(30).max(240),
    placementQuestionCount: z.coerce.number().int().min(11).max(44),
    placementDurationMinutes: z.coerce.number().int().min(10).max(90),
    aiEnabled: z.boolean(),
    aiAutoPublish: z.boolean(),
    topicWeights: topicWeightsSchema,
  })
  .refine((v) => !v.examDate || v.examDate > v.campStartDate, { message: "Sınav tarihi kamp başlangıcından sonra olmalı.", path: ["examDate"] });

export const generationRequestSchema = z.object({
  type: questionTypeSchema,
  topicSlug: z.string().trim().min(1).max(80),
  difficulty: difficultySchema,
  count: z.coerce.number().int().min(1).max(10),
});

export const exportQuerySchema = z.object({
  dataset: z.enum(["questions", "attempts", "performance", "vocabulary"]),
  format: z.enum(["json", "csv"]),
});

export const deleteMyDataSchema = z.object({
  confirmation: z.literal("SİL", { message: "Onay için büyük harflerle SİL yazın." }),
});

export function firstIssue(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Geçersiz giriş.";
}

export function fieldErrors(error: { issues: Array<{ message: string; path: PropertyKey[] }> }): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of error.issues) {
    const key = i.path.map(String).join(".") || "_";
    if (!out[key]) out[key] = i.message;
  }
  return out;
}
