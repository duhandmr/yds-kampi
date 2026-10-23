import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/guards";

export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <AppShell>{children}</AppShell>;
}
