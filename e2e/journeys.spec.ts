import { expect, test } from "@playwright/test";
import { login, logout, runId, SEED, uniquePhone } from "./helpers";

// Requires a migrated + seeded database (npm run db:deploy && npm run db:seed).

test("worker journey: sign up, build a Trade Card, apply to a job", async ({ page }) => {
  await login(page, uniquePhone(), "WORKER");

  // New number → Trade Card onboarding.
  await expect(page).toHaveURL(/\/worker\/onboarding/);
  await page.getByLabel("Full name").fill("E2E Worker");
  await page.getByLabel("Current state", { exact: true }).selectOption("Uttar Pradesh");
  await page.getByLabel("District", { exact: true }).fill("Lucknow");
  await page.getByLabel("Category", { exact: true }).selectOption("SKILLED");
  await page.getByLabel("Trade", { exact: true }).selectOption("FITTER");
  await page.getByLabel("Years of floor experience").fill("4");
  await page.getByRole("button", { name: "Save my Trade Card" }).click();

  await expect(page).toHaveURL(/\/jobs\?welcome=1/);
  await expect(page.getByText("Your Trade Card is ready.")).toBeVisible();

  // Wage-transparent job card → detail → one-tap apply.
  await page.getByRole("link", { name: "ITI Fitter — Assembly Line" }).first().click();
  await expect(page).toHaveURL(/\/jobs\/[^/?]+$/);
  await expect(page.getByRole("heading", { name: "Pay, exactly" })).toBeVisible();
  await page.getByRole("button", { name: "Apply in one tap" }).click();

  await expect(page).toHaveURL(/\/worker\?applied=1/);
  await expect(page.getByText("Applied. The factory can now see your Trade Card.")).toBeVisible();
  await expect(page.getByRole("link", { name: "ITI Fitter — Assembly Line" })).toBeVisible();
});

test("factory journey: post a job, hunt a worker, invite them, worker sees the invite", async ({ page }) => {
  const title = `E2E Fitter ${runId}`;

  await login(page, SEED.verifiedFactory, "EMPLOYER");
  await expect(page).toHaveURL(/\/employer$/);
  await expect(page.getByText("Verified factory")).toBeVisible();

  // Post a job with mandatory pay fields.
  await page.getByRole("link", { name: "Post a job" }).click();
  await page.getByLabel("Job title").fill(title);
  await page.getByLabel("Trade", { exact: true }).selectOption("FITTER");
  await page.getByLabel("Category", { exact: true }).selectOption("SKILLED");
  await page.getByLabel("Gross salary per month (₹)").fill("23000");
  await page.getByLabel("In-hand salary per month (₹)").fill("20500");
  await page.getByLabel("Overtime rate (₹ per hour)").fill("100");
  await page.getByRole("button", { name: "Post job" }).click();
  await expect(page).toHaveURL(/\/employer\?posted=1/);
  await expect(page.getByText("Job posted. Workers can see it now.")).toBeVisible();

  // Hunt: filter the directory and invite a seeded fitter.
  await page.goto("/employer/hunt");
  await page.getByLabel("ITI trade").selectOption("FITTER");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  const card = page.getByRole("listitem").filter({ hasText: "Ramesh K." });
  await expect(card).toBeVisible();
  // Contact details are not exposed in the directory.
  await expect(card).not.toContainText("90000 00101");

  await card.getByLabel("Job to invite for").selectOption({ label: title });
  await card.getByRole("button", { name: "Invite (1 credit)" }).click();
  await expect(card.getByText("Invite sent.")).toBeVisible();

  // The factory dashboard now shows the candidate, with a credit spent.
  await page.goto("/employer");
  await expect(page.getByText("You invited")).toBeVisible();
  await expect(page.getByText("Ramesh Kumar")).toBeVisible();

  // The worker sees the invite on their side.
  await logout(page);
  await login(page, SEED.workerRamesh, "WORKER");
  await expect(page).toHaveURL(/\/worker$/);
  await expect(page.getByText("Factories that want you (1)")).toBeVisible();
  await expect(page.getByRole("link", { name: title })).toBeVisible();
});

test("verification journey: factory registers, admin approves, factory is verified", async ({ page }) => {
  const company = `E2E Foundry ${runId}`;
  const factoryPhone = uniquePhone();

  // Factory registers with a GSTIN.
  await login(page, factoryPhone, "EMPLOYER");
  await expect(page).toHaveURL(/\/employer\/onboarding/);
  await page.getByLabel("Company / factory name").fill(company);
  await page.getByLabel("HR contact person").fill("E2E HR");
  await page.getByLabel("HR phone").fill("9811100099");
  await page.getByLabel("Industrial area").fill("Manesar");
  await page.getByLabel("City").fill("Gurugram");
  await page.getByLabel("State", { exact: true }).selectOption("Haryana");
  await page.getByLabel("GSTIN").fill("06ABCDE1234F1Z5");
  await page.getByRole("button", { name: "Save factory profile" }).click();

  await expect(page).toHaveURL(/\/employer\?welcome=1/);
  await expect(page.getByText("Verification under review")).toBeVisible();
  await expect(page.getByText("Verified factory")).toHaveCount(0);

  // Admin finds it in the review queue and approves.
  await logout(page);
  await login(page, SEED.admin, "WORKER");
  await expect(page).toHaveURL(/\/admin\/employers/);
  const row = page.getByRole("listitem").filter({ hasText: company });
  await expect(row).toBeVisible();
  await expect(row).toContainText("06ABCDE1234F1Z5");
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: company })).toHaveCount(0);

  // The factory is now verified.
  await logout(page);
  await login(page, factoryPhone, "EMPLOYER");
  await expect(page).toHaveURL(/\/employer$/);
  await expect(page.getByText("Verified factory")).toBeVisible();
  await expect(page.getByText("Verification under review")).toHaveCount(0);
});
