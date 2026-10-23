import { AppShell } from "@/components/layout/app-shell";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <AppShell variant="admin">{children}</AppShell>;
}
