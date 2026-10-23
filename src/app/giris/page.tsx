import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/access";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Giriş" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  const { next } = await searchParams;
  if (user) redirect(safeNextPath(next, user.role === "ADMIN" ? "/yonetim" : "/panel"));

  return (
    <main id="ana-icerik" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-3xl border border-brand-100 bg-white/90 p-6 shadow-lg shadow-brand-100/50 dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-none sm:p-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Tekrar hoş geldin</h1>
        <p className="mt-1 text-[15px] text-zinc-700 dark:text-zinc-300">Kampa devam etmek için giriş yap.</p>
        <LoginForm next={safeNextPath(next, "")} />
      </div>
    </main>
  );
}
