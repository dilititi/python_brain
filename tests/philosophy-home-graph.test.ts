import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import {
  buildPhilosophyHomeGraph,
  type PhilosophyHomeNodeKind,
} from "../src/lib/philosophy-home-graph";
import { findPhilosophyHomeMatches } from "../src/lib/philosophy-home-search";

async function loadPublishedCollection(directoryName: string) {
  const directory = fileURLToPath(
    new URL(`../src/content/${directoryName}/`, import.meta.url),
  );
  const files = (await readdir(directory)).filter((file) => /\.mdx?$/.test(file));

  return Promise.all(files.map(async (file) => ({
    id: file.replace(/\.mdx?$/, ""),
    data: matter(await readFile(`${directory}/${file}`, "utf8")).data,
  })));
}

async function loadPublishedGraph() {
  const [
    questions,
    notions,
    readings,
    sources,
    entries,
    understandingClaims,
    perspectives,
  ] = await Promise.all([
    loadPublishedCollection("questions"),
    loadPublishedCollection("notions"),
    loadPublishedCollection("readings"),
    loadPublishedCollection("sources"),
    loadPublishedCollection("entries"),
    loadPublishedCollection("understanding-claims"),
    loadPublishedCollection("perspectives"),
  ]);

  return buildPhilosophyHomeGraph({
    questions,
    notions,
    readings,
    sources,
    entries,
    understandingClaims,
    perspectives,
  } as unknown as Parameters<typeof buildPhilosophyHomeGraph>[0]);
}

function neighborIds(
  graph: ReturnType<typeof buildPhilosophyHomeGraph>,
  nodeId: string,
): Set<string> {
  return new Set(graph.edges
    .filter((edge) => edge.source === nodeId || edge.target === nodeId)
    .map((edge) => edge.source === nodeId ? edge.target : edge.source));
}

function fixture(): Parameters<typeof buildPhilosophyHomeGraph>[0] {
  return {
    questions: [
      {
        id: "what-is-history",
        data: {
          title: "历史是什么？",
          currentAnswer: "历史由局部制度、实践与叙事共同形成。",
          status: "provisional",
          abilities: ["linguistic"],
          relatedReadings: ["discipline-and-punish"],
          relatedNotions: ["power-knowledge"],
          stances: [{ perspective: "foucault" }],
        },
      },
    ],
    notions: [
      {
        id: "power-knowledge",
        data: {
          title: "权力 / 知识",
          summary: "知识与权力在制度实践中共同形成。",
          abilities: ["linguistic"],
          relatedQuestions: ["what-is-history"],
        },
      },
    ],
    readings: [
      {
        id: "discipline-and-punish",
        data: {
          title: "规训与惩罚",
          status: "finished",
          relatedQuestions: ["what-is-history"],
        },
      },
    ],
    sources: [
      {
        id: "history-overview",
        data: {
          title: "历史哲学导论",
          summary: "历史哲学的问题地图。",
          status: "skimmed",
          reliability: "high",
          relatedQuestions: ["what-is-history"],
        },
      },
    ],
    entries: [
      {
        id: "2026-06-21-foucault-history-discontinuity",
        data: {
          title: "从统一方向到局部规律",
          date: "2026-06-21",
          question: "what-is-history",
        },
      },
    ],
    understandingClaims: [
      {
        id: "foucault-power-knowledge-claim",
        data: {
          title: "我理解福柯的权力 / 知识了吗？",
          claim: "权力与知识共同生产对象、主体与判断规则。",
          status: "testing",
          confidence: "medium",
          relatedQuestions: ["what-is-history"],
          relatedNotions: ["power-knowledge"],
          relatedReadings: ["discipline-and-punish"],
          relatedSources: ["history-overview"],
          relatedEntries: ["2026-06-21-foucault-history-discontinuity"],
          relatedPerspectives: ["foucault"],
          evidence: [
            {
              type: "close-reading",
              refType: "reading",
              ref: "discipline-and-punish",
              note: "文本证据",
              strength: "strong",
            },
            {
              type: "reflection",
              refType: "entry",
              ref: "2026-06-21-foucault-history-discontinuity",
              note: "立场变化证据",
              strength: "moderate",
            },
          ],
        },
      },
    ],
    perspectives: [
      {
        id: "foucault",
        data: {
          title: "福柯",
          summary: "从断裂、话语和制度技术理解历史。",
          keyNotions: ["power-knowledge"],
          readings: ["discipline-and-punish"],
        },
      },
    ],
  } as unknown as Parameters<typeof buildPhilosophyHomeGraph>[0];
}

test("builds the seven philosophy node kinds with prefixed ids", () => {
  const graph = buildPhilosophyHomeGraph(fixture());
  const kinds = new Set(graph.nodes.map((node) => node.kind));
  const expectedKinds: PhilosophyHomeNodeKind[] = [
    "question",
    "notion",
    "reading",
    "source",
    "entry",
    "understanding-claim",
    "perspective",
  ];

  assert.deepEqual([...kinds].sort(), [...expectedKinds].sort());
  assert.equal(graph.nodes.length, expectedKinds.length);
  assert.ok(graph.nodes.every((node) => node.id.startsWith(`${node.kind === "understanding-claim" ? "claim" : node.kind}:`)));
});

