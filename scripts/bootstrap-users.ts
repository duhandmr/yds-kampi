/**
 * İlk kurulumda yönetici ve öğrenci hesaplarını ortam değişkenlerinden oluşturur.
 * Hesap zaten varsa hiçbir şeyi değiştirmez. Parolalar koda yazılmaz.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { LEARNER_DISPLAY_NAME } from "../src/lib/constants";
import { passwordSchema } from "../src/lib/validation/schemas";

const prisma = new PrismaClient();

async function ensureUser(usernameRaw: string | undefined, password: string | undefined, role: "USER" | "ADMIN") {
  const username = (usernameRaw ?? "").trim().toLowerCase();
  if (!username || !password) {
    console.info(role + ": kurulum degiskenleri tanimli degil, atlandi.");
    return;
  }
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) {
    throw new Error(role + " kullanici adi gecersiz.");
  }
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.info(username + " zaten var, degistirilmedi.");
    return;
  }
  const check = passwordSchema.safeParse(password);
  if (!check.success) {
    throw new Error(role + " parolasi yeterince guclu degil: " + (check.error.issues[0]?.message ?? ""));
  }
  await prisma.user.create({
    data: {
      username,
      passwordHash: await hashPassword(password),
      role,
      profile: { create: { displayName: role === "ADMIN" ? "Yönetici" : LEARNER_DISPLAY_NAME } },
      ...(role === "USER" ? { streak: { create: {} } } : {}),
    },
  });
  console.info(username + " (" + role + ") olusturuldu.");
}

async function main() {
  await ensureUser(process.env.SETUP_ADMIN_USERNAME, process.env.SETUP_ADMIN_PASSWORD, "ADMIN");
  await ensureUser(process.env.SETUP_LEARNER_USERNAME, process.env.SETUP_LEARNER_PASSWORD, "USER");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());