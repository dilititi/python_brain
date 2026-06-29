import assert from "node:assert/strict";
import test from "node:test";
import type { PhilosophyHomeGraphNode } from "../src/lib/philosophy-home-graph";
import { findPhilosophyHomeMatches } from "../src/lib/philosophy-home-search";

function node(
  id: string,
  label: string,
  overrides: Partial<PhilosophyHomeGraphNode> = {},
): PhilosophyHomeGraphNode {
  return {
    id,
    label,
    kind: "notion",
    href: `/notions/${id.split(":")[1]}/`,
    keywords: [id, label],
    ...overrides,
  };
}

test("search ranks exact labels before prefixes and contains matches", () => {
  const nodes = [
    node("notion:power-knowledge", "权力 / 知识"),
    node("perspective:power", "权力", { kind: "perspective" }),
    node("claim:power-question", "我理解权力了吗？", { kind: "understanding-claim" }),
  ];

  assert.deepEqual(
    findPhilosophyHomeMatches(nodes, "权力").map((item) => item.id),
    ["perspective:power", "notion:power-knowledge", "claim:power-question"],
  );
});

test("search uses id keywords and description as defensive fallbacks", () => {
  const nodes = [
    node("reading:discipline-and-punish", "规训与惩罚", { kind: "reading" }),
    node("notion:discourse", "话语", { keywords: ["福柯", "discourse"] }),
    node("source:history-overview", "历史哲学导论", {
      kind: "source",
      description: "用于理解谱系学与福柯的历史方法。",
      keywords: [],
    }),
  ];

  assert.deepEqual(
    findPhilosophyHomeMatches(nodes, "discipline").map((item) => item.id),
    ["reading:discipline-and-punish"],
  );
  assert.deepEqual(
    findPhilosophyHomeMatches(nodes, "福柯").map((item) => item.id),
    ["notion:discourse", "source:history-overview"],
  );
});

test("search returns at most six stable results without adding ranking fields", () => {
  const nodes = Array.from({ length: 8 }, (_, index) =>
    node(`notion:history-${index}`, `历史概念 ${index}`),
  );
  const matches = findPhilosophyHomeMatches(nodes, "历史");

  assert.deepEqual(matches.map((item) => item.id), nodes.slice(0, 6).map((item) => item.id));
  assert.equal(matches.length, 6);
  for (const item of matches) {
    assert.equal("score" in item, false);
    assert.equal("weight" in item, false);
    assert.equal("value" in item, false);
  }
});

test("search handles blank queries and clamps custom limits", () => {
  const nodes = [
    node("notion:history-1", "历史一"),
    node("notion:history-2", "历史二"),
    node("notion:history-3", "历史三"),
  ];

  assert.deepEqual(findPhilosophyHomeMatches(nodes, "   "), []);
  assert.equal(findPhilosophyHomeMatches(nodes, "历史", 2.9).length, 2);
  assert.deepEqual(findPhilosophyHomeMatches(nodes, "历史", -1), []);
});
