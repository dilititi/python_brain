import { expect, test } from "@playwright/test";

test("philosophy evidence index groups understanding claim evidence by anchor", async ({ page }) => {
  await page.goto("/philosophy/evidence/");

  await expect(page.getByRole("heading", { level: 1, name: "证据锚点索引" })).toBeVisible();
  await expect(page.locator(".ph-hero")).toContainText("哪些 readings / entries 正在支撑我的理解主张？");
  await expect(page.locator(".ph-hero")).toContainText("哪些 evidence 还是 weak？");
  await expect(page.locator(".ph-hero")).toContainText("哪些 claim 的证据已经锚到真实内容？");

  const byRef = page.locator('[data-evidence-section="by-ref-type"]');
  await expect(byRef.getByRole("heading", { name: "按 refType / ref 分组" })).toBeVisible();

  const readingGroup = byRef.locator('[data-evidence-group-ref="reading:discipline-and-punish"]');
  await expect(readingGroup.getByRole("heading", { name: "规训与惩罚" })).toBeVisible();
  await expect(readingGroup).toContainText("reading");
  await expect(readingGroup.locator("[data-evidence-item]")).toHaveCount(2);
  await expect(readingGroup.getByRole("link", { name: "打开锚点" })).toHaveAttribute(
    "href",
    "/readings/discipline-and-punish/"
  );

  const entryGroup = byRef.locator('[data-evidence-group-ref="entry:2026-06-21-foucault-history-discontinuity"]');
  await expect(entryGroup.getByRole("heading", { name: "从统一方向到局部规律" })).toBeVisible();
  await expect(entryGroup.getByRole("link", { name: "打开锚点" })).toHaveAttribute(
    "href",
    "/entries/2026-06-21-foucault-history-discontinuity/"
  );

  const strength = page.locator('[data-evidence-section="by-strength"]');
  await expect(strength.getByRole("heading", { name: "按 strength 分组" })).toBeVisible();
  await expect(strength.locator('[data-evidence-strength-group="strong"]')).toContainText("strong");
  await expect(strength.locator('[data-evidence-strength-group="moderate"]')).toContainText("moderate");

  const weak = page.locator('[data-evidence-section="weak-evidence"]');
  await expect(weak.getByRole("heading", { name: "Weak evidence" })).toBeVisible();
  await expect(weak).toContainText("当前没有 weak evidence。");

  const anchored = page.locator('[data-evidence-section="anchored-claims"]');
  await expect(anchored.getByRole("heading", { name: "已经锚到真实内容的 claim" })).toBeVisible();
  const claim = anchored.locator('[data-evidence-anchored-claim="foucault-power-knowledge-claim"]');
  await expect(claim).toContainText("我理解福柯的权力 / 知识了吗？");
  await expect(claim).toContainText("4 / 4 条 evidence 已锚到真实内容");
  await expect(claim.getByRole("link", { name: "查看 claim" })).toHaveAttribute(
    "href",
    "/understanding-claims/foucault-power-knowledge-claim/"
  );

  await expect(page.locator(".react-flow")).toHaveCount(0);
});
