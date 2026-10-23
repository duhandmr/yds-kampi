import { describe, expect, it } from "vitest";
import { finalizeCore, saveAnswerCore, type AttemptRecord } from "@/lib/exam/attempt-core";
import { SAVE_GRACE_MS } from "@/lib/exam/timing";
import { createMemoryStore } from "./helpers";

const start = new Date("2026-10-23T09:00:00.000Z");
const deadline = new Date(start.getTime() + 35 * 60_000);

function makeAttempt(): AttemptRecord {
  return { id: "att1", userId: "u1", status: "IN_PROGRESS", startedAt: start, deadlineAt: deadline };
}

describe("Deneme oturumu", () => {
  it("aynı deneme iki kez tamamlanamaz; sonuçlar yalnızca bir kez hesaplanır", async () => {
    const mem = createMemoryStore(makeAttempt(), ["q1", "q2"]);
    const now = new Date(start.getTime() + 10 * 60_000);
    const first = await finalizeCore(mem.store, "u1", "att1", now);
    const second = await finalizeCore(mem.store, "u1", "att1", now);
    expect(first.status).toBe("COMPLETED_NOW");
    expect(second.status).toBe("ALREADY_COMPLETED");
    expect(mem.completions).toBe(1);
  });

  it("eşzamanlı iki bitirme isteğinde yalnızca biri sonuç üretir", async () => {
    const mem = createMemoryStore(makeAttempt(), ["q1"]);
    const now = new Date(start.getTime() + 60_000);
    const results = await Promise.all([finalizeCore(mem.store, "u1", "att1", now), finalizeCore(mem.store, "u1", "att1", now)]);
    expect(results.filter((r) => r.status === "COMPLETED_NOW")).toHaveLength(1);
    expect(mem.completions).toBe(1);
  });

  it("cevaplar deneme tamamlanmadan kaydedilir ve kaybolmaz", async () => {
    const mem = createMemoryStore(makeAttempt(), ["q1", "q2"]);
    const t = new Date(start.getTime() + 5 * 60_000);
    expect((await saveAnswerCore(mem.store, "u1", "att1", { questionId: "q1", selectedLabel: "B", flagged: false, timeSpentSeconds: 40 }, t)).ok).toBe(true);
    expect((await saveAnswerCore(mem.store, "u1", "att1", { questionId: "q2", selectedLabel: null, flagged: true, timeSpentSeconds: 12 }, t)).ok).toBe(true);
    expect((await saveAnswerCore(mem.store, "u1", "att1", { questionId: "q1", selectedLabel: "C", flagged: false, timeSpentSeconds: 55 }, t)).ok).toBe(true);
    expect(mem.answers.get("q1")?.selectedLabel).toBe("C");
    expect(mem.answers.get("q2")?.flagged).toBe(true);
    expect(mem.answers.size).toBe(2);
  });

  it("tamamlanmış denemeye cevap yazılamaz", async () => {
    const mem = createMemoryStore(makeAttempt(), ["q1"]);
    await finalizeCore(mem.store, "u1", "att1", new Date(start.getTime() + 60_000));
    const res = await saveAnswerCore(mem.store, "u1", "att1", { questionId: "q1", selectedLabel: "A", flagged: false, timeSpentSeconds: 1 }, new Date(start.getTime() + 2 * 60_000));
    expect(res).toEqual({ ok: false, reason: "COMPLETED" });
  });

  it("başka kullanıcının denemesine erişilemez ve sınavda olmayan soru kaydedilemez", async () => {
    const mem = createMemoryStore(makeAttempt(), ["q1"]);
    const t = new Date(start.getTime() + 60_000);
    expect(await saveAnswerCore(mem.store, "baska", "att1", { questionId: "q1", selectedLabel: "A", flagged: false, timeSpentSeconds: 1 }, t)).toEqual({ ok: false, reason: "NOT_FOUND" });
    expect(await saveAnswerCore(mem.store, "u1", "att1", { questionId: "qX", selectedLabel: "A", flagged: false, timeSpentSeconds: 1 }, t)).toEqual({ ok: false, reason: "INVALID_QUESTION" });
    expect((await finalizeCore(mem.store, "baska", "att1", t)).status).toBe("NOT_FOUND");
  });

  it("süre dolduğunda yeni cevap kabul edilmez ve deneme otomatik tamamlanır", async () => {
    const mem = createMemoryStore(makeAttempt(), ["q1"]);
    const late = new Date(deadline.getTime() + SAVE_GRACE_MS + 1_000);
    const save = await saveAnswerCore(mem.store, "u1", "att1", { questionId: "q1", selectedLabel: "A", flagged: false, timeSpentSeconds: 1 }, late);
    expect(save).toEqual({ ok: false, reason: "EXPIRED" });
    const fin = await finalizeCore(mem.store, "u1", "att1", late);
    expect(fin).toEqual({ status: "COMPLETED_NOW", autoSubmitted: true });
    // Tamamlanma zamanı son teslim anına sabitlenir; süre, verilen süreyi aşmaz.
    expect(mem.context?.completedAt.getTime()).toBe(deadline.getTime());
    expect(mem.context?.durationSeconds).toBe(35 * 60);
  });

  it("ağ gecikmesi payı içinde gelen son cevap kabul edilir", async () => {
    const mem = createMemoryStore(makeAttempt(), ["q1"]);
    const justAfter = new Date(deadline.getTime() + SAVE_GRACE_MS - 500);
    expect((await saveAnswerCore(mem.store, "u1", "att1", { questionId: "q1", selectedLabel: "D", flagged: false, timeSpentSeconds: 3 }, justAfter)).ok).toBe(true);
  });

  it("süre dolmadan bitirilen deneme otomatik tamamlanmış sayılmaz", async () => {
    const mem = createMemoryStore(makeAttempt(), ["q1"]);
    const res = await finalizeCore(mem.store, "u1", "att1", new Date(start.getTime() + 20 * 60_000));
    expect(res).toEqual({ status: "COMPLETED_NOW", autoSubmitted: false });
    expect(mem.context?.durationSeconds).toBe(20 * 60);
  });
});
