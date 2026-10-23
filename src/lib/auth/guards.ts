import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type SessionUser } from "./session";

/** Sayfa ve server action'larda kullanılır: oturum yoksa giriş sayfasına yönlendirir. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/panel");
  return user;
}

/** Öğrenme akışı sayfaları: bilgilendirme ve seviye belirleme tamamlanmadan panele geçilmez. */
export async function requireOnboardedUser(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role === "ADMIN") return user;
  if (!user.onboardingCompleted) redirect("/karsilama");
  if (!user.placementCompleted) redirect("/seviye-belirleme");
  return user;
}

/** API route'ları için: yönlendirme yerine null döner, route 401/403 üretir. */
export async function getApiUser(requiredRole: "USER" | "ADMIN" = "USER"): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (requiredRole === "ADMIN" && user.role !== "ADMIN") return null;
  return user;
}
