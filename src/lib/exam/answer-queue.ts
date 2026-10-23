import type { OptionLabel } from "../constants";

/**
 * İstemci tarafı cevap kuyruğu. Her değişiklik önce kuyruğa (ve localStorage'a) yazılır,
 * sunucu onayı gelene kadar silinmez. Böylece ağ hatasında cevaplar kaybolmaz.
 */

export interface PendingAnswer {
  questionId: string;
  selectedLabel: OptionLabel | null;
  flagged: boolean;
  timeSpentSeconds: number;
  version: number;
}

export type Queue = Record<string, PendingAnswer>;

export function enqueue(queue: Queue, answer: Omit<PendingAnswer, "version">): Queue {
  const prev = queue[answer.questionId];
  return { ...queue, [answer.questionId]: { ...answer, version: (prev?.version ?? 0) + 1 } };
}

/** Sunucu, gönderilen sürümü onayladığında kuyruğu temizler; bu arada daha yeni bir değişiklik geldiyse korur. */
export function acknowledge(queue: Queue, questionId: string, version: number): Queue {
  const current = queue[questionId];
  if (!current || current.version !== version) return queue;
  const next = { ...queue };
  delete next[questionId];
  return next;
}

export function pendingList(queue: Queue): PendingAnswer[] {
  return Object.values(queue);
}

export function serializeQueue(queue: Queue): string {
  return JSON.stringify(queue);
}

export function parseQueue(raw: string | null): Queue {
  if (!raw) return {};
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return {};
    const out: Queue = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      if (!v || typeof v !== "object") continue;
      const a = v as Partial<PendingAnswer>;
      const label = a.selectedLabel;
      const validLabel = label === null || (typeof label === "string" && ["A", "B", "C", "D", "E"].includes(label));
      if (typeof a.questionId === "string" && a.questionId === k && validLabel && typeof a.flagged === "boolean") {
        out[k] = {
          questionId: a.questionId,
          selectedLabel: (label ?? null) as OptionLabel | null,
          flagged: a.flagged,
          timeSpentSeconds: typeof a.timeSpentSeconds === "number" ? Math.max(0, Math.round(a.timeSpentSeconds)) : 0,
          version: typeof a.version === "number" ? a.version : 1,
        };
      }
    }
    return out;
  } catch {
    return {};
  }
}
