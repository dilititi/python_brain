import { expect, test } from "@playwright/test";

test("root is a dark search-centered philosophy graph", async ({ page }) => {
  await page.goto("/");

  const home = page.locator("[data-philosophy-graph-home]");
  const inspector = page.locator("[data-graph-inspector]");

  await expect(home).toBeVisible();
  await expect(page.getByRole("combobox", { name: "搜索思想节点" })).toBeVisible();
  await expect(page.locator("[data-graph-canvas]")).toBeVisible();
  await expect(inspector).toHaveAttribute("data-center-id", "question:what-is-history");
  await expect(inspector).toContainText("历史是什么？");
  await expect(page.locator(".react-flow")).toHaveCount(0);

  const background = await page.locator("body").evaluate((element) =>
    getComputedStyle(element).backgroundColor,
  );
  expect(background).not.toBe("rgb(255, 255, 255)");
});

test("combobox shows up to six matches and mouse selection changes only the center", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-philosophy-graph-home]")).toHaveAttribute("data-hydrated", "true");
  const search = page.getByRole("combobox", { name: "搜索思想节点" });
  const inspector = page.locator("[data-graph-inspector]");

  await search.fill("福柯");
  await expect(inspector).toHaveAttribute("data-center-id", "question:what-is-history");

  const listbox = page.getByRole("listbox", { name: "搜索结果" });
  await expect(listbox).toBeVisible();
  const options = listbox.getByRole("option");
  await expect(options.first()).toContainText("福柯");
  expect(await options.count()).toBeLessThanOrEqual(6);

  await options.first().click();
  await expect(inspector).toHaveAttribute("data-center-id", "perspective:foucault");
  await expect(inspector).toContainText("福柯");
  await expect(listbox).toBeHidden();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/");
  await expect.poll(() => new URL(page.url()).searchParams.get("focus")).toBe("perspective:foucault");
});

test("combobox supports arrow selection Enter and Escape", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-philosophy-graph-home]")).toHaveAttribute("data-hydrated", "true");
  const search = page.getByRole("combobox", { name: "搜索思想节点" });
  const listbox = page.getByRole("listbox", { name: "搜索结果" });
  const inspector = page.locator("[data-graph-inspector]");

  await search.fill("福柯");
  const options = listbox.getByRole("option");
  await expect(options.first()).toHaveAttribute("aria-selected", "true");
  await search.press("ArrowDown");
  await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
  await search.press("ArrowUp");
  await expect(options.first()).toHaveAttribute("aria-selected", "true");
  await search.press("Enter");
  await expect(inspector).toHaveAttribute("data-center-id", "perspective:foucault");
  await expect(listbox).toBeHidden();

  await search.fill("历史");
  await expect(listbox).toBeVisible();
  await search.press("Escape");
  await expect(listbox).toBeHidden();
  await expect(search).toHaveValue("历史");
});

test("URL focus initializes the center and Reset clears focus and query", async ({ page }) => {
  await page.goto("/?focus=reading:discipline-and-punish");
  const home = page.locator("[data-philosophy-graph-home]");
  await expect(home).toHaveAttribute("data-focus-ready", "true");
  const inspector = page.locator("[data-graph-inspector]");
  const search = page.getByRole("combobox", { name: "搜索思想节点" });

  await expect(inspector).toHaveAttribute("data-center-id", "reading:discipline-and-punish");
  await expect(inspector).toContainText("规训与惩罚");
  await search.fill("福柯");
  await page.getByRole("button", { name: "重置中心" }).click();
  await expect(inspector).toHaveAttribute("data-center-id", "question:what-is-history");
  await expect(search).toHaveValue("");
  await expect.poll(() => new URL(page.url()).searchParams.get("focus")).toBeNull();
});

test("invalid URL focus safely falls back to the default center", async ({ page }) => {
  await page.goto("/?focus=missing:node");
  const home = page.locator("[data-philosophy-graph-home]");
  await expect(home).toHaveAttribute("data-focus-ready", "true");

  await expect(page.locator("[data-graph-inspector]")).toHaveAttribute(
    "data-center-id",
    "question:what-is-history",
  );
  await expect.poll(() => new URL(page.url()).searchParams.get("focus")).toBeNull();
});

test("key reading inspector uses a meaningful content description", async ({ page }) => {
  await page.goto("/?focus=reading:discipline-and-punish");
  await expect(page.locator("[data-philosophy-graph-home]")).toHaveAttribute(
    "data-focus-ready",
    "true",
  );

  const description = page.locator("[data-inspector-description]");
  await expect(description).toBeVisible();
  await expect(description).not.toContainText("还没有适合首页展示的摘要");
  expect((await description.textContent())?.trim().length ?? 0).toBeGreaterThan(20);
});

test("node type legend explains all seven colors", async ({ page }) => {
  await page.goto("/");
  const legend = page.locator("[data-node-legend]");

  await expect(legend).toBeVisible();
  await expect(legend.locator("[data-legend-kind]")).toHaveCount(7);
  await expect(legend).toContainText("问题");
  await expect(legend).toContainText("理解主张");
  await expect(legend).toContainText("理论视角");
});

test("graph homepage keeps philosophy actions and the legacy Python graph reachable", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "下一步学习" })).toHaveAttribute("href", "/philosophy/next/");
  await expect(page.getByRole("link", { name: "证据锚点" })).toHaveAttribute("href", "/philosophy/evidence/");
  await expect(page.getByRole("link", { name: "理解缺口" })).toHaveAttribute("href", "/philosophy/gaps/");
  await expect(page.getByRole("link", { name: "能力维度" })).toHaveAttribute("href", "/philosophy/abilities/");
  await expect(page.getByRole("link", { name: "Python 知识库" })).toHaveAttribute("href", "/graph/");
});

test("search and inspector remain usable on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("[data-philosophy-graph-home]")).toHaveAttribute("data-hydrated", "true");

  const search = page.getByRole("combobox", { name: "搜索思想节点" });
  await expect(search).toBeVisible();
  await search.fill("历史");

  const listbox = page.getByRole("listbox", { name: "搜索结果" });
  await expect(listbox).toBeVisible();
  const listboxBox = await listbox.boundingBox();
  expect(listboxBox).not.toBeNull();
  expect(listboxBox!.x).toBeGreaterThanOrEqual(0);
  expect(listboxBox!.x + listboxBox!.width).toBeLessThanOrEqual(390);

  await expect(page.locator("[data-node-legend]")).toBeVisible();
  await expect(page.getByRole("button", { name: "重置中心" })).toBeVisible();
  await listbox.getByRole("option").first().click();

  const inspector = page.locator("[data-graph-inspector]");
  await expect(inspector).toBeVisible();
  await expect(inspector.getByRole("link", { name: "进入详情页" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
