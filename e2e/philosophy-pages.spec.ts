import { expect, test } from "@playwright/test";

test("philosophy index treats questions as the primary entry point", async ({ page }) => {
  await page.goto("/philosophy/");

  await expect(page.getByRole("heading", { level: 1, name: "问题驱动的思想工作台" })).toBeVisible();
  const question = page.locator('[data-question-card="what-is-history"]');
  await expect(question).toContainText("历史是什么？");
  await expect(question).toContainText("4 个理论回答");
  await expect(question).toContainText("2 次立场变化");
  await expect(page.getByRole("heading", { name: "现在读什么" })).toBeVisible();
  await expect(page.locator('[data-next-reading="what-is-history"]')).toContainText("精神现象学");
  await expect(page.getByRole("link", { name: "查看理解缺口回顾 →" })).toHaveAttribute("href", "/philosophy/gaps/");
  await expect(page.getByRole("heading", { name: "停滞问题" })).toBeVisible();
  await expect(page.locator("[data-stalled-empty]")).toContainText("当前没有停滞问题");
});

test("question page compares answers and presents stance evolution", async ({ page }) => {
  await page.goto("/questions/what-is-history/");

  await expect(page.getByRole("heading", { level: 1, name: "历史是什么？" })).toBeVisible();
  await expect(page.locator('[data-question-current-answer]')).toContainText("历史不是单一逻辑的展开");
  await expect(page.locator('[data-stance-matrix]')).toContainText("福柯");
  await expect(page.locator('[data-stance-matrix]')).toContainText("权力 - 知识构型");
  await expect(page.locator('[data-perspective-card="foucault"]')).toContainText("对这个问题的回答");
  await expect(page.locator('[data-stance-version="v0"]')).toContainText("历史背后有某种");
  await expect(page.locator('[data-stance-version="v1"]')).toContainText("开始怀疑");
  await expect(page.locator('[data-stance-version="v2"]')).toContainText("抵抗不是站在权力关系之外");
  await expect(page.getByRole("heading", { name: "仍未解决的问题" })).toBeVisible();
  await expect(page.locator('[data-reading-card="discipline-and-punish"]')).toContainText("规训与惩罚");
  await expect(page.locator("[data-question-next-reading]")).toContainText("精神现象学");
});

test("supporting philosophy objects remain readable and linked back to questions", async ({ page }) => {
  await page.goto("/perspectives/foucault/");
  await expect(page.getByRole("heading", { level: 1, name: "福柯" })).toBeVisible();
  await expect(page.getByRole("link", { name: "历史是什么？" })).toHaveAttribute("href", "/questions/what-is-history/");

  await page.goto("/readings/discipline-and-punish/");
  await expect(page.getByRole("heading", { level: 1, name: "规训与惩罚" })).toBeVisible();
  await expect(page.locator(".ph-status")).toHaveText("已读完");

  await page.goto("/entries/2026-06-21-foucault-history-discontinuity/");
  await expect(page.getByRole("heading", { level: 1, name: "从统一方向到局部规律" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "阅读前：V0" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "阅读后：V1" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "为什么改变" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "判断依据" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "我接受了什么" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "我仍然怀疑什么" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "由此产生的新问题" })).toBeVisible();

  await page.goto("/entries/2026-06-22-foucault-subject-resistance/");
  await expect(page.getByRole("heading", { level: 1, name: "主体如何在权力关系中抵抗" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "阅读前：V1" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "阅读后：V2" })).toBeVisible();
});

test("sources are browsable and appear in their related question workspace", async ({ page }) => {
  await page.goto("/sources/");
  await expect(page.getByRole("heading", { level: 1, name: "辅助资料库" })).toBeVisible();
  await expect(page.locator('[data-source-card="stanford-encyclopedia-philosophy-of-history"]')).toContainText(
    "Stanford Encyclopedia: Philosophy of History"
  );

  await page.goto("/questions/what-is-history/");
  const relatedSource = page.locator('[data-source-card="stanford-encyclopedia-philosophy-of-history"]');
  await expect(relatedSource).toContainText("高可靠性");
  await expect(relatedSource).toContainText("确认历史哲学的基本问题谱系");

  await page.goto("/sources/stanford-encyclopedia-philosophy-of-history/");
  await expect(page.getByRole("heading", { level: 1, name: "Stanford Encyclopedia: Philosophy of History" })).toBeVisible();
  await expect(page.getByRole("link", { name: "历史是什么？" })).toHaveAttribute("href", "/questions/what-is-history/");
  await expect(page.getByRole("heading", { name: "为什么保存" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "局限" })).toBeVisible();
});

