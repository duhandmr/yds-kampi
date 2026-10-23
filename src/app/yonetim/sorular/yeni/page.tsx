import type { Metadata } from "next";
import { QuestionForm } from "@/components/admin/question-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Yeni soru" };

export default async function NewQuestionPage() {
  await requireAdmin();
  const topics = await prisma.topic.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { slug: true, name: true, questionType: true } });
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Yeni soru" description="Her soru kaydedilirken otomatik kalite kontrolünden geçirilir." />
      <Card>
        <QuestionForm topics={topics} />
      </Card>
    </div>
  );
}
