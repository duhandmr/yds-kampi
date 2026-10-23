import type { z } from "zod";

export type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Kod bloğu çitlerini temizler ve ilk JSON nesnesini ayıklar. */
export function extractJson(raw: string): string {
  let text = raw.trim();
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence?.[1]) text = fence[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first > 0 && last > first) text = text.slice(first, last + 1);
  return text;
}

/** Yapay zekâ çıktısını önce JSON olarak, sonra şemaya göre doğrular. Başarısızsa veri asla kullanılmaz. */
export function parseAiJson<S extends z.ZodTypeAny>(raw: string, schema: S): ParseResult<z.infer<S>> {
  let data: unknown;
  try {
    data = JSON.parse(extractJson(raw));
  } catch {
    return { ok: false, error: "Yapay zekâ çıktısı geçerli JSON değil." };
  }
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.map(String).join(".") || "kök"}: ${i.message}`)
      .join("; ");
    return { ok: false, error: `Şema doğrulaması başarısız: ${msg}` };
  }
  return { ok: true, data: parsed.data };
}
