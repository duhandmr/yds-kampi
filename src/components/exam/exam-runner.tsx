"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { finishAttemptAction, saveAnswerAction } from "@/app/actions/exam";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/components/ui/cn";
import { acknowledge, enqueue, parseQueue, pendingList, serializeQueue, type Queue } from "@/lib/exam/answer-queue";
import { formatClock } from "@/lib/exam/timing";
import { OPTION_LABELS, type OptionLabel } from "@/lib/constants";

export interface RunnerQuestion {
  id: string;
  typeLabel: string;
  passage: string | null;
  stem: string;
  options: Array<{ label: string; text: string }>;
}

interface AnswerState {
  selectedLabel: OptionLabel | null;
  flagged: boolean;
  timeSpentSeconds: number;
}

type SaveStatus = "idle" | "saving" | "saved" | "offline";

const RETRY_MS = 5_000;

type FlushResult = "saved" | "failed" | "closed";

export function ExamRunner({
  attemptId,
  title,
  questions,
  initialAnswers,
  deadlineIso,
  serverNowIso,
}: {
  attemptId: string;
  title: string;
  questions: RunnerQuestion[];
  initialAnswers: Record<string, AnswerState>;
  deadlineIso: string;
  serverNowIso: string;
}) {
  const router = useRouter();
  const storageKey = `yds-attempt-${attemptId}`;
  const total = questions.length;

  const [answers, setAnswers] = useState<Record<string, AnswerState>>(initialAnswers);
  const [index, setIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [remaining, setRemaining] = useState<number>(() => new Date(deadlineIso).getTime() - new Date(serverNowIso).getTime());
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const answersRef = useRef(answers);
  const queueRef = useRef<Queue>({});
  const flushPromiseRef = useRef<Promise<FlushResult> | null>(null);
  const closeRef = useRef<() => Promise<void>>(async () => {});
  const closingRef = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offsetRef = useRef(new Date(serverNowIso).getTime() - Date.now());
  const finishedRef = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announcedRef = useRef<Set<number>>(new Set());

  const questionsRef = useRef(questions);
  const indexRef = useRef(index);
  answersRef.current = answers;
  questionsRef.current = questions;
  indexRef.current = index;
  const current = questions[index]!;
  const currentAnswer = answers[current.id] ?? { selectedLabel: null, flagged: false, timeSpentSeconds: 0 };

  const persistQueue = useCallback(() => {
    try {
      localStorage.setItem(storageKey, serializeQueue(queueRef.current));
    } catch {
      // depolama kullanılamıyorsa sunucu kaydı yine de denenir
    }
  }, [storageKey]);

  /**
   * Kuyruktaki tüm cevapları sırayla gönderir. Zaten çalışan bir gönderim varsa onu bekler ve
   * ardından kuyruk boşalana kadar (ya da bir hata olana kadar) devam eder; böylece gönderim
   * sırasında eklenen cevaplar da aynı çağrıda kaydedilir.
   * Dönen değer: "saved" (kuyruk boş), "failed" (ağ/sunucu hatası) veya "closed" (deneme kapanmış).
   */
  const flush = useCallback((): Promise<FlushResult> => {
    if (flushPromiseRef.current) {
      return flushPromiseRef.current.then((r) => (r === "saved" && pendingList(queueRef.current).length > 0 ? flush() : r));
    }
    if (retryTimer.current) clearTimeout(retryTimer.current);
    const run = (async (): Promise<FlushResult> => {
      let result: FlushResult = "saved";
      try {
        while (pendingList(queueRef.current).length > 0) {
          const item = pendingList(queueRef.current)[0]!;
          setSaveStatus("saving");
          let res: Awaited<ReturnType<typeof saveAnswerAction>>;
          try {
            res = await saveAnswerAction({
              attemptId,
              questionId: item.questionId,
              selectedLabel: item.selectedLabel,
              flagged: item.flagged,
              timeSpentSeconds: item.timeSpentSeconds,
            });
          } catch {
            result = "failed";
            break;
          }
          if (res.ok || res.reason === "INVALID_QUESTION" || res.reason === "INVALID_INPUT") {
            const before = queueRef.current;
            queueRef.current = acknowledge(queueRef.current, item.questionId, item.version);
            if (before === queueRef.current) continue; // daha yeni sürüm geldi; döngü onu gönderir
          } else if (res.reason === "COMPLETED" || res.reason === "EXPIRED") {
            // Deneme kapanmış (süre doldu veya başka sekmede bitirildi): sonuç sayfasına geçilir.
            queueRef.current = {};
            result = "closed";
            break;
          } else {
            result = "failed";
            break;
          }
        }
      } finally {
        persistQueue();
      }
      return result;
    })();
    flushPromiseRef.current = run;
    return run.then((result) => {
      flushPromiseRef.current = null;
      if (result === "closed") {
        setSaveStatus("idle");
        void closeRef.current();
        return result;
      }
      const done = pendingList(queueRef.current).length === 0;
      setSaveStatus(done ? "saved" : "offline");
      if (!done) retryTimer.current = setTimeout(() => void flush(), RETRY_MS);
      return done ? "saved" : "failed";
    });
  }, [attemptId, persistQueue]);

  const record = useCallback(
    (questionId: string, patch: Partial<AnswerState>) => {
      const prev = answersRef.current[questionId] ?? { selectedLabel: null, flagged: false, timeSpentSeconds: 0 };
      const next = { ...prev, ...patch };
      setAnswers((a) => ({ ...a, [questionId]: next }));
      queueRef.current = enqueue(queueRef.current, { questionId, ...next });
      persistQueue();
      void flush();
    },
    [flush, persistQueue],
  );

  // Açılışta: tarayıcıda kalmış (sunucuya ulaşmamış) cevapları geri yükle ve gönder.
  useEffect(() => {
    let stored: Queue = {};
    try {
      stored = parseQueue(localStorage.getItem(storageKey));
    } catch {
      stored = {};
    }
    const validIds = new Set(questions.map((q) => q.id));
    const pending = pendingList(stored).filter((p) => validIds.has(p.questionId));
    if (pending.length > 0) {
      queueRef.current = Object.fromEntries(pending.map((p) => [p.questionId, p]));
      setAnswers((a) => {
        const merged = { ...a };
        for (const p of pending) merged[p.questionId] = { selectedLabel: p.selectedLabel, flagged: p.flagged, timeSpentSeconds: p.timeSpentSeconds };
        return merged;
      });
      void flush();
    }
    // yalnızca ilk yüklemede
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const callFinish = useCallback(async (): Promise<boolean> => {
    try {
      const res = await finishAttemptAction({ attemptId });
      if (res.ok) {
        try {
          localStorage.removeItem(storageKey);
        } catch {
          // yok say
        }
        router.replace(res.redirectTo);
        return true;
      }
      setFinishError(res.error);
    } catch {
      setFinishError("Sunucuya ulaşılamadı. Cevapların kayıtlı; bağlantın düzelince tekrar dene.");
    }
    return false;
  }, [attemptId, router, storageKey]);

  const finish = useCallback(
    async (auto: boolean) => {
      // Ref, ilk await'ten ÖNCE işaretlenir: zamanlayıcının sonraki tikleri ikinci bir bitirme başlatmaz.
      if (finishedRef.current) return;
      finishedRef.current = true;
      setFinishing(true);
      setFinishError(null);
      const saved = await flush();
      if (saved === "closed") return; // flush sonucu zaten sonuç sayfasına yönlendiriyor
      if (saved === "failed" && !auto) {
        finishedRef.current = false;
        setFinishing(false);
        setFinishError("Bazı cevapların henüz kaydedilemedi. Bağlantını kontrol edip tekrar dene; cevapların bu cihazda saklanıyor.");
        return;
      }
      const ok = await callFinish();
      if (!ok) {
        finishedRef.current = false;
        setFinishing(false);
      }
    },
    [callFinish, flush],
  );

  closeRef.current = async () => {
    if (closingRef.current) return;
    closingRef.current = true;
    finishedRef.current = true;
    setFinishing(true);
    const ok = await callFinish();
    if (!ok) {
      closingRef.current = false;
      finishedRef.current = false;
      setFinishing(false);
    }
  };

  // Geri sayım ve soru başına süre takibi
  useEffect(() => {
    const deadline = new Date(deadlineIso).getTime();
    const timer = setInterval(() => {
      const left = deadline - (Date.now() + offsetRef.current);
      setRemaining(left);
      for (const mark of [5 * 60_000, 60_000]) {
        if (left <= mark && left > mark - 2_000 && !announcedRef.current.has(mark)) {
          announcedRef.current.add(mark);
          setAnnouncement(mark === 60_000 ? "Son 1 dakika." : "Son 5 dakika.");
        }
      }
      if (left <= 0 && !finishedRef.current) {
        setAnnouncement("Süre doldu. Deneme otomatik olarak tamamlanıyor.");
        void finish(true);
      }
      if (document.visibilityState === "visible" && !finishedRef.current) {
        const qid = questionsRef.current[indexRef.current]?.id;
        if (qid) {
          const prev = answersRef.current[qid] ?? { selectedLabel: null, flagged: false, timeSpentSeconds: 0 };
          const updated = { ...prev, timeSpentSeconds: prev.timeSpentSeconds + 1 };
          answersRef.current = { ...answersRef.current, [qid]: updated };
          setAnswers((a) => ({ ...a, [qid]: { ...(a[qid] ?? updated), timeSpentSeconds: updated.timeSpentSeconds } }));
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [deadlineIso, finish]);

  // Kaydedilmemiş cevap varken sayfadan çıkış uyarısı
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (pendingList(queueRef.current).length > 0) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= total) return;
      // Ayrılınan sorunun süresini kaydet
      const leaving = questions[index]!;
      const state = answersRef.current[leaving.id];
      if (state) {
        queueRef.current = enqueue(queueRef.current, { questionId: leaving.id, ...state });
        persistQueue();
        void flush();
      }
      setIndex(next);
      requestAnimationFrame(() => headingRef.current?.focus());
    },
    [flush, index, persistQueue, questions, total],
  );

  // Klavye kısayolları: A-E seçenek seçer (yazı alanında değilken)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || finishing) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) && (target as HTMLInputElement).type !== "radio") return;
      const key = e.key.toUpperCase();
      if ((OPTION_LABELS as readonly string[]).includes(key)) {
        e.preventDefault();
        record(current.id, { selectedLabel: key as OptionLabel });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current.id, finishing, record]);

  const stats = useMemo(() => {
    let answered = 0;
    const flagged: number[] = [];
    const blank: number[] = [];
    questions.forEach((q, i) => {
      const a = answers[q.id];
      if (a?.selectedLabel) answered += 1;
      else blank.push(i + 1);
      if (a?.flagged) flagged.push(i + 1);
    });
    return { answered, flagged, blank };
  }, [answers, questions]);

  const lowTime = remaining <= 5 * 60_000;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="sticky top-[61px] z-20 -mx-4 border-b border-brand-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Soru <span className="font-semibold text-zinc-900 dark:text-zinc-100">{index + 1}</span> / {total} · {stats.answered} cevaplandı
            </p>
          </div>
          <div
            role="timer"
            aria-label={`Kalan süre ${formatClock(remaining)}`}
            className={cn(
              "rounded-xl px-3 py-1.5 font-mono text-lg font-bold tabular-nums",
              lowTime ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100" : "bg-brand-100 text-brand-900 dark:bg-brand-900/40 dark:text-brand-100",
            )}
          >
            {formatClock(remaining)}
          </div>
        </div>
        <ProgressBar value={stats.answered} max={total} label="Cevaplanan soru oranı" className="mt-2" />
        <p className="sr-only" aria-live="assertive">
          {announcement}
        </p>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400" aria-live="polite">
          {saveStatus === "saving" ? "Kaydediliyor…" : saveStatus === "saved" ? "Cevapların kaydedildi." : saveStatus === "offline" ? "Bağlantı sorunu: cevapların bu cihazda saklanıyor, tekrar denenecek." : " "}
        </p>
      </div>

      <section aria-labelledby="soru-baslik" className="mt-5 rounded-2xl border border-brand-100 bg-white/95 p-5 dark:border-zinc-800 dark:bg-zinc-900/90 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="soru-baslik" ref={headingRef} tabIndex={-1} className="text-base font-semibold text-brand-800 dark:text-brand-200">
            {index + 1}. soru · {current.typeLabel}
          </h2>
          {currentAnswer.flagged ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">İşaretli</span> : null}
        </div>
        {current.passage ? (
          <div className="mt-4 whitespace-pre-line rounded-xl bg-brand-50 p-4 text-[16px] leading-relaxed text-zinc-900 dark:bg-zinc-800/60 dark:text-zinc-100" lang="en">
            {current.passage}
          </div>
        ) : null}
        <p className="mt-4 whitespace-pre-line text-[17px] font-medium leading-relaxed text-zinc-900 dark:text-zinc-50">{current.stem}</p>

        <fieldset className="mt-5">
          <legend className="sr-only">Seçenekler</legend>
          <div className="space-y-2.5">
            {current.options.map((o) => {
              const checked = currentAnswer.selectedLabel === o.label;
              return (
                <label
                  key={o.label}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 text-[16px] transition-colors",
                    checked
                      ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-900/30"
                      : "border-zinc-200 hover:border-brand-300 hover:bg-brand-50/50 dark:border-zinc-700 dark:hover:border-brand-700",
                  )}
                >
                  <input
                    type="radio"
                    name={`soru-${current.id}`}
                    value={o.label}
                    checked={checked}
                    disabled={finishing}
                    onChange={() => record(current.id, { selectedLabel: o.label as OptionLabel })}
                    className="mt-1 size-4 accent-brand-700"
                  />
                  <span>
                    <span className="font-bold">{o.label})</span> <span>{o.text}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">İpucu: Klavyede A–E tuşlarıyla seçenek seçebilirsin.</p>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button variant="secondary" onClick={() => goTo(index - 1)} disabled={index === 0 || finishing}>
            ← Önceki
          </Button>
          <Button variant="soft" aria-pressed={currentAnswer.flagged} onClick={() => record(current.id, { flagged: !currentAnswer.flagged })} disabled={finishing}>
            {currentAnswer.flagged ? "İşareti kaldır" : "Sonra dön (işaretle)"}
          </Button>
          <Button variant="ghost" onClick={() => record(current.id, { selectedLabel: null })} disabled={!currentAnswer.selectedLabel || finishing}>
            Boş bırak
          </Button>
          {index < total - 1 ? (
            <Button onClick={() => goTo(index + 1)} disabled={finishing}>
              Sonraki →
            </Button>
          ) : (
            <Button onClick={() => dialogRef.current?.showModal()} disabled={finishing}>
              Denemeyi bitir
            </Button>
          )}
        </div>
      </section>

      <nav aria-label="Soru listesi" className="mt-5 rounded-2xl border border-brand-100 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Sorular</h2>
        <ul className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-10">
          {questions.map((q, i) => {
            const a = answers[q.id];
            const state = a?.selectedLabel ? "cevaplandı" : "boş";
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={i === index ? "step" : undefined}
                  aria-label={`Soru ${i + 1}, ${state}${a?.flagged ? ", işaretli" : ""}`}
                  className={cn(
                    "relative flex size-11 items-center justify-center rounded-xl border-2 text-sm font-bold",
                    i === index ? "border-brand-700 dark:border-brand-300" : "border-transparent",
                    a?.selectedLabel ? "bg-brand-600 text-white dark:bg-brand-500 dark:text-zinc-950" : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
                  )}
                >
                  {i + 1}
                  {a?.flagged ? <span aria-hidden="true" className="absolute -right-1 -top-1 size-3 rounded-full bg-amber-500 ring-2 ring-white dark:ring-zinc-900" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Mor: cevaplandı · Gri: boş · Turuncu nokta: işaretli</p>
          <Button variant="secondary" onClick={() => dialogRef.current?.showModal()} disabled={finishing}>
            Denemeyi bitir
          </Button>
        </div>
      </nav>

      {finishError ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-900/30 dark:text-red-100">
          {finishError}
        </p>
      ) : null}

      <dialog ref={dialogRef} aria-labelledby="bitir-baslik" className="m-auto w-[min(92vw,28rem)] rounded-2xl border border-brand-100 bg-white p-6 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
        <h2 id="bitir-baslik" className="text-lg font-bold">
          Denemeyi bitirmek istiyor musun?
        </h2>
        <ul className="mt-3 space-y-1 text-[15px]">
          <li>Cevaplanan: {stats.answered} / {total}</li>
          <li>Boş: {stats.blank.length}{stats.blank.length > 0 ? ` (soru ${stats.blank.slice(0, 10).join(", ")}${stats.blank.length > 10 ? "…" : ""})` : ""}</li>
          <li>İşaretli: {stats.flagged.length}{stats.flagged.length > 0 ? ` (soru ${stats.flagged.join(", ")})` : ""}</li>
          <li>Kalan süre: {formatClock(remaining)}</li>
        </ul>
        <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">Bitirdikten sonra cevaplarını değiştiremezsin.</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => dialogRef.current?.close()} autoFocus>
            Devam et
          </Button>
          <Button
            onClick={() => {
              dialogRef.current?.close();
              void finish(false);
            }}
            disabled={finishing}
          >
            {finishing ? "Tamamlanıyor…" : "Evet, bitir"}
          </Button>
        </div>
      </dialog>
    </div>
  );
}