test("questions index summarizes the complete learning workspace", async ({ page }) => {
  await page.goto("/questions/");
  await expect(page.getByRole("heading", { level: 1, name: "问题索引" })).toBeVisible();

  const question = page.locator('[data-question-card="what-is-history"]');
  await expect(question).toContainText("3 个 readings");
  await expect(question).toContainText("1 个 source");
  await expect(question).toContainText("2 次立场变化");
  await expect(question).toContainText("6 个 notions");
  await expect(question).toContainText("更新于 2026-06-22");
  await expect(question).toContainText("下一步阅读：精神现象学");

  await page.getByRole("button", { name: "持续追问" }).click();
  await expect(question).toBeHidden();
  await page.getByRole("button", { name: "已有暂定回答" }).click();
  await expect(question).toBeVisible();
});

test("readings index filters primary texts by learning status", async ({ page }) => {
  await page.goto("/readings/");
  await expect(page.getByRole("heading", { level: 1, name: "阅读状态" })).toBeVisible();

  const unread = page.locator('[data-reading-index-card="phenomenology-of-spirit"]');
  const finished = page.locator('[data-reading-index-card="discipline-and-punish"]');
  await expect(unread).toContainText("精神现象学");
  await expect(finished).toContainText("规训与惩罚");

  await page.getByRole("button", { name: "未读" }).click();
  await expect(unread).toBeVisible();
  await expect(finished).toBeHidden();
  await page.getByRole("button", { name: "已读完" }).click();
  await expect(unread).toBeHidden();
  await expect(finished).toBeVisible();
});

test("global search finds philosophy objects and judgment history", async ({ page }) => {
  await page.goto("/philosophy/");
  const search = page.getByPlaceholder("搜索概念、问题、阅读、资料");

  await search.fill("主体如何在权力关系中抵抗");
  const entryResult = page.locator("[data-search-results] a", { hasText: "主体如何在权力关系中抵抗" });
  await expect(entryResult).toHaveAttribute("href", "/entries/2026-06-22-foucault-subject-resistance/");

  await search.fill("Stanford Encyclopedia");
  const sourceResult = page.locator("[data-search-results] a", { hasText: "Stanford Encyclopedia" });
  await expect(sourceResult).toHaveAttribute("href", "/sources/stanford-encyclopedia-philosophy-of-history/");

  await search.fill("权力 / 知识");
  const notionResult = page.locator('[data-search-results] a[href="/notions/power-knowledge/"]');
  await expect(notionResult).toContainText("权力 / 知识");
  await expect(notionResult).toHaveAttribute("href", "/notions/power-knowledge/");

  await search.fill("我理解福柯的权力");
  const claimResult = page.locator("[data-search-results] a", { hasText: "我理解福柯的权力 / 知识了吗？" });
  await expect(claimResult).toHaveAttribute("href", "/understanding-claims/foucault-power-knowledge-claim/");
});

test("sources index filters by question, reliability, and status", async ({ page }) => {
  await page.goto("/sources/");
  const source = page.locator('[data-source-card="stanford-encyclopedia-philosophy-of-history"]');

  await expect(page.locator("[data-source-count]")).toContainText("1 个 source");
  await page.getByLabel("关联问题").selectOption("what-is-history");
  await expect(source).toBeVisible();

  await page.getByLabel("可靠性").selectOption("medium");
  await expect(source).toBeHidden();
  await expect(page.locator("[data-source-empty]")).toBeVisible();

  await page.getByLabel("可靠性").selectOption("high");
  await expect(source).toBeVisible();
  await page.getByLabel("处理状态").selectOption("saved");
  await expect(source).toBeHidden();
  await page.getByLabel("处理状态").selectOption("skimmed");
  await expect(source).toBeVisible();
});

test("review page summarizes recent stance changes newest first", async ({ page }) => {
  await page.goto("/philosophy/review/");
  await expect(page.getByRole("heading", { level: 1, name: "近期立场变化" })).toBeVisible();

  const cards = page.locator("[data-review-card]");
  await expect(cards.first()).toHaveAttribute("data-review-card", "2026-06-22-foucault-subject-resistance");
  await expect(cards.first()).toContainText("V1 → V2");
  await expect(cards.first()).toContainText("主体被构造");
  await expect(cards.first()).toContainText("只能被动服从");
  await expect(cards.first()).toContainText("改变规则的第一步如何出现");

  await page.getByLabel("筛选问题").selectOption("what-is-history");
  await expect(page.locator('[data-review-card="2026-06-21-foucault-history-discontinuity"]')).toBeVisible();
});

