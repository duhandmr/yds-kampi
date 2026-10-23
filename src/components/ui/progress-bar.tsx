import { cn } from "./cn";

export function ProgressBar({
  value,
  max = 100,
  label,
  className,
  tone = "brand",
}: {
  value: number;
  max?: number;
  label: string;
  className?: string;
  tone?: "brand" | "success" | "warning";
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  const bar = tone === "success" ? "bg-emerald-600" : tone === "warning" ? "bg-amber-500" : "bg-gradient-to-r from-brand-600 to-blush-600";
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-brand-100 dark:bg-zinc-800", className)}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-500", bar)} style={{ width: `${pct}%` }} />
    </div>
  );
}
