import "server-only";
import { prisma } from "../db";
import { asJson } from "../json";
import { aiVerifyWithSolver, getAiProvider } from "../ai";
import { generateQuestions, type GenerationOutcome, type GenerationStore } from "../ai/question-generation";
import type { DifficultyKey, QuestionTypeKey } from "../constants";
import { existingSignatures, saveQuestion } from "./questions-admin";
import { getSettings } from "./settings";

function prismaGenerationStore(createdById: string | null): GenerationStore {
  return {
    existingSignatures: () => existingSignatures(),
    async createQuestion(draft, meta) {
      const res = await saveQuestion(draft, { status: meta.status, source: "AI", aiLogId: meta.logId });
      if (!res.ok) throw new Error(res.error);
    },
    async createLog(entry) {
      const log = await prisma.aiGenerationLog.create({
        data: {
          task: "QUESTION_GENERATION",
          provider: entry.provider,
          model: entry.model,
          status: entry.status,
          requestSummary: entry.requestSummary,
          rawResponse: entry.rawResponse,
          errorMessage: entry.errorMessage,
          itemsAccepted: entry.itemsAccepted,
          itemsRejected: entry.itemsRejected,
          rejectionNotes: asJson(entry.rejectionNotes),
          createdById,
        },
        select: { id: true },
      });
      return log.id;
    },
    async updateLogCounts(logId, accepted, rejected, notes, status) {
      await prisma.aiGenerationLog.update({
        where: { id: logId },
        data: { itemsAccepted: accepted, itemsRejected: rejected, rejectionNotes: asJson(notes), status },
      });
    },
  };
}

/** Yapay zekâ ile soru üretir. Servis kapalıysa veya ulaşılamıyorsa uygulama çökmez; açıklayıcı bir sonuç döner. */
export async function runQuestionGeneration(
  params: { type: QuestionTypeKey; topicSlug: string; difficulty: DifficultyKey; count: number },
  createdById: string | null,
): Promise<GenerationOutcome | { status: "DISABLED"; accepted: 0; rejected: 0; message: string }> {
  const settings = await getSettings();
  const provider = settings.aiEnabled ? getAiProvider() : null;
  if (!provider) {
    await prisma.aiGenerationLog.create({
      data: {
        task: "QUESTION_GENERATION",
        provider: "none",
        model: "none",
        status: "DISABLED",
        requestSummary: `${params.type} / ${params.topicSlug}`,
        createdById,
      },
    });
    return { status: "DISABLED", accepted: 0, rejected: 0, message: "Yapay zekâ servisi yapılandırılmamış veya kapalı. Mevcut soru havuzu kullanılmaya devam ediyor." };
  }
  const topic = await prisma.topic.findUnique({ where: { slug: params.topicSlug } });
  if (!topic || topic.questionType !== params.type) {
    return { status: "INVALID_OUTPUT", accepted: 0, rejected: 0, message: "Konu ve soru tipi uyuşmuyor." };
  }
  return generateQuestions(
    { provider, store: prismaGenerationStore(createdById), autoPublish: settings.aiAutoPublish, verifyWithSolver: aiVerifyWithSolver() },
    { ...params, topicName: topic.name },
  );
}
