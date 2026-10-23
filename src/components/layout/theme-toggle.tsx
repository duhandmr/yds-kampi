"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("yds-theme", next ? "dark" : "light");
    } catch {
      // depolama kapalıysa tema yalnızca bu oturumda geçerli olur
    }
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark ?? undefined}
      aria-label={dark ? "Açık temaya geç" : "Koyu temaya geç"}
      className="inline-flex size-11 items-center justify-center rounded-xl text-brand-800 hover:bg-brand-100 dark:text-brand-200 dark:hover:bg-zinc-800"
    >
      <span aria-hidden="true" className="text-lg">
        {dark ? "☀" : "☾"}
      </span>
    </button>
  );
}
