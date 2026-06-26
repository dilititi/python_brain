import assert from "node:assert/strict";
import test from "node:test";

async function loadSearch() {
  try {
    return await import("../src/lib/philosophy-search");
  } catch (error) {
    assert.fail(`philosophy search helpers are unavailable: ${String(error)}`);
  }
}

function fixture() {
  return {
    questions: [{
      id: "what-is-history",
      data: {
        title: "历史是什么？",
        currentAnswer: "历史包含局部规律与关系内部的能动性。",
        openQuestions: ["抵抗如何出现？"],
        status: "provisional"
      }
    }],
    perspectives: [{
      id: "foucault",
      data: {
        title: "福柯",
        summary: "从权力、知识与主体形成理解历史。",
        thinkers: ["Michel Foucault"],
        coreClaims: ["权力具有生产性"]
      }
    }],
    readings: [{
      id: "discipline-and-punish",
      data: {
        title: "规训与惩罚",
        author: "米歇尔·福柯",
        notes: "关注规训权力与主体形成。",
        status: "finished"
      }
    }],
    notions: [{
      id: "power-knowledge",
      data: { title: "权力 / 知识", summary: "知识与权力在实践中共同形成。" }
    }],
    entries: [
      {
        id: "2026-06-21-local-rules",
        data: {
          title: "从统一方向到局部规律",
          date: "2026-06-21",
          question: "what-is-history",
          triggeredBy: "discipline-and-punish",
          fromVersion: 0,
          toVersion: 1,
          reason: "制度变化不能被化约为单线进步。",
          newStance: "规律只在局部制度中成立。",
          accepted: ["局部规律"],
          doubts: ["跨时期如何比较"],
          newQuestions: ["局部规律如何避免碎片化？"]
        }
      },
      {
        id: "2026-06-22-subject-resistance",
        data: {
          title: "主体如何在权力关系中抵抗",
          date: "2026-06-22",
          question: "what-is-history",
          triggeredBy: "discipline-and-punish",
          fromVersion: 1,
          toVersion: 2,
          reason: "主体被构造不等于只能被动服从。",
          newStance: "抵抗是关系内部重新使用既有条件。",
          accepted: ["权力具有生产性"],
          doubts: ["如何区分改变与有限偏差"],
          newQuestions: ["改变规则的第一步如何出现？"]
        }
      }
    ],
    sources: [{
      id: "history-overview",
      data: {
        title: "History Overview",
        summary: "历史哲学导论。",
        whySaved: "建立问题谱系。",
        useFor: ["寻找文献"],
        limitations: ["不能替代原典"],
        reliability: "high",
        status: "skimmed",
        relatedQuestions: ["what-is-history"]
      }
    }],
    understandingClaims: [{
      id: "foucault-power-knowledge-claim",
      data: {
        title: "我理解福柯的权力 / 知识了吗？",
        claim: "我能说明权力 / 知识不是知识被权力污染，而是二者在制度实践中共同生产对象、主体与判断规则。",
        status: "testing",
        confidence: "medium",
        relatedQuestions: ["what-is-history"],
        relatedNotions: ["power-knowledge"],
        relatedPerspectives: ["foucault"],
        relatedReadings: ["discipline-and-punish"],
        relatedSources: ["history-overview"],
        relatedEntries: ["2026-06-21-local-rules"],
        gaps: ["还需要用章节细读验证“生产性”的边界。"],
        nextTasks: ["重读《规训与惩罚》关于规训权力的章节。"]
      }
    }]
  };
}

test("philosophy search documents cover all seven philosophy object types", async () => {
  const { buildPhilosophySearchDocuments } = await loadSearch();
  const documents = buildPhilosophySearchDocuments(fixture());

  assert.deepEqual(new Set(documents.map((document) => document.kind)), new Set([
    "思想问题",
    "理论视角",
    "原典阅读",
    "理论概念",
    "立场变化",
    "辅助资料",
    "理解主张"
  ]));
  assert.equal(documents.length, 8);
  assert.deepEqual(
    documents.find((document) => document.id === "entry:2026-06-22-subject-resistance"),
    {
      id: "entry:2026-06-22-subject-resistance",
      title: "主体如何在权力关系中抵抗",
      description: "V1 → V2 · 主体被构造不等于只能被动服从。",
      href: "/entries/2026-06-22-subject-resistance/",
      kind: "立场变化",
      keywords: "抵抗是关系内部重新使用既有条件。 权力具有生产性 如何区分改变与有限偏差 改变规则的第一步如何出现？ 历史是什么？ 规训与惩罚"
    }
  );
  assert.match(
    documents.find((document) => document.id === "source:history-overview")?.keywords ?? "",
    /高可靠性 已浏览 历史是什么？/
  );
  assert.deepEqual(
    documents.find((document) => document.id === "understanding-claim:foucault-power-knowledge-claim"),
    {
      id: "understanding-claim:foucault-power-knowledge-claim",
      title: "我理解福柯的权力 / 知识了吗？",
      description: "我能说明权力 / 知识不是知识被权力污染，而是二者在制度实践中共同生产对象、主体与判断规则。",
      href: "/understanding-claims/foucault-power-knowledge-claim/",
      kind: "理解主张",
      keywords: "检验中 中等信心 还需要用章节细读验证“生产性”的边界。 重读《规训与惩罚》关于规训权力的章节。 历史是什么？ 规训与惩罚"
    }
  );
});

test("stance review rows are newest first and resolve question and reading labels", async () => {
  const { buildRecentStanceChanges } = await loadSearch();
  const rows = buildRecentStanceChanges(fixture());

  assert.deepEqual(rows.map((row) => row.id), [
    "2026-06-22-subject-resistance",
    "2026-06-21-local-rules"
  ]);
  assert.deepEqual(rows[0], {
    id: "2026-06-22-subject-resistance",
    title: "主体如何在权力关系中抵抗",
    date: "2026-06-22",
    href: "/entries/2026-06-22-subject-resistance/",
    questionId: "what-is-history",
    questionTitle: "历史是什么？",
    readingId: "discipline-and-punish",
    readingTitle: "规训与惩罚",
    fromVersion: 1,
    toVersion: 2,
    reason: "主体被构造不等于只能被动服从。",
    newStance: "抵抗是关系内部重新使用既有条件。",
    accepted: ["权力具有生产性"],
    doubts: ["如何区分改变与有限偏差"],
    newQuestions: ["改变规则的第一步如何出现？"]
  });
});
