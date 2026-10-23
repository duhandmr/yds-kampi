/**
 * Soft delete ile işaretlenmiş ve 30 günden eski çalışma verilerini kalıcı olarak siler.
 * Yanlışlıkla çalıştırılmaması için --onayla bayrağı zorunludur.
 *
 *   npm run data:purge -- --onayla
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const RETENTION_DAYS = 30;

async function main() {
  if (!process.argv.includes("--onayla")) {
    console.info("Kuru çalıştırma. Kalıcı silme için --onayla bayrağını ekleyin.");
  }
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000);
  const attempts = await prisma.examAttempt.findMany({ where: { deletedAt: { lt: cutoff } }, select: { id: true } });
  const exams = await prisma.exam.findMany({ where: { deletedAt: { lt: cutoff } }, select: { id: true } });
  const vocab = await prisma.vocabularyItem.findMany({ where: { deletedAt: { lt: cutoff } }, select: { id: true } });
  const perf = await prisma.topicPerformance.count({ where: { deletedAt: { lt: cutoff } } });
  console.info(`Silinecek: ${attempts.length} deneme oturumu, ${exams.length} deneme, ${vocab.length} kelime, ${perf} konu performansı.`);
  if (!process.argv.includes("--onayla")) return;

  const attemptIds = attempts.map((a) => a.id);
  const examIds = exams.map((e) => e.id);
  const vocabIds = vocab.map((v) => v.id);
  await prisma.$transaction([
    prisma.dailyRecommendation.deleteMany({ where: { OR: [{ attemptId: { in: attemptIds } }, { deletedAt: { lt: cutoff } }] } }),
    prisma.userAnswer.deleteMany({ where: { attemptId: { in: attemptIds } } }),
    prisma.examAttempt.deleteMany({ where: { id: { in: attemptIds } } }),
    prisma.examQuestion.deleteMany({ where: { examId: { in: examIds } } }),
    prisma.exam.deleteMany({ where: { id: { in: examIds }, attempt: { is: null } } }),
    prisma.vocabularyReview.deleteMany({ where: { vocabularyItemId: { in: vocabIds } } }),
    prisma.vocabularyItem.deleteMany({ where: { id: { in: vocabIds } } }),
    prisma.topicPerformance.deleteMany({ where: { deletedAt: { lt: cutoff } } }),
  ]);
  console.info("Kalıcı silme tamamlandı.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
