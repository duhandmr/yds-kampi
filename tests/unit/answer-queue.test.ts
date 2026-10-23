import { describe, expect, it } from "vitest";
import { acknowledge, enqueue, parseQueue, pendingList, serializeQueue } from "@/lib/exam/answer-queue";

describe("İstemci cevap kuyruğu", () => {
  it("sunucu onaylamadan cevap kuyruktan silinmez", () => {
    let q = enqueue({}, { questionId: "q1", selectedLabel: "A", flagged: false, timeSpentSeconds: 10 });
    expect(pendingList(q)).toHaveLength(1);
    // ağ hatası: onay yok → cevap kuyrukta kalır
    expect(pendingList(q)[0]?.selectedLabel).toBe("A");
    q = acknowledge(q, "q1", 1);
    expect(pendingList(q)).toHaveLength(0);
  });

  it("gönderim sırasında yapılan yeni değişiklik eski onayla silinmez", () => {
    let q = enqueue({}, { questionId: "q1", selectedLabel: "A", flagged: false, timeSpentSeconds: 10 });
    q = enqueue(q, { questionId: "q1", selectedLabel: "B", flagged: false, timeSpentSeconds: 15 });
    q = acknowledge(q, "q1", 1);
    expect(pendingList(q)[0]?.selectedLabel).toBe("B");
  });

  it("tarayıcı deposundan güvenle geri yüklenir; bozuk veri yok sayılır", () => {
    const q = enqueue({}, { questionId: "q9", selectedLabel: "E", flagged: true, timeSpentSeconds: 7 });
    expect(parseQueue(serializeQueue(q))).toEqual(q);
    expect(parseQueue("{bozuk")).toEqual({});
    expect(parseQueue(JSON.stringify({ q1: { questionId: "q1", selectedLabel: "Z", flagged: false } }))).toEqual({});
  });
});
