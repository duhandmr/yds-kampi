import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";
import { DesktopNav, MobileNav, type NavItem } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

const LEARNER_NAV: NavItem[] = [
  { href: "/panel", label: "Panel", icon: "⌂" },
  { href: "/calisma", label: "Çalışma", icon: "✎" },
  { href: "/kelimeler", label: "Kelimeler", icon: "Aa" },
  { href: "/profil", label: "Profil", icon: "☺" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/yonetim", label: "Genel", icon: "◎" },
  { href: "/yonetim/sorular", label: "Sorular", icon: "?" },
  { href: "/yonetim/uretim", label: "Üretim", icon: "✦" },
  { href: "/yonetim/ayarlar", label: "Ayarlar", icon: "⚙" },
  { href: "/yonetim/disa-aktar", label: "Dışa aktar", icon: "⇩" },
];

export function AppShell({ children, variant = "learner" }: { children: ReactNode; variant?: "learner" | "admin" }) {
  const items = variant === "admin" ? ADMIN_NAV : LEARNER_NAV;
  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-brand-100/80 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
        <nav aria-label="Ana gezinme" className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
          <Link href={variant === "admin" ? "/yonetim" : "/panel"} className="flex min-h-11 items-center gap-2 rounded-xl font-bold text-brand-900 dark:text-brand-100">
            <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-brand-600 to-blush-600 text-sm text-white">
              Y
            </span>
            <span className="hidden sm:inline">{variant === "admin" ? "YDS Kampı · Yönetim" : "Yaren'in YDS Kampı"}</span>
          </Link>
          <DesktopNav items={items} />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <form action={logoutAction}>
              <button type="submit" className="min-h-11 rounded-xl px-3 text-sm font-semibold text-zinc-700 hover:bg-brand-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
                Çıkış
              </button>
            </form>
          </div>
        </nav>
      </header>
      <main id="ana-icerik" className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {children}
      </main>
      <MobileNav items={items} />
    </div>
  );
}
