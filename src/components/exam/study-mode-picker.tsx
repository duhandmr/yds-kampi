"use client";

import { useActionState } from "react";
import { prepareExamAction, type ActionMessage } from "@/app/actions/exam";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";

export interface StudyMode {
  kind: "QUICK" | "DAILY" | "INTENSIVE" | "FULL";
  title: string;
  description: string;
  count: number;
  minutes: number;
  status: "new" | "ready" | "in-progress" | "completed";
  disabled?: boolean;
  recommended?: boolean;
}

const STATUS_TEXT: Record<StudyMode["status"], string> = {
  new: "Hazırla",
  ready: "Hazırlığa devam et",
  "in-progress": "Denemeye devam et",
  completed: "Sonucu gör",
};

export function StudyModePicker({ modes }: { modes: StudyMode[] }) {
  const [state, action] = useActionState<ActionMessage, FormData>(prepareExamAction, {});
  return (
    <div className="space-y-4">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <ul className="grid gap-4 sm:grid-cols-2">
        {modes.map((m) => (
          <li
            key={m.kind}
            className={`flex flex-col rounded-2xl border bg-white/90 p-5 dark:bg-zinc-900/80 ${
              m.recommended ? "border-brand-400 ring-2 ring-brand-200 dark:border-brand-500 dark:ring-brand-900" : "border-brand-100 dark:border-zinc-800"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{m.title}</h2>
              {m.recommended ? <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800 dark:bg-brand-900/50 dark:text-brand-200">Önerilen</span> : null}
            </div>
            <p className="mt-1 flex-1 text-[15px] text-zinc-700 dark:text-zinc-300">{m.description}</p>
            <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {m.count} soru · {m.minutes} dakika
            </p>
            <form action={action} className="mt-4">
              <input type="hidden" name="kind" value={m.kind} />
              <SubmitButton variant={m.recommended ? "primary" : "secondary"} className="w-full" pendingText="Hazırlanıyor…">
                {m.disabled ? "Şu anda kapalı" : STATUS_TEXT[m.status]}
              </SubmitButton>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
