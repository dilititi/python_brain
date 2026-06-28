import { expect, test } from "@playwright/test";

test("mobile primary navigation keeps every label on one line without overflowing the page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/philosophy/review/");

  const links = page.locator(".nav-links a");
  await expect(links).toHaveCount(9);

  const metrics = await links.evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    return {
      height: bounds.height,
      fontSize: Number.parseFloat(style.fontSize),
      label: element.textContent?.trim() ?? ""
    };
  }));

  for (const metric of metrics) {
    expect(metric.height, `${metric.label} should remain on one line`).toBeLessThanOrEqual(metric.fontSize * 1.8);
  }

  const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(pageOverflow).toBeLessThanOrEqual(0);
});
