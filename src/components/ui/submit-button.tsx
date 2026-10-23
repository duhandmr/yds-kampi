"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonSize, type ButtonVariant } from "./button";

export function SubmitButton({
  children,
  pendingText = "Kaydediliyor…",
  variant = "primary",
  size = "md",
  className,
  name,
  value,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} className={className} disabled={pending} aria-disabled={pending} name={name} value={value}>
      {pending ? pendingText : children}
    </Button>
  );
}
