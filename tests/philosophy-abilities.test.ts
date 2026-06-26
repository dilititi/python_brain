import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const expectedAbilityOrder = [
  "linguistic",
  "logical_mathematical",
  "spatial",
  "musical",
  "bodily_kinesthetic",
  "interpersonal",
  "intrapersonal",
  "naturalistic",
  "existential"
] as const;

async function loadAbilitiesMeta() {
  try {
    return await import("../src/data/philosophy/abilities");
  } catch (error) {
    assert.fail(`Ability metadata is unavailable: ${String(error)}`);
  }
}

async function loadAbilityGrouping() {
  try {
    return await import("../src/lib/philosophy-abilities");
  } catch (error) {
    assert.fail(`Ability grouping helper is unavailable: ${String(error)}`);
  }
}

function readProjectFile(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function frontmatterOf(content: string) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match?.[1] ?? "";
}

function abilitiesFromFrontmatter(frontmatter: string) {
  const match = frontmatter.match(/^abilities:\r?\n((?:\s+-\s+[-_a-z]+\r?\n?)+)/m);
  if (!match) return [];
  return [...match[1].matchAll(/-\s+([-_a-z]+)/g)].map((item) => item[1]);
}

test("abilityDimensionOrder and abilityDimensionMeta stay aligned", async () => {
  const { abilityDimensionOrder, abilityDimensionMeta } = await loadAbilitiesMeta();

  assert.deepEqual(abilityDimensionOrder, expectedAbilityOrder);
  assert.deepEqual(Object.keys(abilityDimensionMeta), [...expectedAbilityOrder]);
  assert.equal(abilityDimensionMeta.linguistic.label, "语言智能");
  assert.equal(abilityDimensionMeta.logical_mathematical.label, "逻辑—数学智能");
  assert.equal(abilityDimensionMeta.existential.label, "存在智能");
  for (const ability of abilityDimensionOrder) {
    assert.equal(typeof abilityDimensionMeta[ability].shortLabel, "string");
    assert.ok(abilityDimensionMeta[ability].description.length > 10);
    assert.doesNotMatch(
      abilityDimensionMeta[ability].description,
      /评分|指数|智能水平|训练强度|能力得分|我的智能画像/
    );
  }
});

test("groupPhilosophyContentByAbility aggregates notions and questions without scores", async () => {
  const { groupPhilosophyContentByAbility } = await loadAbilityGrouping();
  const groups = groupPhilosophyContentByAbility({
    notions: [
      { id: "power-knowledge", data: { title: "权力 / 知识", abilities: ["interpersonal", "linguistic"] } },
      { id: "unmarked-notion", data: { title: "未标注概念", abilities: [] } }
    ],
    questions: [
      { id: "what-is-history", data: { title: "历史是什么？", abilities: ["existential", "linguistic"] } },
      { id: "unmarked-question", data: { title: "未标注问题", abilities: [] } }
    ]
  });

  assert.equal(groups.length, expectedAbilityOrder.length);
  assert.deepEqual(groups.map((group) => group.ability), [...expectedAbilityOrder]);
  const linguistic = groups.find((group) => group.ability === "linguistic");
  assert.ok(linguistic);
  assert.equal(linguistic.total, 2);
  assert.deepEqual(linguistic.notions.map((notion) => notion.id), ["power-knowledge"]);
  assert.deepEqual(linguistic.questions.map((question) => question.id), ["what-is-history"]);

  const musical = groups.find((group) => group.ability === "musical");
  assert.ok(musical);
  assert.equal(musical.total, 0);
  assert.deepEqual(musical.notions, []);
  assert.deepEqual(musical.questions, []);
  assert.equal("score" in linguistic, false);
  assert.equal("weight" in linguistic, false);
});

test("philosophy schema adds max-four abilities only to notions and questions", () => {
  const source = readProjectFile("src", "content.philosophy.ts");

  assert.match(source, /abilityDimensionOrder,\s*type AbilityDimension/s);
  assert.match(source, /const abilityDimension = z\.enum\(\s*\[\.\.\.abilityDimensionOrder\] as \[AbilityDimension, \.\.\.AbilityDimension\[\]\]\s*\)/s);

  const notionsBlock = source.slice(source.indexOf("const notions = defineCollection"), source.indexOf("const questionDimension"));
  const questionsBlock = source.slice(source.indexOf("const questionSchema = z"), source.indexOf("const questions = defineCollection"));
  assert.match(notionsBlock, /abilities:\s*z\.array\(abilityDimension\)\.max\(4\)\.default\(\[\]\)/);
  assert.match(questionsBlock, /abilities:\s*z\.array\(abilityDimension\)\.max\(4\)\.default\(\[\]\)/);

  const forbiddenBlocks = [
    ["perspectives", source.slice(source.indexOf("const perspectives = defineCollection"), source.indexOf("const readings = defineCollection"))],
    ["readings", source.slice(source.indexOf("const readings = defineCollection"), source.indexOf("const notions = defineCollection"))],
    ["entries", source.slice(source.indexOf("const entries = defineCollection"), source.indexOf("const understandingClaimTargetType"))],
    ["understanding-claims", source.slice(source.indexOf("const understandingClaims = defineCollection"), source.indexOf("export const philosophyCollections"))]
  ] as const;

  for (const [name, block] of forbiddenBlocks) {
    assert.doesNotMatch(block, /abilities:/, `${name} must not receive abilities`);
  }
});

test("existing question and at least five notions are manually tagged with at most four abilities", () => {
  const question = frontmatterOf(readProjectFile("src", "content", "questions", "what-is-history.mdx"));
  assert.deepEqual(abilitiesFromFrontmatter(question), [
    "existential",
    "linguistic",
    "logical_mathematical",
    "intrapersonal"
  ]);

  const notionFiles = readdirSync(join(process.cwd(), "src", "content", "notions"))
    .filter((file) => file.endsWith(".mdx"));
  const taggedNotions = notionFiles
    .map((file) => ({
      slug: file.replace(/\.mdx$/, ""),
      abilities: abilitiesFromFrontmatter(frontmatterOf(readProjectFile("src", "content", "notions", file)))
    }))
    .filter((notion) => notion.abilities.length > 0);

  assert.ok(taggedNotions.length >= 5);
  for (const notion of taggedNotions) {
    assert.ok(notion.abilities.length <= 4, `${notion.slug} has more than four abilities`);
    for (const ability of notion.abilities) {
      assert.ok(expectedAbilityOrder.includes(ability as typeof expectedAbilityOrder[number]));
    }
  }
});

test("Ability Lens does not introduce KnowledgeNode, weights, or scoring vocabulary", () => {
  const relevantFiles = [
    ["src", "data", "philosophy", "abilities.ts"],
    ["src", "lib", "philosophy-abilities.ts"],
    ["src", "components", "philosophy", "AbilityTags.astro"],
    ["src", "pages", "philosophy", "abilities.astro"]
  ];

  for (const parts of relevantFiles) {
    const content = readProjectFile(...parts);
    assert.doesNotMatch(content, /KnowledgeNode/);
    assert.doesNotMatch(content, /\bweights?\b|评分|智能指数|智能水平|训练强度|我的智能画像/);
  }
});
