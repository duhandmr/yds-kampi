import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, middlewareDecision } from "@/lib/auth/access";

/**
 * İlk savunma hattı: oturum çerezi olmayan istekleri korunan sayfalardan uzak tutar.
 * Asıl yetkilendirme (oturum geçerliliği, rol) her sayfa, server action ve API route'ta
 * sunucu tarafında veritabanı üzerinden tekrar yapılır.
 */
export function middleware(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const decision = middlewareDecision(request.nextUrl.pathname, hasSession);
  if (decision.action === "redirect") {
    return NextResponse.redirect(new URL(decision.to, request.url));
  }
  if (decision.action === "unauthorized") {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)"],
};
