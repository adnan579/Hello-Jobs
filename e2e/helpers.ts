import { expect, type Page } from "@playwright/test";

/** A unique, valid Indian mobile number per call, so re-runs never collide. */
export function uniquePhone(): string {
  const digits = String(Math.floor(Math.random() * 1e9)).padStart(9, "0");
  return `9${digits}`;
}

export const runId = Date.now().toString(36);

/** Seeded demo accounts (prisma/seed.ts). */
export const SEED = {
  admin: "9000000000",
  verifiedFactory: "9000000001",
  workerRamesh: "9000000101",
};

/**
 * Log in through the real UI. In development (and on the private test site) the OTP is echoed on screen, which
 * is what makes this possible without an SMS provider.
 */
export async function login(page: Page, phone: string, role: "WORKER" | "EMPLOYER" = "WORKER") {
  await page.goto(`/login?role=${role}`);
  await page.getByLabel("Mobile number").fill(phone);
  await page.getByRole("button", { name: "Send code" }).click();

  const hint = page.locator("p", { hasText: "Test mode" });
  await expect(hint).toBeVisible();
  const code = (await hint.locator("strong").textContent())?.trim() ?? "";
  expect(code).toMatch(/^\d{4}$/);

  await page.getByLabel("4-digit code").fill(code);
  await page.getByRole("button", { name: "Verify and continue" }).click();
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
}
