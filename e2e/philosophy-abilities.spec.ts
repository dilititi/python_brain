import { expect, test } from "@playwright/test";

test("philosophy abilities page groups questions and notions without score language", async ({ page }) => {
  await page.goto("/philosophy/abilities/");

  await expect(page.getByRole("heading", { level: 1, name: "能力维度" })).toBeVisible();
  await expect(page.locator("body")).toContainText("这里的数量表示该能力维度下关联的内容数量，不代表能力得分。");

  const existential = page.locator('[data-ability-group="existential"]');
  await expect(existential).toContainText("存在智能");
  await expect(existential).toContainText("关联内容数量");
  await expect(existential.getByRole("link", { name: "历史是什么？" })).toHaveAttribute("href", "/questions/what-is-history/");
  await expect(existential.getByRole("link", { name: "辩证法" })).toHaveAttribute("href", "/notions/dialectic/");

  await expect(page.locator("body")).not.toContainText("智能指数");
  await expect(page.locator("body")).not.toContainText("我的智能画像");
});

test("question page renders ability tags when abilities are present", async ({ page }) => {
  await page.goto("/questions/what-is-history/");

  const tags = page.locator("[data-ability-tags]");
  await expect(tags).toContainText("此问题涉及的能力维度");
  await expect(tags).toContainText("存在");
  await expect(tags).toContainText("语言");
  await expect(tags).toContainText("逻辑");
  await expect(tags).toContainText("内省");
});

test("question page without abilities does not render an empty tag module", async ({ page }) => {
  await page.goto("/questions/what-is-understanding/");

  await expect(page.getByRole("heading", { level: 1, name: "理解是什么？" })).toBeVisible();
  await expect(page.locator("[data-ability-tags]")).toHaveCount(0);
});

test("notion pages render tags only when abilities exist", async ({ page }) => {
  await page.goto("/notions/power-knowledge/");

  const tags = page.locator("[data-ability-tags]");
  await expect(tags).toContainText("此概念涉及的能力维度");
  await expect(tags).toContainText("人际");
  await expect(tags).toContainText("语言");
  await expect(tags).toContainText("内省");

  await page.goto("/notions/philosophy-of-history/");
  await expect(page.locator("[data-ability-tags]")).toHaveCount(0);
});
