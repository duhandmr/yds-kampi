/**
 * Güvenli kullanıcı oluşturma (ilk yönetici hesabı ve Yaren'in hesabı için).
 *
 * Kullanım:
 *   npm run user:create -- --username yonetici --role ADMIN
 *   npm run user:create -- --username yaren --role USER
 *   npm run user:create -- --username yaren --reset-password
 *
 * Parola komut satırı argümanı olarak ALINMAZ (kabuk geçmişine düşmemesi için).
 * Gizli olarak sorulur ya da CI ortamında NEW_USER_PASSWORD değişkeninden okunur.
 */
import { PrismaClient } from "@prisma/client";
import { Writable } from "node:stream";
import { createInterface } from "node:readline";
import { hashPassword } from "../src/lib/auth/password";
import { LEARNER_DISPLAY_NAME } from "../src/lib/constants";
import { passwordSchema } from "../src/lib/validation/schemas";

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function askHidden(question: string): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk, _enc, cb) {
      if (!muted) process.stdout.write(chunk);
      cb();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

async function readPassword(): Promise<string> {
  if (process.env.NEW_USER_PASSWORD) return process.env.NEW_USER_PASSWORD;
  if (!process.stdin.isTTY) throw new Error("Parola için etkileşimli terminal veya NEW_USER_PASSWORD gerekli.");
  const first = await askHidden("Parola: ");
  const second = await askHidden("Parola (tekrar): ");
  if (first !== second) throw new Error("Parolalar eşleşmiyor.");
  return first;
}

async function main() {
  const username = (arg("username") ?? "").trim().toLowerCase();
  const roleArg = (arg("role") ?? "USER").toUpperCase();
  const reset = process.argv.includes("--reset-password");
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new Error("Geçerli bir --username verin (3-40 karakter: a-z, 0-9, . _ -).");
  if (roleArg !== "USER" && roleArg !== "ADMIN") throw new Error("--role USER veya ADMIN olmalı.");
  const role: "USER" | "ADMIN" = roleArg;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing && !reset) throw new Error("Bu kullanıcı adı zaten var. Parolayı değiştirmek için --reset-password kullanın.");
  if (!existing && reset) throw new Error("Kullanıcı bulunamadı.");

  const password = await readPassword();
  const check = passwordSchema.safeParse(password);
  if (!check.success) throw new Error(check.error.issues[0]?.message ?? "Parola yeterince güçlü değil.");
  const passwordHash = await hashPassword(password);

  if (existing) {
    await prisma.$transaction([
      prisma.user.update({ where: { id: existing.id }, data: { passwordHash } }),
      prisma.session.deleteMany({ where: { userId: existing.id } }),
    ]);
    console.info(`"${username}" kullanıcısının parolası güncellendi ve tüm oturumları kapatıldı.`);
    return;
  }

  await prisma.user.create({
    data: {
      username,
      passwordHash,
      role,
      profile: { create: { displayName: role === "ADMIN" ? "Yönetici" : LEARNER_DISPLAY_NAME } },
      ...(role === "USER" ? { streak: { create: {} } } : {}),
    },
  });
  console.info(`"${username}" (${role}) oluşturuldu.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
