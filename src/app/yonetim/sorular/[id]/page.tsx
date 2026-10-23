import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuestionForm } from "@/components/admin/question-form";
import { StatusButton } from "@/components/admin/status-button";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth/guards";
import { QUALITY_STATUS_LABELS, type QualityStatusKey } from "@/lib/constants";
import { prisma } from "@/lib/db";
import type { QualityReport } from "@/lib/questions/quality";
import { questionToDraft } from "@/lib/services/questions-admin";
import { idSchema } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Soru düzenle" };
export const dynamic = "force-dynamic";

export default async function EditQuestionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ kaydedildi?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { kaydedildi } = await searchParams;
  if (!idSchema.safeParse(id).success) notFound();
  const [question, topics, exposure] = await Promise.all([
    prisma.question.findFirst({ where: { id, deletedAt: null }, include: { options: true, topic: true } }),
    prisma.topic.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { slug: true, name: true, questionType: true } }),
    prisma.questionExposure.aggregate({ where: { questionId: id }, _sum: { timesSeen: true } }),
  ]);
  if (!question) notFound();
  const report = question.qualityReport as QualityReport | null;
  const back = `/yonetim/sorular/${id}`;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title="Soru düzenle"
        description={`Durum: ${QUALITY_STATUS_LABELS[question.qualityStatus as QualityStatusKey]} · Kaynak: ${question.source} · Görülme sayısı: ${exposure._sum.timesSeen ?? 0}`}
        actions={
          <>
            {question.qualityStatus !== "APPROVED" ? <StatusButton id={id} status="APPROVED" label="Yayımla" back={back} variant="primary" /> : null}
            {question.qualityStatus !== "DISABLED" ? <StatusButton id={id} status="DISABLED" label="Devre dışı bırak" back={back} /> : null}
            {question.qualityStatus === "PENDING_REVIEW" ? <StatusButton id={id} status="REJECTED" label="Reddet" back={back} variant="danger" /> : null}
          </>
        }
      />
      {kaydedildi ? <Alert tone="success">Soru kaydedildi.</Alert> : null}
      {report ? (
        <Alert tone={report.passed ? "success" : "warning"} title={`Son kalite kontrolü: ${report.passed ? "geçti" : "uyarılar var"}`}>
          {report.issues.length ? (
            <ul className="list-disc pl-5">
              {report.issues.map((i) => (
                <li key={i.code + i.message}>{i.message}</li>
              ))}
            </ul>
          ) : (
            <p>Tek doğru cevap, açıklama-anahtar tutarlılığı, biçim ve benzerlik kontrolleri başarılı. En yüksek benzerlik: {report.maxSimilarity}</p>
          )}
        </Alert>
      ) : null}
      <Card>
        <QuestionForm topics={topics} initial={{ ...questionToDraft(question), id: question.id, status: question.qualityStatus as QualityStatusKey }} />
      </Card>
    </div>
  );
}
