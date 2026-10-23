import type { DifficultyKey, QuestionTypeKey } from "../constants";
import type { QuestionDraft } from "../questions/types";
import { runQualityChecks, type ExistingSignature, type QualityReport } from "../questions/quality";
import { questionSignatureText } from "../questions/similarity";
import { parseAiJson } from "./parse";
import { QUESTION_SYSTEM_PROMPT, SOLVER_SYSTEM_PROMPT, buildQuestionPrompt, buildSolverPrompt } from "./prompts";
import { generatedQuestionBatchSchema, solverAnswerSchema } from "./schemas";
import type { AiProvider } from "./types";

export interface GenerationStore {
  existingSignatures(): Promise<ExistingSignature[]>;
  createQuestion(draft: QuestionDraft, meta: { status: "APPROVED" | "PENDING_REVIEW"; report: QualityReport; logId: string }): Promise<void>;
  createLog(entry: {
    status: "SUCCESS" | "PARTIAL" | "INVALID_OUTPUT" | "PROVIDER_ERROR";
    provider: string;
    model: string;
    requestSummary: string;
    rawResponse: string | null;
    errorMessage: string | null;
    itemsAccepted: number;
    itemsRejected: number;
    rejectionNotes: Array<{ index: number; reasons: string[] }>;
  }): Promise<string>;
  updateLogCounts(logId: string, accepted: number, rejected: number, notes: Array<{ index: number; reasons: string[] }>, status: "SUCCESS" | "PARTIAL"): Promise<void>;
}

export interface GenerationRequest {
  type: QuestionTypeKey;
  topicSlug: string;
  topicName: string;
  difficulty: DifficultyKey;
  count: number;
}

export interface GenerationOutcome {
  status: "SUCCESS" | "PARTIAL" | "INVALID_OUTPUT" | "PROVIDER_ERROR";
  accepted: number;
  rejected: number;
  message: string;
}

const RAW_LIMIT = 20_000;

/**
 * Soru üretim hattı:
 * 1) Sağlayıcı çağrısı (hata → log, kayıt yok)
 * 2) JSON + şema doğrulaması (geçersiz → log, KAYIT OLUŞTURULMAZ)
 * 3) Her soru için otomatik kalite kontrolü (tek doğru, açıklama-anahtar tutarlılığı, benzerlik)
 * 4) İsteğe bağlı "kör çözüm" doğrulaması: model anahtarı görmeden çözer; farklı cevap veya belirsizlik → red
 * 5) Kabul edilenler PENDING_REVIEW (veya ayara göre APPROVED) olarak kaydedilir.
 */
export async function generateQuestions(
  deps: { provider: AiProvider; store: GenerationStore; autoPublish: boolean; verifyWithSolver: boolean },
  req: GenerationRequest,
): Promise<GenerationOutcome> {
  const { provider, store } = deps;
  const existing = await store.existingSignatures();
  const requestSummary = `${req.type} / ${req.topicSlug} / ${req.difficulty} / ${req.count} soru`;

  let raw: string;
  try {
    raw = await provider.generateJson({
      system: QUESTION_SYSTEM_PROMPT,
      user: buildQuestionPrompt({
        type: req.type,
        topicName: req.topicName,
        difficulty: req.difficulty,
        count: req.count,
        avoidStems: existing.slice(-25).map((e) => e.text),
      }),
      maxTokens: 6000,
      temperature: 0.8,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen sağlayıcı hatası";
    await store.createLog({
      status: "PROVIDER_ERROR",
      provider: provider.name,
      model: provider.model,
      requestSummary,
      rawResponse: null,
      errorMessage: message.slice(0, 500),
      itemsAccepted: 0,
      itemsRejected: 0,
      rejectionNotes: [],
    });
    return { status: "PROVIDER_ERROR", accepted: 0, rejected: 0, message: "Yapay zekâ servisine şu anda ulaşılamıyor. Mevcut soru havuzu kullanılmaya devam edecek." };
  }

  const parsed = parseAiJson(raw, generatedQuestionBatchSchema);
  if (!parsed.ok) {
    await store.createLog({
      status: "INVALID_OUTPUT",
      provider: provider.name,
      model: provider.model,
      requestSummary,
      rawResponse: raw.slice(0, RAW_LIMIT),
      errorMessage: parsed.error.slice(0, 1000),
      itemsAccepted: 0,
      itemsRejected: 0,
      rejectionNotes: [],
    });
    return { status: "INVALID_OUTPUT", accepted: 0, rejected: 0, message: "Yapay zekâ çıktısı doğrulamadan geçemedi; hiçbir soru kaydedilmedi." };
  }

  const logId = await store.createLog({
    status: "SUCCESS",
    provider: provider.name,
    model: provider.model,
    requestSummary,
    rawResponse: raw.slice(0, RAW_LIMIT),
    errorMessage: null,
    itemsAccepted: 0,
    itemsRejected: 0,
    rejectionNotes: [],
  });

  let accepted = 0;
  const notes: Array<{ index: number; reasons: string[] }> = [];
  const known: ExistingSignature[] = [...existing];

  for (const [index, item] of parsed.data.questions.entries()) {
    const draft: QuestionDraft = {
      ...item,
      type: req.type,
      topicSlug: req.topicSlug,
      passage: item.passage ?? null,
      keywords: item.keywords,
    };
    const report = runQualityChecks(draft, known);
    if (!report.passed) {
      notes.push({ index, reasons: report.issues.map((i) => i.message) });
      continue;
    }
    if (deps.verifyWithSolver) {
      const verdict = await solveBlind(provider, draft);
      if (!verdict.ok) {
        notes.push({ index, reasons: [verdict.reason] });
        continue;
      }
    }
    try {
      await store.createQuestion(draft, { status: deps.autoPublish ? "APPROVED" : "PENDING_REVIEW", report, logId });
    } catch (error) {
      // Ör. reddedilmiş/devre dışı bir soruyla aynı içerik (benzersizlik kuralı): yalnızca bu soru reddedilir.
      notes.push({ index, reasons: [error instanceof Error ? error.message.slice(0, 200) : "Soru kaydedilemedi."] });
      continue;
    }
    known.push({ id: `new-${index}`, text: questionSignatureText(draft) });
    accepted += 1;
  }

  const rejected = parsed.data.questions.length - accepted;
  const status = rejected === 0 ? "SUCCESS" : "PARTIAL";
  await store.updateLogCounts(logId, accepted, rejected, notes, status);
  return {
    status,
    accepted,
    rejected,
    message: `${accepted} soru kalite kontrolünden geçti${deps.autoPublish ? " ve yayımlandı" : " ve incelemeye alındı"}; ${rejected} soru reddedildi.`,
  };
}

async function solveBlind(provider: AiProvider, draft: QuestionDraft): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const raw = await provider.generateJson({ system: SOLVER_SYSTEM_PROMPT, user: buildSolverPrompt(draft), maxTokens: 400, temperature: 0 });
    const parsed = parseAiJson(raw, solverAnswerSchema);
    if (!parsed.ok) return { ok: false, reason: "Bağımsız çözüm doğrulaması geçersiz çıktı verdi." };
    if (parsed.data.ambiguous) return { ok: false, reason: "Bağımsız çözümde soru belirsiz bulundu." };
    if (parsed.data.answer !== draft.correctLabel) {
      return { ok: false, reason: `Bağımsız çözüm ${parsed.data.answer} buldu; anahtar ${draft.correctLabel}.` };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "Bağımsız çözüm doğrulaması yapılamadı." };
  }
}
