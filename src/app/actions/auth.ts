"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DUMMY_HASH, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/access";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { firstIssue, loginSchema } from "@/lib/validation/schemas";

export interface LoginState {
  error?: string;
}

const GENERIC_ERROR = "Kullanıcı adı veya parola hatalı.";

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const ip = await clientIp();
  const username = parsed.data.username.toLowerCase();
  // Kaba kuvvet saldırılarına karşı hem IP hem kullanıcı adı bazında sınırlama
  const [byIp, byUser] = await Promise.all([
    rateLimit(`login:ip:${ip}`, 20, 15 * 60_000),
    rateLimit(`login:user:${username}`, 8, 15 * 60_000),
  ]);
  if (!byIp.allowed || !byUser.allowed) {
    return { error: "Çok fazla giriş denemesi yapıldı. Lütfen 15 dakika sonra tekrar deneyin." };
  }

  const user = await prisma.user.findUnique({ where: { username }, select: { id: true, passwordHash: true, role: true, deletedAt: true } });
  const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || user.deletedAt || !valid) return { error: GENERIC_ERROR };

  await createSession(user.id);
  const fallback = user.role === "ADMIN" ? "/yonetim" : "/panel";
  redirect(safeNextPath(parsed.data.next, fallback));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
