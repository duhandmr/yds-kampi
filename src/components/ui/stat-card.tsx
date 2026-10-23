import type { ReactNode } from "react";

export function StatCard({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
        {icon ? <span aria-hidden="true">{icon}</span> : null}
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{value}</div>
      {hint ? <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">{hint}</p> : null}
    </div>
  );
}
