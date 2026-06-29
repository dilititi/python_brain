import { expect, test } from "@playwright/test";

test("review dashboard summarizes Ability Lens coverage without scoring language", async ({ page }) => {
  await page.goto("/philosophy/review/");

  const panel = page.locator('[data-review-panel="ability-coverage"]');
  await expect(panel.getByRole("heading", { name: "Ability Lens coverage" })).toBeVisible();
  await expect(panel).toContainText("未标注 active questions");
  await expect(panel).toContainText("未标注核心 notions");
  await expect(panel).toContainText("每个 ability 下的内容数量");
  await expect(panel).toContainText("内容最少的 ability 维度");
  await expect(panel).toContainText("当前 active questions 都已标注 abilities");
  await expect(panel).toContainText("当前核心 notions 都已标注 abilities");
  await expect(panel).toContainText("关联内容较少");
  await expect(panel).toContainText("尚未充分覆盖");
  await expect(panel).toContainText("当前内容集中于这些维度");

  await expect(panel.locator('[data-ability-review-count="linguistic"]')).toContainText("语言智能");
  await expect(panel.locator('[data-ability-review-count="existential"]')).toContainText("存在智能");

  await expect(panel).not.toContainText("能力弱");
  await expect(panel).not.toContainText("得分低");
  await expect(panel).not.toContainText("智能指数");
});
