"use client";

import { useActionState, useMemo, useState } from "react";
import { enrichVocabularyAction, generateQuestionsAction, type AdminFormState } from "@/app/actions/admin";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { DIFFICULTIES, DIFFICULTY_LABELS, QUESTION_TYPES, QUESTION_TYPE_LABELS, type QuestionTypeKey } from "@/lib/constants";

export function GenerationForm({ topics }: { topics: Array<{ slug: string; name: string; questionType: string }> }) {
  const [state, action] = useActionState<AdminFormState, FormData>(generateQuestionsAction, {});
  const [vocabState, vocabAction] = useActionState<AdminFormState>(enrichVocabularyAction, {});
  const [type, setType] = useState<QuestionTypeKey>("VOCABULARY");
  const topicOptions = useMemo(() => topics.filter((t) => t.questionType === type), [topics, type]);

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-4" noValidate>
        {state.message ? <Alert tone={state.ok ? "success" : "warning"}>{state.message}</Alert> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Soru tipi" htmlFor="gen-type">
            <Select id="gen-type" name="type" value={type} onChange={(e) => setType(e.target.value as QuestionTypeKey)}>
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {QUESTION_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Konu" htmlFor="gen-topic">
            <Select id="gen-topic" name="topicSlug" key={type}>
              {topicOptions.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Zorluk" htmlFor="gen-difficulty">
            <Select id="gen-difficulty" name="difficulty" defaultValue="MEDIUM">
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABELS[d]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Adet (en fazla 10)" htmlFor="gen-count">
            <Input id="gen-count" name="count" type="number" min={1} max={10} defaultValue={5} />
          </Field>
        </div>
        <SubmitButton pendingText="Üretiliyor ve doğrulanıyor… (bu işlem bir dakika sürebilir)">Soru üretimini başlat</SubmitButton>
      </form>
      <form action={vocabAction} className="space-y-3 border-t border-brand-100 pt-5 dark:border-zinc-800">
        {vocabState.message ? <Alert tone={vocabState.ok ? "success" : "info"}>{vocabState.message}</Alert> : null}
        <p className="text-sm text-zinc-700 dark:text-zinc-300">Örnek cümlesi eksik kelimeleri yapay zekâ ile tamamla (çıktı şema doğrulamasından geçmeden kaydedilmez).</p>
        <SubmitButton variant="secondary" pendingText="Tamamlanıyor…">
          Kelime açıklamalarını tamamla
        </SubmitButton>
      </form>
    </div>
  );
}
