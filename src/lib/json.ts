import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { keywordSchema } from "./validation/schemas";
import type { KeywordEntry } from "./questions/types";

/** Uygulama nesnelerini Prisma Json alanına güvenle yazmak için düz JSON'a çevirir. */
export function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

const keywordsSchema = z.array(keywordSchema);

export function readKeywords(value: unknown): KeywordEntry[] {
  const parsed = keywordsSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}
