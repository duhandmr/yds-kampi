import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getAiProvider } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth/guards";
import { getSettings, readTypeWeights } from "@/lib/services/settings";

export const metadata: Metadata = { title: "Ayarlar" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdmin();
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Kamp ayarları" />
      <Card>
        <SettingsForm
          aiConfigured={getAiProvider() !== null}
          values={{
            campStartDate: s.campStartDate,
            examDate: s.examDate ?? "",
            dailyQuestionCount: s.dailyQuestionCount,
            dailyDurationMinutes: s.dailyDurationMinutes,
            quickQuestionCount: s.quickQuestionCount,
            quickDurationMinutes: s.quickDurationMinutes,
            intensiveQuestionCount: s.intensiveQuestionCount,
            intensiveDurationMinutes: s.intensiveDurationMinutes,
            fullMockEnabled: s.fullMockEnabled,
            fullMockQuestionCount: s.fullMockQuestionCount,
            fullMockDurationMinutes: s.fullMockDurationMinutes,
            placementQuestionCount: s.placementQuestionCount,
            placementDurationMinutes: s.placementDurationMinutes,
            aiEnabled: s.aiEnabled,
            aiAutoPublish: s.aiAutoPublish,
            weights: readTypeWeights(s),
          }}
        />
      </Card>
    </div>
  );
}
