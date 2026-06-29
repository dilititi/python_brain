import { expect, test } from "@playwright/test";

test("CodeRunner stays lazy on the definition tab and initializes when code becomes visible", async ({ page }) => {
  await page.goto("/concepts/decorator/");

  const runner = page.locator("[data-code-runner]");
  await expect(runner).not.toHaveAttribute("data-bound", "true");

  await page.getByRole("tab", { name: "代码示例" }).click();
  await expect(runner).toBeVisible();
  await expect(runner).toHaveAttribute("data-bound", "true");
  await expect(page.getByLabel("Python 代码")).toBeVisible();
});

test("CodeRunner initializes when the code tab is opened through a URL hash", async ({ page }) => {
  await page.goto("/concepts/decorator/#code");

  const runner = page.locator("[data-code-runner]");
  await expect(runner).toBeVisible();
  await expect(runner).toHaveAttribute("data-bound", "true");
  await expect(page.getByRole("tab", { name: "代码示例" })).toHaveAttribute("aria-selected", "true");
});
