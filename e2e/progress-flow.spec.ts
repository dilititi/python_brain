import { expect, test } from "@playwright/test";

const attemptsKey = "pkb:attempts";
const hydrationTimeout = 15_000;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test("recognition attempt updates local storage, matrix, and weekly evidence", async ({ page }) => {
  await page.goto("/assessments/syntax-recognition-tier1-f-string-output/");
  await expect(page.locator('[data-assessment-ready="true"]')).toBeVisible({ timeout: hydrationTimeout });
  await page.getByRole("button", { name: "Ada has 4 files" }).click();
  await page.getByRole("button", { name: "提交答案" }).click();

  await expect(page.getByLabel("评估反馈")).toContainText("count + 1 得到 4");

  const stored = await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, attemptsKey);

  expect(stored.schemaVersion).toBe(1);
  expect(stored.attempts).toHaveLength(1);
  expect(stored.attempts[0]).toMatchObject({
    category: "syntax",
    kind: "assessment",
    passed: true,
    assessmentId: "syntax-recognition-tier1-f-string-output",
    assessmentKind: "recognition"
  });

  await page.goto("/progress/");
  await expect(page.locator('[data-summary="source"]')).toHaveText("Local");

  const syntaxTier1 = page.locator('[data-cell="syntax:tier1"]');
  await expect(syntaxTier1.locator("[data-status]")).toHaveText("in_progress");
  await expect(syntaxTier1.locator("[data-progress]")).not.toHaveText("0%");
  await expect(page.locator("[data-week-total]")).toHaveText("1");
  await expect(page.locator("[data-week-categories]")).toContainText("基础语法 1");
});

test("returning learner sees a gentle frontier and an unattempted recognition entry", async ({ page }) => {
  await page.evaluate((key) => {
    const occurredAt = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    window.localStorage.setItem(key, JSON.stringify({
      schemaVersion: 1,
      attempts: [{
        id: "old-syntax-read",
        category: "syntax",
        occurredAt,
        kind: "concept-read",
        conceptId: "variable"
      }],
      updatedAt: occurredAt
    }));
  }, attemptsKey);

  await page.goto("/progress/");

  await expect(page.locator("[data-week-total]")).toHaveText("0");
  await expect(page.locator("[data-return-guidance]")).toBeVisible();
  await expect(page.locator("[data-return-guidance]")).toContainText("欢迎回来");
  await expect(page.locator("[data-return-guidance]")).toContainText("基础语法");
  await expect(page.locator("[data-stalled-section]")).toBeVisible();

  const suggestion = page.locator(
    '[data-stalled-assessment="syntax-recognition-tier1-f-string-output"]'
  );
  await expect(suggestion).toBeVisible();
  await expect(suggestion).toHaveAttribute(
    "href",
    "/assessments/syntax-recognition-tier1-f-string-output/"
  );
});

test("new visitors do not receive silence or stalled-language prompts", async ({ page }) => {
  await page.goto("/progress/");

  await expect(page.locator('[data-summary="source"]')).toHaveText("Mock");
  await expect(page.locator("[data-return-guidance]")).toBeHidden();
  await expect(page.locator("[data-stalled-section]")).toBeHidden();
});
