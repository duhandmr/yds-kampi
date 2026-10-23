/** Erişilebilir yatay çubuk listesi: her satırda metin etiketi ve yüzde birlikte gösterilir (yalnızca renge dayanmaz). */
export function BarList({ items, caption }: { items: Array<{ label: string; percent: number; detail?: string }>; caption: string }) {
  return (
    <figure>
      <figcaption className="sr-only">{caption}</figcaption>
      <ul className="space-y-3">
        {items.map((it) => {
          const tone = it.percent >= 75 ? "bg-emerald-600" : it.percent >= 50 ? "bg-brand-600" : "bg-amber-500";
          return (
            <li key={it.label}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{it.label}</span>
                <span className="tabular-nums text-zinc-700 dark:text-zinc-300">
                  %{it.percent}
                  {it.detail ? <span className="ml-1 text-zinc-500 dark:text-zinc-400">({it.detail})</span> : null}
                </span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800" aria-hidden="true">
                <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(2, it.percent)}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
