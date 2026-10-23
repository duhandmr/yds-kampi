import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "../db";
import { getEnv } from "../env";
import type { RoleKey } from "../constants";
import { SESSION_COOKIE_NAME } from "./access";

export interface SessionUser {
  id: string;
  role: RoleKey;
  displayName: string;
  onboardingCompleted: boolean;
  placementCompleted: boolean;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const env = getEnv();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 86_400_000);
  await prisma.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(SESSION_COOKIE_NAME);
}

export async function destroyAllSessionsForUser(userId: string, exceptCurrent = true): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  await prisma.session.deleteMany({
    where: { userId, ...(exceptCurrent && token ? { NOT: { tokenHash: hashToken(token) } } : {}) },
  });
}

/** Oturumu her istekte veritabanından doğrular (yalnızca çerezin varlığına güvenilmez). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token || token.length > 200) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { profile: true } } },
  });
  if (!session || session.expiresAt.getTime() < Date.now() || session.user.deletedAt) return null;
  const { user } = session;
  return {
    id: user.id,
    role: user.role,
    displayName: user.profile?.displayName ?? "Yaren",
    onboardingCompleted: Boolean(user.profile?.onboardingCompletedAt),
    placementCompleted: Boolean(user.profile?.placementCompletedAt),
  };
});
