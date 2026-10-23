import type { RoleKey } from "../constants";

/** Erişim kuralları (saf fonksiyonlar). Middleware ve sunucu tarafı kontrolleri bu kuralları paylaşır. */

export const SESSION_COOKIE_NAME = "yds_session";

const PUBLIC_EXACT = new Set(["/", "/giris"]);
const PUBLIC_PREFIXES = ["/_next", "/favicon", "/icon", "/robots.txt", "/api/health", "/api/cron"];

export type PathClass = "public" | "user" | "admin";

export function classifyPath(pathname: string): PathClass {
  if (PUBLIC_EXACT.has(pathname)) return "public";
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(p))) return "public";
  if (pathname === "/yonetim" || pathname.startsWith("/yonetim/") || pathname.startsWith("/api/admin")) return "admin";
  return "user";
}

export function roleSatisfies(role: RoleKey | null | undefined, required: PathClass): boolean {
  if (required === "public") return true;
  if (!role) return false;
  if (required === "admin") return role === "ADMIN";
  return role === "USER" || role === "ADMIN";
}

export type MiddlewareDecision = { action: "next" } | { action: "redirect"; to: string } | { action: "unauthorized" };

/**
 * Middleware yalnızca oturum çerezinin varlığına bakar (Edge'de veritabanı yoktur).
 * Asıl doğrulama her sayfa, server action ve API route'ta sunucu tarafında tekrar yapılır.
 */
export function middlewareDecision(pathname: string, hasSessionCookie: boolean): MiddlewareDecision {
  const cls = classifyPath(pathname);
  if (cls === "public") return { action: "next" };
  if (hasSessionCookie) return { action: "next" };
  if (pathname.startsWith("/api/")) return { action: "unauthorized" };
  return { action: "redirect", to: `/giris?next=${encodeURIComponent(pathname)}` };
}

/** Açık yönlendirme (open redirect) açığını önlemek için yalnızca uygulama içi yollar kabul edilir. */
export function safeNextPath(next: string | null | undefined, fallback = "/panel"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
