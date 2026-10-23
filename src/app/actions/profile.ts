"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { destroyAllSessionsForUser } from "@/lib/auth/session";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";
import { softDeleteUserData } from "@/lib/services/user-data";
import { changePasswordSchema, deleteMyDataSchema, fieldErrors } from "@/lib/validation/schemas";

export interface FormState {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  try {
    await enforceRateLimit(`password:${user.id}`, 5, 15 * 60_000);
  } catch (error) {
    if (error instanceof RateLimitError) return { message: error.message };
    throw error;
  }
  const record = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true } });
  if (!(await verifyPassword(parsed.data.currentPassword, record.passwordHash))) {
    return { errors: { currentPassword: "Mevcut parola hatalı." } };
  }
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.newPassword) } });
  await destroyAllSessionsForUser(user.id, true);
  return { ok: true, message: "Parolan güncellendi. Diğer cihazlardaki oturumlar kapatıldı." };
}

export async function deleteMyDataAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = deleteMyDataSchema.safeParse({ confirmation: formData.get("confirmation") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  await softDeleteUserData(user.id);
  redirect("/seviye-belirleme");
}
