"use client";

import { useActionState } from "react";
import { changePasswordAction, deleteMyDataAction, type FormState } from "@/app/actions/profile";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function ChangePasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changePasswordAction, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
      <Field label="Mevcut parola" htmlFor="currentPassword" error={state.errors?.currentPassword}>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </Field>
      <Field label="Yeni parola" htmlFor="newPassword" error={state.errors?.newPassword} hint="En az 12 karakter; büyük harf, küçük harf ve rakam içermeli.">
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required minLength={12} />
      </Field>
      <Field label="Yeni parola (tekrar)" htmlFor="confirmPassword" error={state.errors?.confirmPassword}>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
      </Field>
      <SubmitButton pendingText="Güncelleniyor…">Parolayı güncelle</SubmitButton>
    </form>
  );
}

export function DeleteDataForm() {
  const [state, action] = useActionState<FormState, FormData>(deleteMyDataAction, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <Alert tone="warning">
        Denemelerin, konu performansın, kelime listen ve önerilerin gizlenir ve kamp baştan başlar. Kayıtlar 30 gün boyunca geri getirilebilir; sonrasında yönetici tarafından kalıcı olarak silinir.
      </Alert>
      <Field label="Onaylamak için SİL yaz" htmlFor="confirmation" error={state.errors?.confirmation}>
        <Input id="confirmation" name="confirmation" autoComplete="off" required />
      </Field>
      <SubmitButton variant="danger" pendingText="Siliniyor…">
        Çalışma verilerimi sil
      </SubmitButton>
    </form>
  );
}
