"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="mt-6 space-y-4" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <input type="hidden" name="next" value={next} />
      <Field label="Kullanıcı adı" htmlFor="username">
        <Input id="username" name="username" autoComplete="username" required minLength={3} maxLength={40} autoCapitalize="none" spellCheck={false} />
      </Field>
      <Field label="Parola" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton className="w-full" size="lg" pendingText="Giriş yapılıyor…">
        Giriş yap
      </SubmitButton>
    </form>
  );
}