test("uses what-is-history as the default center and keeps graph nodes free of ranking fields", () => {
  const graph = buildPhilosophyHomeGraph(fixture());

  assert.equal(graph.defaultCenterId, "question:what-is-history");
  for (const node of graph.nodes) {
    assert.equal("weight" in node, false);
    assert.equal("score" in node, false);
    assert.equal("value" in node, false);
    assert.equal("abilityScore" in node, false);
  }
});

test("builds question relations and safely deduplicates reciprocal declarations", () => {
  const graph = buildPhilosophyHomeGraph(fixture());
  const relations = new Set(
    graph.edges.map((edge) => `${edge.source}|${edge.target}|${edge.kind}`),
  );

  assert.ok(relations.has("question:what-is-history|notion:power-knowledge|question-notion"));
  assert.ok(relations.has("question:what-is-history|reading:discipline-and-punish|question-reading"));
  assert.ok(relations.has("question:what-is-history|source:history-overview|question-source"));
  assert.ok(relations.has("question:what-is-history|entry:2026-06-21-foucault-history-discontinuity|question-entry"));
  assert.ok(relations.has("question:what-is-history|claim:foucault-power-knowledge-claim|question-claim"));
  assert.ok(relations.has("question:what-is-history|perspective:foucault|question-perspective"));
  assert.equal(relations.size, graph.edges.length);
});

test("builds claim evidence links and perspective relations", () => {
  const graph = buildPhilosophyHomeGraph(fixture());
  const relations = new Set(
    graph.edges.map((edge) => `${edge.source}|${edge.target}|${edge.kind}`),
  );

  assert.ok(relations.has("claim:foucault-power-knowledge-claim|reading:discipline-and-punish|claim-reading"));
  assert.ok(relations.has("claim:foucault-power-knowledge-claim|entry:2026-06-21-foucault-history-discontinuity|claim-entry"));
  assert.ok(relations.has("perspective:foucault|notion:power-knowledge|perspective-notion"));
  assert.ok(relations.has("perspective:foucault|reading:discipline-and-punish|perspective-reading"));
});

test("the view model remains separate from content schema concepts", async () => {
  const sourcePath = fileURLToPath(new URL("../src/lib/philosophy-home-graph.ts", import.meta.url));
  const source = await readFile(sourcePath, "utf8");

  assert.doesNotMatch(source, /KnowledgeNode/);
  assert.doesNotMatch(source, /defineCollection/);
});

test("published history graph exposes a representative first-hop neighborhood", async () => {
  const graph = await loadPublishedGraph();
  const neighbors = neighborIds(graph, "question:what-is-history");

  assert.equal(graph.defaultCenterId, "question:what-is-history");
  assert.ok(neighbors.size >= 4);
  for (const expected of [
    "notion:philosophy-of-history",
    "notion:power-knowledge",
    "notion:structure",
    "notion:dialectic",
    "reading:discipline-and-punish",
    "claim:foucault-power-knowledge-claim",
    "perspective:foucault",
  ]) {
    assert.ok(neighbors.has(expected), `default center should connect to ${expected}`);
  }
});

test("published key nodes are connected and provide useful inspector descriptions", async () => {
  const graph = await loadPublishedGraph();
  const keyNodeIds = [
    "question:what-is-history",
    "question:what-is-understanding",
    "claim:foucault-power-knowledge-claim",
    "reading:discipline-and-punish",
    "perspective:foucault",
    "notion:philosophy-of-history",
    "notion:power-knowledge",
    "notion:structure",
    "notion:dialectic",
  ];

  for (const nodeId of keyNodeIds) {
    const node = graph.nodes.find((candidate) => candidate.id === nodeId);
    assert.ok(node, `${nodeId} should exist`);
    assert.ok(neighborIds(graph, nodeId).size > 0, `${nodeId} should not be isolated`);
    assert.ok(node.description?.trim(), `${nodeId} should have an inspector description`);
  }
});

test("published graph search reaches the four core inquiry clusters", async () => {
  const graph = await loadPublishedGraph();
  const matches = (query: string) => new Set(
    findPhilosophyHomeMatches(graph.nodes, query).map((node) => node.id),
  );

  assert.ok(
    matches("历史").has("question:what-is-history")
      || matches("历史").has("notion:philosophy-of-history"),
  );
  assert.ok([...matches("福柯")].some((id) =>
    id === "perspective:foucault"
      || id === "claim:foucault-power-knowledge-claim"
      || id === "reading:discipline-and-punish"));
  assert.ok(
    matches("权力").has("notion:power-knowledge")
      || matches("权力").has("claim:foucault-power-knowledge-claim"),
  );
  assert.ok(matches("理解").has("question:what-is-understanding"));
});
