"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { QUESTION_TYPES, OPTION_LABELS } from "@/lib/constants";
import { asJson } from "@/lib/json";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";
import { saveQuestion, setQuestionStatus } from "@/lib/services/questions-admin";
import { runQuestionGeneration } from "@/lib/services/generation";
import { enrichVocabulary } from "@/lib/services/ai-enhancements";
import { adminQuestionFormSchema, fieldErrors, generationRequestSchema, idSchema, qualityStatusSchema, settingsSchema } from "@/lib/validation/schemas";

export interface AdminFormState {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  issues?: string[];
}

function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Soru formunu ayrıştırır. Anahtar kelimeler satır başına "terim | anlam | tür | örnek EN | örnek TR | eş1, eş2 | zıt1, zıt2" biçimindedir. */
function parseQuestionForm(formData: FormData) {
  const keywords = text(formData, "keywords")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [term = "", meaningTr = "", partOfSpeech = "", exampleEn = "", exampleTr = "", synonyms = "", antonyms = ""] = line.split("|").map((p) => p.trim());
      return {
        term,
        meaningTr,
        partOfSpeech,
        ...(exampleEn ? { exampleEn } : {}),
        ...(exampleTr ? { exampleTr } : {}),
        synonyms: splitList(synonyms),
        antonyms: splitList(antonyms),
      };
    });
  return {
    id: text(formData, "id") || undefined,
    status: text(formData, "status"),
    type: text(formData, "type"),
    topicSlug: text(formData, "topicSlug"),
    subtopic: text(formData, "subtopic"),
    difficulty: text(formData, "difficulty"),
    passage: text(formData, "passage").trim() || null,
    stem: text(formData, "stem"),
    options: OPTION_LABELS.map((label) => ({ label, text: text(formData, `option${label}`), rationale: text(formData, `rationale${label}`) })),
    correctLabel: text(formData, "correctLabel"),
    explanation: text(formData, "explanation"),
    strategy: text(formData, "strategy"),
    tip: text(formData, "tip"),
    keywords,
  };
}

export async function saveQuestionAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = adminQuestionFormSchema.safeParse(parseQuestionForm(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Formda düzeltilmesi gereken alanlar var." };
  const { id, status, ...draft } = parsed.data;
  const res = await saveQuestion(draft, { id, status, source: "ADMIN" });
  if (!res.ok) return { message: res.error, issues: res.report?.issues.map((i) => i.message) };
  revalidatePath("/yonetim/sorular");
  if (!id) redirect(`/yonetim/sorular/${res.id}?kaydedildi=1`);
  return {
    ok: true,
    message: res.report.passed ? "Soru kaydedildi ve kalite kontrolünden geçti." : "Soru kaydedildi; ancak kalite kontrolü uyarıları var, bu nedenle yayımlanamaz.",
    issues: res.report.issues.map((i) => i.message),
  };
}

export async function setQuestionStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  const status = qualityStatusSchema.safeParse(formData.get("status"));
  const back = text(formData, "back");
  if (!id.success || !status.success) redirect("/yonetim/sorular?hata=gecersiz");
  const res = await setQuestionStatus(id.data, status.data);
  revalidatePath("/yonetim/sorular");
  revalidatePath("/yonetim/uretim");
  const target = back.startsWith("/yonetim") ? back : "/yonetim/sorular";
  const sep = target.includes("?") ? "&" : "?";
  redirect(res.ok ? `${target}${sep}durum=guncellendi` : `${target}${sep}hata=kalite`);
}

export async function saveSettingsAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const topicWeights = Object.fromEntries(QUESTION_TYPES.map((t) => [t, text(formData, `weight_${t}`)]));
  const parsed = settingsSchema.safeParse({
    campStartDate: text(formData, "campStartDate"),
    examDate: text(formData, "examDate"),
    dailyQuestionCount: text(formData, "dailyQuestionCount"),
    dailyDurationMinutes: text(formData, "dailyDurationMinutes"),
    quickQuestionCount: text(formData, "quickQuestionCount"),
    quickDurationMinutes: text(formData, "quickDurationMinutes"),
    intensiveQuestionCount: text(formData, "intensiveQuestionCount"),
    intensiveDurationMinutes: text(formData, "intensiveDurationMinutes"),
    fullMockEnabled: formData.get("fullMockEnabled") === "on",
    fullMockQuestionCount: text(formData, "fullMockQuestionCount"),
    fullMockDurationMinutes: text(formData, "fullMockDurationMinutes"),
    placementQuestionCount: text(formData, "placementQuestionCount"),
    placementDurationMinutes: text(formData, "placementDurationMinutes"),
    aiEnabled: formData.get("aiEnabled") === "on",
    aiAutoPublish: formData.get("aiAutoPublish") === "on",
    topicWeights,
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Ayarlar kaydedilemedi; işaretli alanları kontrol edin." };
  const { examDate, topicWeights: weights, ...rest } = parsed.data;
  await prisma.campSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...rest, examDate: examDate || null, topicWeights: asJson(weights) },
    update: { ...rest, examDate: examDate || null, topicWeights: asJson(weights) },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Ayarlar kaydedildi. Yeni ayarlar bir sonraki oluşturulan denemede geçerli olur." };
}

export async function generateQuestionsAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await requireAdmin();
  const parsed = generationRequestSchema.safeParse({
    type: formData.get("type"),
    topicSlug: formData.get("topicSlug"),
    difficulty: formData.get("difficulty"),
    count: formData.get("count"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Üretim isteği geçersiz." };
  try {
    await enforceRateLimit(`ai:generate:${admin.id}`, 10, 60 * 60_000);
  } catch (error) {
    if (error instanceof RateLimitError) return { message: error.message };
    throw error;
  }
  const result = await runQuestionGeneration(parsed.data, admin.id);
  revalidatePath("/yonetim/uretim");
  return { ok: result.status === "SUCCESS" || result.status === "PARTIAL", message: result.message };
}

export async function enrichVocabularyAction(_prev: AdminFormState): Promise<AdminFormState> {
  await requireAdmin();
  const res = await enrichVocabulary(15);
  return { ok: res.updated > 0, message: res.message };
}
