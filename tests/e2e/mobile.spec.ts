import { expect, test } from "@playwright/test";

/**
 * Uçtan uca testler (mobil, tablet ve masaüstü projelerinde çalışır).
 * Çalışan bir uygulama ve test veritabanında bir öğrenci hesabı gerektirir:
 *   E2E_USERNAME=... E2E_PASSWORD=... npm run test:e2e
 * Hesap seviye belirlemeyi tamamlamış olmalıdır.
 */
const username = process.env.E2E_USERNAME;
const password = process.env.E2E_PASSWORD;

test("oturumu olmayan kullanıcı korunan sayfaya giremez", async ({ page }) => {
  await page.goto("/panel");
  await expect(page).toHaveURL(/\/giris/);
  await expect(page.getByRole("heading", { name: "Tekrar hoş geldin" })).toBeVisible();
});

test("karşılama sayfası temel bilgileri ve butonları gösterir", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("YDS Kampı");
  await expect(page.getByRole("link", { name: "Kampa Başla" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Nasıl Çalışıyor?" })).toBeVisible();
});

test.describe("giriş yapmış öğrenci", () => {
  test.skip(!username || !password, "E2E_USERNAME ve E2E_PASSWORD tanımlı değil");

  test("hızlı çalışmayı mobilde baştan sona tamamlayabilir", async ({ page }) => {
    await page.goto("/giris");
    await page.getByLabel("Kullanıcı adı").fill(username!);
    await page.getByLabel("Parola").fill(password!);
    await page.getByRole("button", { name: "Giriş yap" }).click();
    await expect(page.getByRole("heading", { name: /Merhaba/ })).toBeVisible();

    await page.goto("/calisma");
    const quick = page.locator("li", { has: page.getByRole("heading", { name: "Hızlı çalışma" }) });
    await quick.getByRole("button").click();
    await expect(page.getByText("Aşama 1 · Hazırlık")).toBeVisible();

    const start = page.getByRole("button", { name: /Denemeyi başlat|Denemeye dön/ });
    if (await start.isVisible()) {
      await start.click();
    }
    if (page.url().includes("/sonuc")) return; // bugün zaten tamamlanmış

    await expect(page.getByRole("timer")).toBeVisible();
    await page.getByRole("radio").first().check();
    await expect(page.getByText("Cevapların kaydedildi.")).toBeVisible();
    await page.getByRole("button", { name: /Sonra dön/ }).click();
    await page.getByRole("navigation", { name: "Soru listesi" }).getByRole("button", { name: "Denemeyi bitir" }).click();
    await page.getByRole("button", { name: "Evet, bitir" }).click();
    await expect(page).toHaveURL(/\/sonuc$/);
    await expect(page.getByText("Doğru", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Soru soru açıklamalar" })).toBeVisible();
  });
});
