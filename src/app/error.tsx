"use client";

import { Button } from "@/components/ui/button";

/** Hata ayrıntıları (yığın izi, anahtar, sorgu) kullanıcıya gösterilmez. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="ana-icerik" className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">Bir şeyler ters gitti</h1>
      <p className="mt-2 text-zinc-700 dark:text-zinc-300">İşlem şu anda tamamlanamadı. Deneme cevapların kayıtlı; lütfen tekrar dene.</p>
      <Button className="mt-6" onClick={() => reset()}>
        Tekrar dene
      </Button>
    </main>
  );
}
