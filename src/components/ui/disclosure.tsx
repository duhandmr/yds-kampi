import type { ReactNode } from "react";
import { cn } from "./cn";

/** Yerel <details> ile erişilebilir açılır bölüm (klavye ve ekran okuyucu desteği yerleşiktir). */
export function Disclosure({ summary, children, defaultOpen, className }: { summary: ReactNode; children: ReactNode; defaultOpen?: boolean; className?: string }) {
  return (
    <details open={defaultOpen} className={cn("group rounded-xl border border-brand-100 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/60", className)}>
      <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3 font-semibold text-zinc-900 hover:bg-brand-50 dark:text-zinc-100 dark:hover:bg-zinc-800">
        <span>{summary}</span>
        <span aria-hidden="true" className="text-brand-700 transition-transform group-open:rotate-180 dark:text-brand-300">
          ▾
        </span>
      </summary>
      <div className="px-4 pb-4 pt-1 text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200">{children}</div>
    </details>
  );
}
