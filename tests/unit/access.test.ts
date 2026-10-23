import { describe, expect, it } from "vitest";
import { classifyPath, middlewareDecision, roleSatisfies, safeNextPath } from "@/lib/auth/access";

describe("Erişim kontrolü", () => {
  it("oturumu olmayan kullanıcı korunan sayfalara erişemez ve girişe yönlendirilir", () => {
    for (const path of ["/panel", "/calisma", "/deneme/abc", "/kelimeler", "/profil", "/yonetim", "/yonetim/sorular"]) {
      const d = middlewareDecision(path, false);
      expect(d.action).toBe("redirect");
      if (d.action === "redirect") expect(d.to.startsWith("/giris?next=")).toBe(true);
    }
  });

  it("oturumu olmayan API isteği 401 alır", () => {
    expect(middlewareDecision("/api/me/export", false).action).toBe("unauthorized");
    expect(middlewareDecision("/api/admin/export", false).action).toBe("unauthorized");
  });

  it("herkese açık sayfalar oturum gerektirmez", () => {
    expect(middlewareDecision("/", false).action).toBe("next");
    expect(middlewareDecision("/giris", false).action).toBe("next");
    expect(middlewareDecision("/api/health", false).action).toBe("next");
  });

  it("yönetici sayfaları yalnızca ADMIN rolüne açıktır", () => {
    expect(classifyPath("/yonetim/ayarlar")).toBe("admin");
    expect(classifyPath("/api/admin/export")).toBe("admin");
    expect(roleSatisfies("USER", "admin")).toBe(false);
    expect(roleSatisfies("ADMIN", "admin")).toBe(true);
    expect(roleSatisfies(null, "user")).toBe(false);
    expect(roleSatisfies("USER", "user")).toBe(true);
  });

  it("açık yönlendirme (open redirect) engellenir", () => {
    expect(safeNextPath("https://kotu.example.com")).toBe("/panel");
    expect(safeNextPath("//kotu.example.com")).toBe("/panel");
    expect(safeNextPath("/\\kotu")).toBe("/panel");
    expect(safeNextPath("/kelimeler")).toBe("/kelimeler");
  });
});
