import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm shadow-brand-100/40 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 dark:shadow-none sm:p-6",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <h2 id={id} className={cn("text-lg font-semibold text-zinc-900 dark:text-zinc-50", className)}>
      {children}
    </h2>
  );
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mt-1 text-sm text-zinc-600 dark:text-zinc-400", className)}>{children}</p>;
}
