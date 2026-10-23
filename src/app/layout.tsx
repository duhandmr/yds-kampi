import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Yaren'in YDS Kampı", template: "%s · Yaren'in YDS Kampı" },
  description: "Yaren'in YDS hazırlığı için kişiselleştirilmiş günlük çalışma kampı.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f3ff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

// Tema tercihi ilk boyamadan önce uygulanır (yanıp sönmeyi önler).
const themeScript = `(function(){try{var t=localStorage.getItem('yds-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans">
        <a
          href="#ana-icerik"
          className="sr-only-focusable fixed left-3 top-3 z-50 rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white"
        >
          Ana içeriğe geç
        </a>
        {children}
      </body>
    </html>
  );
}
