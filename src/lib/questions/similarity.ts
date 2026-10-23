import { createHash } from "node:crypto";

const STOP_WORDS = new Set([
  "the", "a", "an", "of", "to", "in", "and", "or", "is", "are", "was", "were", "be", "for", "on", "that", "this",
  "with", "as", "it", "by", "at", "from", "which", "ve", "bir", "bu", "ile", "da", "de",
]);

export function normalizeText(text: string): string {
  return text
    .toLocaleLowerCase("en-US")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-{2,}/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(" ")
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

/** Sıra bilgisini korumak için tekil kelimeler + ikili kelime grupları. */
export function shingles(text: string): Set<string> {
  const tokens = tokenize(text);
  const set = new Set<string>(tokens);
  for (let i = 0; i < tokens.length - 1; i += 1) set.add(`${tokens[i]}_${tokens[i + 1]}`);
  return set;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function similarity(a: string, b: string): number {
  return jaccard(shingles(a), shingles(b));
}

/** Bu eşik ve üzerindeki benzerlik "anlamsal tekrar" sayılır. */
export const NEAR_DUPLICATE_THRESHOLD = 0.7;

export function questionSignatureText(q: { passage?: string | null; stem: string }): string {
  return `${q.passage ?? ""} ${q.stem}`.trim();
}

export function contentHash(q: { type: string; passage?: string | null; stem: string; options: Array<{ text: string }> }): string {
  const payload = [
    q.type,
    normalizeText(q.passage ?? ""),
    normalizeText(q.stem),
    ...q.options.map((o) => normalizeText(o.text)).sort(),
  ].join("|");
  return createHash("sha256").update(payload).digest("hex");
}
