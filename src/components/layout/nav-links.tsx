"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../ui/cn";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <ul className="hidden items-center gap-1 md:flex">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-xl px-3 text-[15px] font-semibold",
                active ? "bg-brand-100 text-brand-900 dark:bg-brand-900/50 dark:text-brand-100" : "text-zinc-700 hover:bg-brand-50 dark:text-zinc-300 dark:hover:bg-zinc-800",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Mobilde başparmakla erişilebilen alt gezinme çubuğu. */
export function MobileNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Alt gezinme" className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 md:hidden">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold",
                  active ? "text-brand-800 dark:text-brand-200" : "text-zinc-600 dark:text-zinc-400",
                )}
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
