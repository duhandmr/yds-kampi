import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL tanımlı değil."),
  APP_URL: z.string().url().default("http://localhost:3000"),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(60).default(14),
  CRON_SECRET: z.string().optional().default(""),
  AI_PROVIDER: z.enum(["none", "openai", "azure-openai"]).default("none"),
  AI_API_KEY: z.string().optional().default(""),
  AI_BASE_URL: z.string().optional().default(""),
  AI_MODEL: z.string().optional().default(""),
  AZURE_OPENAI_ENDPOINT: z.string().optional().default(""),
  AZURE_OPENAI_DEPLOYMENT: z.string().optional().default(""),
  AZURE_OPENAI_API_VERSION: z.string().optional().default("2024-10-21"),
  AI_VERIFY_WITH_SOLVER: z
    .enum(["true", "false"])
    .optional()
    .default("true")
    .transform((v) => v === "true"),
  AI_TIMEOUT_MS: z.coerce.number().int().min(5_000).max(180_000).default(60_000),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/** Ortam değişkenlerini ilk kullanımda doğrular. Hata mesajı değer içermez, yalnızca eksik alanı belirtir. */
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Ortam değişkenleri geçersiz: ${fields}`);
  }
  cached = parsed.data;
  return cached;
}
