"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";

export async function completeOnboardingAction(): Promise<void> {
  const user = await requireUser();
  await prisma.profile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, onboardingCompletedAt: new Date() },
    update: { onboardingCompletedAt: new Date() },
  });
  redirect(user.placementCompleted || user.role === "ADMIN" ? "/panel" : "/seviye-belirleme");
}
