import type { ReactNode } from "react";
import { cn } from "./cn";

export type BadgeTone = "brand" | "success" | "warning" | "danger" | "neutral" | "blush";

const TONES: Record<BadgeTone, string> = {
  brand: "bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  blush: "bg-blush-100 text-blush-700 dark:bg-blush-700/30 dark:text-blush-200",
};

export function Badge({ children, tone = "brand", className }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", TONES[tone], className)}>{children}</span>;
}
