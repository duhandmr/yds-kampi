import "server-only";
import type { CampSettings } from "@prisma/client";
import { prisma } from "../db";
import { DEFAULT_TYPE_WEIGHTS, QUESTION_TYPES, type ExamKindKey, type QuestionTypeKey } from "../constants";
import { toDateKey } from "../dates";
import { asJson } from "../json";

export async function getSettings(): Promise<CampSettings> {
  const existing = await prisma.campSettings.findUnique({ where: { id: "default" } });
  if (existing) return existing;
  return prisma.campSettings.upsert({
    where: { id: "default" },
    create: { id: "default", campStartDate: toDateKey(new Date()), topicWeights: asJson(DEFAULT_TYPE_WEIGHTS) },
    update: {},
  });
}

export function readTypeWeights(settings: Pick<CampSettings, "topicWeights">): Record<QuestionTypeKey, number> {
  const raw = (settings.topicWeights ?? {}) as Record<string, unknown>;
  const out = { ...DEFAULT_TYPE_WEIGHTS };
  for (const t of QUESTION_TYPES) {
    const v = Number(raw[t]);
    if (Number.isFinite(v) && v >= 0 && v <= 10) out[t] = v;
  }
  return out;
}

export function examConfig(settings: CampSettings, kind: ExamKindKey): { count: number; durationSeconds: number } {
  switch (kind) {
    case "PLACEMENT":
      return { count: settings.placementQuestionCount, durationSeconds: settings.placementDurationMinutes * 60 };
    case "QUICK":
      return { count: settings.quickQuestionCount, durationSeconds: settings.quickDurationMinutes * 60 };
    case "INTENSIVE":
      return { count: settings.intensiveQuestionCount, durationSeconds: settings.intensiveDurationMinutes * 60 };
    case "FULL":
      return { count: settings.fullMockQuestionCount, durationSeconds: settings.fullMockDurationMinutes * 60 };
    case "DAILY":
    default:
      return { count: settings.dailyQuestionCount, durationSeconds: settings.dailyDurationMinutes * 60 };
  }
}
