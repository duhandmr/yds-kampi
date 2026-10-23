import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="ana-icerik" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">Sayfa bulunamadı</h1>
      <p className="mt-2 text-zinc-700 dark:text-zinc-300">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
      <ButtonLink href="/panel" className="mt-6">
        Panele dön
      </ButtonLink>
    </main>
  );
}
