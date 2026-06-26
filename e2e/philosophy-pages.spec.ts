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

test("question page renders a pure SVG local map", async ({ page }) => {
  await page.goto("/questions/what-is-history/");

  const map = page.locator("[data-question-local-map]");
  await expect(map).toBeVisible();
  await expect(map.locator("svg")).toHaveAttribute("data-map-renderer", "svg");
  await expect(map.locator("[data-map-node='question']")).toContainText("历史是什么？");
  await expect(map.locator("[data-map-node='perspectives']")).toContainText("4 perspectives");
  await expect(map.locator("[data-map-node='readings']")).toContainText("3 readings");
  await expect(map.locator("[data-map-node='entries']")).toContainText("2 entries");
  await expect(map.locator("[data-map-node='claims']")).toContainText("1 claim");
  await expect(map.locator("[data-map-node='notions']")).toContainText("6 notions");
  await expect(map.locator("[data-map-node='sources']")).toContainText("1 source");
  await expect(map.locator(".react-flow")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "阅读 essay 实验页 →" })).toHaveAttribute(
    "href",
    "/questions/what-is-history/essay/"
  );
});

test("question local map detail panel groups related objects", async ({ page }) => {
  await page.goto("/questions/what-is-history/");

  const panel = page.locator("[data-local-map-detail-panel]");
  await expect(panel).toBeVisible();

  const groups = [
    { key: "perspectives", title: "Perspectives", count: "4", item: "福柯", href: "/perspectives/foucault/" },
    { key: "readings", title: "Readings", count: "3", item: "规训与惩罚", href: "/readings/discipline-and-punish/" },
    { key: "sources", title: "Sources", count: "1", item: "Stanford Encyclopedia: Philosophy of History", href: "/sources/stanford-encyclopedia-philosophy-of-history/" },
    { key: "notions", title: "Notions", count: "6", item: "权力 / 知识", href: "/notions/power-knowledge/" },
    { key: "understanding-claims", title: "Understanding Claims", count: "1", item: "我理解福柯的权力 / 知识了吗？", href: "/understanding-claims/foucault-power-knowledge-claim/" },
    { key: "entries", title: "Entries", count: "2", item: "从统一方向到局部规律", href: "/entries/2026-06-21-foucault-history-discontinuity/" }
  ];

  for (const group of groups) {
    const section = panel.locator(`[data-local-map-group="${group.key}"]`);
    await expect(section.getByRole("heading", { name: group.title })).toBeVisible();
    await expect(section.locator("[data-local-map-group-count]")).toHaveText(group.count);
    await expect(section.locator("[data-local-map-item]")).toHaveCount(Number(group.count));
    await expect(section.getByRole("link", { name: group.item })).toHaveAttribute("href", group.href);
  }
});

test("question local map detail panel does not overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 840 });
  await page.goto("/questions/what-is-history/");

  const panel = page.locator("[data-local-map-detail-panel]");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Perspectives");
  const fitsViewport = await panel.evaluate((element) => element.scrollWidth <= element.clientWidth + 1);
  expect(fitsViewport).toBe(true);
});

test("what-is-history essay experiment is readable and linked back to the workspace", async ({ page }) => {
  await page.goto("/questions/what-is-history/essay/");

  await expect(page.getByRole("heading", { level: 1, name: "历史是什么？essay 实验" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "暂定论点" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "理论回答如何互相牵制" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "我的立场如何变化" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "还缺什么证据" })).toBeVisible();
  await expect(page.getByRole("link", { name: "返回问题工作台" })).toHaveAttribute(
    "href",
    "/questions/what-is-history/"
  );
  await expect(page.locator("[data-essay-local-map] svg")).toHaveAttribute("data-map-renderer", "svg");
});