test("question workspace exposes notions and concrete open questions", async ({ page }) => {
  await page.goto("/questions/what-is-history/");

  const notion = page.locator('[data-notion-card="power-knowledge"]');
  await expect(notion).toContainText("权力 / 知识");
  await expect(notion.getByRole("link", { name: "查看 notion" })).toHaveAttribute(
    "href",
    "/notions/power-knowledge/"
  );
  await expect(page.locator(".ph-unresolved")).toContainText("局部规律如何避免退化成不可比较的碎片描述");

  await page.goto("/notions/power-knowledge/");
  await expect(page.getByRole("heading", { level: 1, name: "权力 / 知识" })).toBeVisible();
  await expect(page.getByRole("link", { name: "历史是什么？" })).toHaveAttribute(
    "href",
    "/questions/what-is-history/"
  );
});

test("understanding claims are browsable and embedded in question and notion workspaces", async ({ page }) => {
  await page.goto("/understanding-claims/");
  await expect(page.getByRole("heading", { level: 1, name: "理解主张" })).toBeVisible();
  const claim = page.locator('[data-understanding-claim-card="foucault-power-knowledge-claim"]');
  await expect(claim).toContainText("我理解福柯的权力 / 知识了吗？");
  await expect(claim).toContainText("检验中");
  await expect(claim).toContainText("中等信心");
  await expect(claim).toContainText("目标：概念 / power-knowledge");
  await expect(claim).toContainText("3 条证据");
  await expect(claim).toContainText("2 个缺口");
  await expect(claim).toContainText("2 个下一步");
  await expect(claim).toContainText("更新于 2026-06-23");

  await page.getByLabel("状态").selectOption("draft");
  await expect(claim).toBeHidden();
  await expect(page.locator("[data-understanding-claim-empty]")).toBeVisible();
  await page.getByLabel("状态").selectOption("testing");
  await expect(claim).toBeVisible();
  await page.getByLabel("信心").selectOption("low");
  await expect(claim).toBeHidden();
  await page.getByLabel("信心").selectOption("medium");
  await expect(claim).toBeVisible();
  await page.getByLabel("目标类型").selectOption("reading");
  await expect(claim).toBeHidden();
  await page.getByLabel("目标类型").selectOption("notion");
  await expect(claim).toBeVisible();

  await page.goto("/understanding-claims/foucault-power-knowledge-claim/");
  await expect(page.getByRole("heading", { level: 1, name: "我理解福柯的权力 / 知识了吗？" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "我的理解主张" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "证据档案" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "仍然缺什么" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "下一步验证任务" })).toBeVisible();
  await expect(page.locator("[data-evidence-chain]")).toContainText("证据链卡片");
  await expect(page.locator("[data-evidence-item]").first()).toContainText("strong");
  await expect(page.locator("[data-claim-gap-panel]")).toContainText("可能的反证或张力");
  await expect(page.getByRole("link", { name: "历史是什么？" })).toHaveAttribute(
    "href",
    "/questions/what-is-history/"
  );

  await page.goto("/questions/what-is-history/");
  await expect(page.locator('[data-understanding-claim-card="foucault-power-knowledge-claim"]')).toContainText(
    "我理解福柯的权力 / 知识了吗？"
  );

  await page.goto("/notions/power-knowledge/");
  await expect(page.locator('[data-understanding-claim-card="foucault-power-knowledge-claim"]')).toContainText(
    "我理解福柯的权力 / 知识了吗？"
  );
});

test("understanding gaps review groups claim gaps and next tasks", async ({ page }) => {
  await page.goto("/philosophy/gaps/");

  await expect(page.getByRole("heading", { level: 1, name: "理解缺口回顾" })).toBeVisible();
  const card = page.locator('[data-understanding-gap-card="foucault-power-knowledge-claim"]');
  await expect(card).toContainText("我理解福柯的权力 / 知识了吗？");
  await expect(card).toContainText("检验中");
  await expect(card).toContainText("中等信心");
  await expect(card).toContainText("概念 / power-knowledge");
  await expect(card).toContainText("还需要用章节细读验证“生产性”的边界");
  await expect(card).toContainText("如果所有主体能力都由权力关系塑造");
  await expect(card).toContainText("重读《规训与惩罚》关于规训权力的章节");
  await expect(card.getByRole("link", { name: "查看理解主张" })).toHaveAttribute(
    "href",
    "/understanding-claims/foucault-power-knowledge-claim/"
  );
});
