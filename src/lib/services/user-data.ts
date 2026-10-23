import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";

/** Kullanıcının kendi verilerini dışa aktarır (parola özeti ve oturumlar hariç). */
export async function exportUserData(userId: string) {
  const [profile, attempts, performances, vocabulary, reviews, recommendations, streak] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      select: { displayName: true, onboardingCompletedAt: true, placementCompletedAt: true, estimatedLevel: true, recommendedDailyMinutes: true, startingPlan: true },
    }),
    prisma.examAttempt.findMany({
      where: { userId, deletedAt: null },
      include: {
        exam: { select: { kind: true, title: true, studyDate: true } },
        answers: { select: { questionId: true, selectedLabel: true, isCorrect: true, isFlagged: true, timeSpentSeconds: true } },
      },
      orderBy: { startedAt: "asc" },
    }),
    prisma.topicPerformance.findMany({ where: { userId, deletedAt: null }, include: { topic: { select: { name: true } } } }),
    prisma.vocabularyItem.findMany({ where: { userId, deletedAt: null } }),
    prisma.vocabularyReview.findMany({ where: { userId } }),
    prisma.dailyRecommendation.findMany({ where: { userId, deletedAt: null } }),
    prisma.studyStreak.findUnique({ where: { userId } }),
  ]);
  return { exportedAt: new Date().toISOString(), profile, attempts, performances, vocabulary, reviews, recommendations, streak };
}

/**
 * "Verilerimi sil": çalışma verileri soft delete ile gizlenir ve profil sıfırlanır.
 * Kalıcı silme, 30 gün sonra yönetici tarafından `npm run data:purge` ile yapılır.
 * Bu sayede yanlışlıkla yapılan bir silme işlemi geri alınabilir.
 */
export async function softDeleteUserData(userId: string) {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    // Günlük deneme benzersizlik kuralı (kullanıcı + gün + tür) yeni deneme oluşturmayı engellemesin diye
    // silinen denemelerin tarih anahtarı işaretlenir.
    const exams = await tx.exam.findMany({ where: { userId, deletedAt: null }, select: { id: true, studyDate: true } });
    for (const e of exams) {
      await tx.exam.update({ where: { id: e.id }, data: { deletedAt: now, studyDate: `${e.studyDate}~silindi~${now.getTime()}` } });
    }
    await tx.examAttempt.updateMany({ where: { userId, deletedAt: null }, data: { deletedAt: now } });
    await tx.topicPerformance.updateMany({ where: { userId, deletedAt: null }, data: { deletedAt: now } });
    await tx.vocabularyItem.updateMany({ where: { userId, deletedAt: null }, data: { deletedAt: now } });
    await tx.dailyRecommendation.updateMany({ where: { userId, deletedAt: null }, data: { deletedAt: now } });
    await tx.studyStreak.updateMany({ where: { userId }, data: { currentStreak: 0, longestStreak: 0, lastStudyDate: null, totalStudyDays: 0 } });
    await tx.profile.updateMany({
      where: { userId },
      data: { placementCompletedAt: null, estimatedLevel: null, recommendedDailyMinutes: null, startingPlan: Prisma.DbNull },
    });
  });
}