test("only question pages with an essay experiment expose the essay link", async ({ page }) => {
  await page.goto("/questions/what-is-history/");
  await expect(page.getByRole("link", { name: "阅读 essay 实验页 →" })).toHaveAttribute(
    "href",
    "/questions/what-is-history/essay/"
  );

  await page.goto("/questions/");
  const otherQuestionIds = await page.locator("[data-question-card]").evaluateAll((cards) => (
    cards
      .map((card) => card.getAttribute("data-question-card"))
      .filter((id): id is string => Boolean(id) && id !== "what-is-history")
  ));

  if (otherQuestionIds.length === 0) {
    await expect(page.locator('[data-question-card]:not([data-question-card="what-is-history"])')).toHaveCount(0);
    return;
  }

  for (const questionId of otherQuestionIds) {
    await page.goto(`/questions/${questionId}/`);
    await expect(page.getByRole("link", { name: "阅读 essay 实验页 →" })).toHaveCount(0);
  }
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

test("philosophy next dashboard aggregates next learning tasks", async ({ page }) => {
  await page.goto("/philosophy/next/");

  await expect(page.getByRole("heading", { level: 1, name: "下一步学习" })).toBeVisible();

  const claimTasks = page.locator('[data-next-section="claim-tasks"]');
  await expect(claimTasks).toContainText("重读《规训与惩罚》关于规训权力的章节");
  await expect(claimTasks.getByRole("link", { name: "我理解福柯的权力 / 知识了吗？" }).first()).toHaveAttribute(
    "href",
    "/understanding-claims/foucault-power-knowledge-claim/"
  );

  const questionTasks = page.locator('[data-next-section="question-open-questions"]');
  await expect(questionTasks).toContainText("局部规律如何避免退化成不可比较的碎片描述");
  await expect(questionTasks.getByRole("link", { name: "历史是什么？" }).first()).toHaveAttribute(
    "href",
    "/questions/what-is-history/"
  );

  const readings = page.locator('[data-next-section="readings-to-continue"]');
  await expect(readings).toContainText("精神现象学");
  await expect(readings.getByRole("link", { name: "资本论" })).toHaveAttribute("href", "/readings/capital/");

  const sources = page.locator('[data-next-section="sources-to-process"]');
  await expect(sources).toContainText("Stanford Encyclopedia: Philosophy of History");
  await expect(sources).toContainText("高可靠性");
  await expect(sources.getByRole("link", { name: "历史是什么？" })).toHaveAttribute(
    "href",
    "/questions/what-is-history/"
  );
});

test("philosophy gaps dashboard separates gaps counter evidence and next tasks", async ({ page }) => {
  await page.goto("/philosophy/gaps/");

  const gaps = page.locator('[data-gap-issue-section="gaps"]');
  await expect(gaps.getByRole("heading", { name: "Gaps" })).toBeVisible();
  await expect(gaps).toContainText("还需要用章节细读验证“生产性”的边界");
  await expect(gaps.getByRole("link", { name: "我理解福柯的权力 / 知识了吗？" }).first()).toHaveAttribute(
    "href",
    "/understanding-claims/foucault-power-knowledge-claim/"
  );

  const counterEvidence = page.locator('[data-gap-issue-section="counter-evidence"]');
  await expect(counterEvidence.getByRole("heading", { name: "Counter Evidence" })).toBeVisible();
  await expect(counterEvidence).toContainText("抵抗如何不只是既有规则的再生产");

  const nextTasks = page.locator('[data-gap-issue-section="next-tasks"]');
  await expect(nextTasks.getByRole("heading", { name: "Next Tasks" })).toBeVisible();
  await expect(nextTasks).toContainText("把“权力 / 知识”和“话语”两个 notion 的差异写成一个小对照");
});

test("philosophy review dashboard highlights stalled questions evidence warnings and unprocessed sources", async ({ page }) => {
  await page.goto("/philosophy/review/");

  await expect(page.locator('[data-review-panel="stalled-questions"]')).toContainText("Stalled active questions");
  await expect(page.locator('[data-review-panel="stalled-questions"]')).toContainText("当前没有停滞问题");

  await expect(page.locator('[data-review-panel="claims-needing-evidence"]')).toContainText("Claims needing evidence");
  await expect(page.locator('[data-review-panel="claims-needing-evidence"]')).toContainText("当前没有证据不足的 claim");

  const sources = page.locator('[data-review-panel="unprocessed-sources"]');
  await expect(sources).toContainText("Unprocessed sources");
  await expect(sources).toContainText("Stanford Encyclopedia: Philosophy of History");
  await expect(sources.getByRole("link", { name: "Stanford Encyclopedia: Philosophy of History" })).toHaveAttribute(
    "href",
    "/sources/stanford-encyclopedia-philosophy-of-history/"
  );
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
  await expect(claim).toContainText("4 条证据");
  await expect(claim).toContainText("3 个缺口");
  await expect(claim).toContainText("3 个下一步");
  await expect(claim).toContainText("更新于 2026-06-26");

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

test("legacy understanding gaps route remains a compatibility page", async ({ page }) => {
  await page.goto("/review/understanding-gaps/");

  await page.waitForURL("**/philosophy/gaps/");
  await expect(page).toHaveURL(/\/philosophy\/gaps\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "理解缺口回顾" })).toBeVisible();
});
