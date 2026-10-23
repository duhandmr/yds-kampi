import type { Metadata } from "next";
import { StudyModePicker, type StudyMode } from "@/components/exam/study-mode-picker";
import { PageHeader } from "@/components/ui/page-header";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { getTodayExams } from "@/lib/services/exam-service";
import { examConfig, getSettings } from "@/lib/services/settings";

export const metadata: Metadata = { title: "Çalışma" };

export default async function StudyHubPage() {
  const user = await requireOnboardedUser();
  const [settings, todayExams] = await Promise.all([getSettings(), getTodayExams(user.id)]);
  const statusOf = (kind: StudyMode["kind"]): StudyMode["status"] => {
    const exam = todayExams.find((e) => e.kind === kind);
    if (!exam) return "new";
    if (!exam.attempt) return "ready";
    return exam.attempt.status === "COMPLETED" ? "completed" : "in-progress";
  };
  const make = (kind: StudyMode["kind"], title: string, description: string, extra: Partial<StudyMode> = {}): StudyMode => {
    const cfg = examConfig(settings, kind);
    return { kind, title, description, count: cfg.count, minutes: Math.round(cfg.durationSeconds / 60), status: statusOf(kind), ...extra };
  };

  const modes: StudyMode[] = [
    make("DAILY", "Günlük deneme", "Performansına göre dengelenmiş, kolay-orta-zor karışık günlük mini deneme.", { recommended: true }),
    make("QUICK", "Hızlı çalışma", "Vaktin azsa: kısa ve odaklı bir tekrar."),
    make("INTENSIVE", "Yoğun çalışma", "Daha uzun bir oturumla dayanıklılık ve süre yönetimi çalışması."),
    make("FULL", "Tam prova", "Yönetici tarafından belirlenen kapsamlı sınav provası.", { disabled: !settings.fullMockEnabled }),
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Bugünün çalışması"
        title="Çalışma modunu seç"
        description="Her mod için önce kısa bir konu hazırlığı, ardından süreli deneme ve ayrıntılı sonuçlar seni bekliyor."
      />
      <StudyModePicker modes={modes} />
    </div>
  );
}
