import type { ReactNode } from "react";

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-white/60 p-6 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
      {children ? <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{children}</div> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
