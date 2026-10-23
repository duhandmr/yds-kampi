"use client";

import { useActionState } from "react";
import { saveQuestionAction, type AdminFormState } from "@/app/actions/admin";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  OPTION_LABELS,
  QUALITY_STATUSES,
  QUALITY_STATUS_LABELS,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
} from "@/lib/constants";
import type { QuestionDraft } from "@/lib/questions/types";

export interface QuestionFormValues extends QuestionDraft {
  id?: string;
  status: (typeof QUALITY_STATUSES)[number];
}

function keywordsToText(keywords: QuestionDraft["keywords"]): string {
  return keywords
    .map((k) => [k.term, k.meaningTr, k.partOfSpeech, k.exampleEn ?? "", k.exampleTr ?? "", (k.synonyms ?? []).join(", "), (k.antonyms ?? []).join(", ")].join(" | "))
    .join("\n");
}

export function QuestionForm({ initial, topics }: { initial?: QuestionFormValues; topics: Array<{ slug: string; name: string; questionType: string }> }) {
  const [state, action] = useActionState<AdminFormState, FormData>(saveQuestionAction, {});
  const e = state.errors ?? {};
  const v = initial;

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
      {state.issues && state.issues.length > 0 ? (
        <Alert tone="warning" title="Kalite kontrolü">
          <ul className="list-disc pl-5">
            {state.issues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </Alert>
      ) : null}
      {v?.id ? <input type="hidden" name="id" value={v.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Soru tipi" htmlFor="type" error={e.type}>
          <Select id="type" name="type" defaultValue={v?.type ?? "VOCABULARY"}>
            {QUESTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {QUESTION_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Konu" htmlFor="topicSlug" error={e.topicSlug} hint="Konu, seçilen soru tipine ait olmalıdır.">
          <Select id="topicSlug" name="topicSlug" defaultValue={v?.topicSlug ?? topics[0]?.slug}>
            {topics.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name} ({QUESTION_TYPE_LABELS[t.questionType as keyof typeof QUESTION_TYPE_LABELS]})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Alt konu" htmlFor="subtopic" error={e.subtopic}>
          <Input id="subtopic" name="subtopic" defaultValue={v?.subtopic} required />
        </Field>
        <Field label="Zorluk" htmlFor="difficulty" error={e.difficulty}>
          <Select id="difficulty" name="difficulty" defaultValue={v?.difficulty ?? "MEDIUM"}>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_LABELS[d]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Paragraf / diyalog (gerekiyorsa)" htmlFor="passage" error={e.passage} hint="Boşluklar '----' ile gösterilir. İlgisiz cümle sorularında (I)-(V) işaretlerini kullanın.">
        <Textarea id="passage" name="passage" rows={5} defaultValue={v?.passage ?? ""} />
      </Field>
      <Field label="Soru kökü" htmlFor="stem" error={e.stem}>
        <Textarea id="stem" name="stem" rows={3} defaultValue={v?.stem} required />
      </Field>

      <fieldset className="space-y-3 rounded-2xl border border-brand-100 p-4 dark:border-zinc-800">
        <legend className="px-1 font-semibold">Seçenekler ve gerekçeler</legend>
        {OPTION_LABELS.map((label, i) => {
          const opt = v?.options.find((o) => o.label === label);
          return (
            <div key={label} className="grid gap-2 sm:grid-cols-2">
              <Field label={`${label} seçeneği`} htmlFor={`option${label}`} error={e[`options.${i}.text`]}>
                <Input id={`option${label}`} name={`option${label}`} defaultValue={opt?.text} required />
              </Field>
              <Field label={`${label} gerekçesi`} htmlFor={`rationale${label}`} error={e[`options.${i}.rationale`]} hint={i === 0 ? "Doğru seçenek 'Doğru:', diğerleri 'Yanlış:' ile başlamalı." : undefined}>
                <Input id={`rationale${label}`} name={`rationale${label}`} defaultValue={opt?.rationale} required />
              </Field>
            </div>
          );
        })}
        <Field label="Doğru cevap" htmlFor="correctLabel" error={e.correctLabel}>
          <Select id="correctLabel" name="correctLabel" defaultValue={v?.correctLabel ?? "A"}>
            {OPTION_LABELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
      </fieldset>

      <Field label="Açıklama" htmlFor="explanation" error={e.explanation} hint="'Doğru cevap X.' ifadesiyle başlamalı ve cevap anahtarıyla tutarlı olmalı.">
        <Textarea id="explanation" name="explanation" rows={4} defaultValue={v?.explanation} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Çözüm stratejisi" htmlFor="strategy" error={e.strategy}>
          <Textarea id="strategy" name="strategy" rows={3} defaultValue={v?.strategy} required />
        </Field>
        <Field label="Benzer sorularda dikkat" htmlFor="tip" error={e.tip}>
          <Textarea id="tip" name="tip" rows={3} defaultValue={v?.tip} required />
        </Field>
      </div>
      <Field
        label="Önemli kelimeler"
        htmlFor="keywords"
        error={e.keywords}
        hint="Her satıra bir kelime: terim | Türkçe anlam | tür | örnek İngilizce | örnek Türkçe | eş1, eş2 | zıt1, zıt2"
      >
        <Textarea id="keywords" name="keywords" rows={4} defaultValue={v ? keywordsToText(v.keywords) : ""} required />
      </Field>
      <Field label="Durum" htmlFor="status" error={e.status} hint="Yayında durumu yalnızca kalite kontrolünden geçen sorular için kaydedilir.">
        <Select id="status" name="status" defaultValue={v?.status ?? "PENDING_REVIEW"}>
          {QUALITY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {QUALITY_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </Field>
      <SubmitButton size="lg" pendingText="Kaydediliyor…">
        Soruyu kaydet
      </SubmitButton>
    </form>
  );
}
