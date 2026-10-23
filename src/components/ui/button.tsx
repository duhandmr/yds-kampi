import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "soft";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand-700 text-white shadow-sm hover:bg-brand-800 disabled:bg-brand-300 dark:bg-brand-500 dark:hover:bg-brand-400 dark:text-zinc-950",
  secondary:
    "border border-brand-200 bg-white text-brand-800 hover:bg-brand-50 dark:border-brand-800 dark:bg-zinc-900 dark:text-brand-200 dark:hover:bg-zinc-800",
  ghost: "text-brand-800 hover:bg-brand-100 dark:text-brand-200 dark:hover:bg-zinc-800",
  danger: "bg-red-700 text-white hover:bg-red-800 disabled:bg-red-300",
  soft: "bg-brand-100 text-brand-900 hover:bg-brand-200 dark:bg-brand-900/40 dark:text-brand-100 dark:hover:bg-brand-900/60",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-4 text-[15px]",
  lg: "min-h-12 px-6 text-base",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
