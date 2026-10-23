"use client";

import { useActionState } from "react";
import { saveSettingsAction, type AdminFormState } from "@/app/actions/admin";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { QUESTION_TYPES, QUESTION_TYPE_LABELS, type QuestionTypeKey } from "@/lib/constants";

export interface SettingsValues {
  campStartDate: string;
  examDate: string;
  dailyQuestionCount: number;
  dailyDurationMinutes: number;
  quickQuestionCount: number;
  quickDurationMinutes: number;
  intensiveQuestionCount: number;
  intensiveDurationMinutes: number;
  fullMockEnabled: boolean;
  fullMockQuestionCount: number;
  fullMockDurationMinutes: number;
  placementQuestionCount: number;
  placementDurationMinutes: number;
  aiEnabled: boolean;
  aiAutoPublish: boolean;
  weights: Record<QuestionTypeKey, number>;
}

function NumberField({ name, label, value, error }: { name: string; label: string; value: number; error?: string }) {
  return (
    <Field label={label} htmlFor={name} error={error}>
      <Input id={name} name={name} type="number" inputMode="numeric" defaultValue={value} required />
    </Field>
  );
}

function Toggle({ name, label, checked, hint }: { name: string; label: string; checked: boolean; hint?: string }) {
  return (
    <div className="flex items-start gap-3">
      <input id={name} name={name} type="checkbox" defaultChecked={checked} className="mt-1 size-5 accent-brand-700" aria-describedby={hint ? `${name}-ipucu` : undefined} />
      <div>
        <label htmlFor={name} className="font-semibold">
          {label}
        </label>
        {hint ? (
          <p id={`${name}-ipucu`} className="text-sm text-zinc-600 dark:text-zinc-400">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function SettingsForm({ values, aiConfigured }: { values: SettingsValues; aiConfigured: boolean }) {
  const [state, action] = useActionState<AdminFormState, FormData>(saveSettingsAction, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-6" noValidate>
      {state.message ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-lg font-semibold">Kamp takvimi</legend>
        <Field label="Kamp başlangıç tarihi" htmlFor="campStartDate" error={e.campStartDate}>
          <Input id="campStartDate" name="campStartDate" type="date" defaultValue={values.campStartDate} required />
        </Field>
        <Field label="Sınav tarihi" htmlFor="examDate" error={e.examDate}>
          <Input id="examDate" name="examDate" type="date" defaultValue={values.examDate} />
        </Field>
      </fieldset>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-lg font-semibold">Deneme ayarları</legend>
        <NumberField name="dailyQuestionCount" label="Günlük deneme · soru" value={values.dailyQuestionCount} error={e.dailyQuestionCount} />
        <NumberField name="dailyDurationMinutes" label="Günlük deneme · dakika" value={values.dailyDurationMinutes} error={e.dailyDurationMinutes} />
        <NumberField name="quickQuestionCount" label="Hızlı çalışma · soru" value={values.quickQuestionCount} error={e.quickQuestionCount} />
        <NumberField name="quickDurationMinutes" label="Hızlı çalışma · dakika" value={values.quickDurationMinutes} error={e.quickDurationMinutes} />
        <NumberField name="intensiveQuestionCount" label="Yoğun çalışma · soru" value={values.intensiveQuestionCount} error={e.intensiveQuestionCount} />
        <NumberField name="intensiveDurationMinutes" label="Yoğun çalışma · dakika" value={values.intensiveDurationMinutes} error={e.intensiveDurationMinutes} />
        <NumberField name="fullMockQuestionCount" label="Tam prova · soru" value={values.fullMockQuestionCount} error={e.fullMockQuestionCount} />
        <NumberField name="fullMockDurationMinutes" label="Tam prova · dakika" value={values.fullMockDurationMinutes} error={e.fullMockDurationMinutes} />
        <NumberField name="placementQuestionCount" label="Seviye belirleme · soru" value={values.placementQuestionCount} error={e.placementQuestionCount} />
        <NumberField name="placementDurationMinutes" label="Seviye belirleme · dakika" value={values.placementDurationMinutes} error={e.placementDurationMinutes} />
        <div className="sm:col-span-2">
          <Toggle name="fullMockEnabled" label="Tam provayı etkinleştir" checked={values.fullMockEnabled} />
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-1 text-lg font-semibold">Konu dağılımı (soru tipi ağırlıkları)</legend>
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
          0-10 arası ağırlık. Gerçek dağılım, bu temel ağırlıkların Yaren&apos;in zayıf olduğu tiplerde otomatik artırılmasıyla belirlenir. 0 verilen tip denemelere eklenmez.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUESTION_TYPES.map((t) => (
            <Field key={t} label={QUESTION_TYPE_LABELS[t]} htmlFor={`weight_${t}`} error={e[`topicWeights.${t}`]}>
              <Input id={`weight_${t}`} name={`weight_${t}`} type="number" step="0.5" min={0} max={10} defaultValue={values.weights[t]} />
            </Field>
          ))}
        </div>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="mb-1 text-lg font-semibold">Yapay zekâ</legend>
        {!aiConfigured ? <Alert tone="info">Sunucuda yapay zekâ sağlayıcısı yapılandırılmamış. Bu ayarlar, ortam değişkenleri tanımlanınca etkili olur.</Alert> : null}
        <Toggle name="aiEnabled" label="Yapay zekâ özelliklerini kullan" checked={values.aiEnabled} hint="Soru üretimi, deneme sonrası değerlendirme ve kelime açıklamaları." />
        <Toggle
          name="aiAutoPublish"
          label="Kalite kontrolünden geçen üretilmiş soruları otomatik yayımla"
          checked={values.aiAutoPublish}
          hint="Kapalıyken üretilen sorular yönetici incelemesi bekler (önerilen)."
        />
      </fieldset>
      <SubmitButton size="lg">Ayarları kaydet</SubmitButton>
    </form>
  );
}
