import "server-only";
import { prisma } from "../db";
import type { VocabStatusKey } from "../constants";
import { scheduleReview, type ReviewGrade } from "../vocabulary/srs";

export async function listVocabulary(userId: string, status?: VocabStatusKey) {
  return prisma.vocabularyItem.findMany({
    where: { userId, deletedAt: null, ...(status ? { status } : {}) },
    orderBy: [{ dueAt: "asc" }, { term: "asc" }],
    take: 300,
  });
}

export async function getDueVocabulary(userId: string, limit = 20) {
  return prisma.vocabularyItem.findMany({
    where: { userId, deletedAt: null, dueAt: { lte: new Date() }, status: { not: "LEARNED" } },
    orderBy: { dueAt: "asc" },
    take: limit,
  });
}

export async function reviewVocabulary(userId: string, itemId: string, grade: ReviewGrade) {
  const item = await prisma.vocabularyItem.findFirst({ where: { id: itemId, userId, deletedAt: null } });
  if (!item) return { ok: false as const };
  const now = new Date();
  const next = scheduleReview(item, grade, now);
  await prisma.$transaction([
    prisma.vocabularyItem.update({ where: { id: item.id }, data: { ...next, lastSeenAt: now } }),
    prisma.vocabularyReview.create({
      data: { vocabularyItemId: item.id, userId, grade, previousInterval: item.intervalDays, newInterval: next.intervalDays },
    }),
  ]);
  return { ok: true as const, status: next.status, intervalDays: next.intervalDays };
}
