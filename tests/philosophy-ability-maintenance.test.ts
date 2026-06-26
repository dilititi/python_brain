import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import matter from "gray-matter";

const expectedAbilityOrder = new Set([
  "linguistic",
  "logical_mathematical",
  "spatial",
  "musical",
  "bodily_kinesthetic",
  "interpersonal",
  "intrapersonal",
  "naturalistic",
  "existential"
]);

function readProjectFile(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function contentFiles(collection: string) {
  const dir = join(process.cwd(), "src", "content", collection);
  return readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => ({
      slug: file.replace(/\.mdx$/, ""),
      content: readFileSync(join(dir, file), "utf8")
    }));
}

function frontmatter(collection: string) {
  return contentFiles(collection).map((file) => ({
    slug: file.slug,
    data: matter(file.content).data
  }));
}

function assertBoundedAbilities(slug: string, abilities: unknown) {
  assert.ok(Array.isArray(abilities), `${slug} must have abilities`);
  assert.ok(abilities.length > 0, `${slug} must have at least one ability`);
  assert.ok(abilities.length <= 4, `${slug} must have at most four abilities`);
  for (const ability of abilities) {
    assert.equal(typeof ability, "string");
    assert.ok(expectedAbilityOrder.has(ability), `${slug} uses an unknown ability: ${ability}`);
  }
}

test("philosophy authoring docs capture Ability Lens tagging principles", () => {
  const docs = readProjectFile("docs", "philosophy-authoring.md");

  assert.match(docs, /Ability Lens 标注原则/);
  assert.match(docs, /abilities 只用于 questions \/ notions/);
  assert.match(docs, /每个内容最多 4 个/);
  assert.match(docs, /只标主要维度/);
  assert.match(docs, /total 不是分数/);
  assert.match(docs, /不要给 readings \/ understanding-claims 标 abilities/);
});

test("all active questions and core notions have bounded ability tags", () => {
  const activeStatuses = new Set(["open", "provisional", "active", "developing"]);
  const activeQuestions = frontmatter("questions").filter((entry) => activeStatuses.has(String(entry.data.status)));
  const notions = frontmatter("notions");

  assert.ok(activeQuestions.length > 0);
  for (const question of activeQuestions) {
    assertBoundedAbilities(`questions/${question.slug}`, question.data.abilities);
  }

  assert.ok(notions.length > 0);
  for (const notion of notions) {
    assertBoundedAbilities(`notions/${notion.slug}`, notion.data.abilities);
  }
});

test("what-is-understanding has a first-draft problem page instead of fixture prose", () => {
  const content = readProjectFile("src", "content", "questions", "what-is-understanding.mdx");

  assert.match(content, /## 第一版回答/);
  assert.match(content, /## 对照维度/);
  assert.match(content, /## 下一步阅读与验证/);
  assert.doesNotMatch(content, /作为未标注能力维度的工作台样本/);
});

test("what-is-history essay contains concrete argument paragraphs", () => {
  const essay = readProjectFile("src", "pages", "questions", "what-is-history", "essay.astro");

  assert.match(essay, /历史不是一种答案，而是一组尺度选择/);
  assert.match(essay, /福柯让我放弃的是/);
  assert.match(essay, /我现在更愿意把历史理解为/);
});

test("core understanding claims have supplemented evidence, gaps, and next tasks", () => {
  const claims = frontmatter("understanding-claims");

  assert.ok(claims.length > 0);
  for (const claim of claims) {
    assert.ok(Array.isArray(claim.data.evidence) && claim.data.evidence.length >= 4, `${claim.slug} needs at least four evidence items`);
    assert.ok(Array.isArray(claim.data.gaps) && claim.data.gaps.length >= 3, `${claim.slug} needs at least three gaps`);
    assert.ok(Array.isArray(claim.data.nextTasks) && claim.data.nextTasks.length >= 3, `${claim.slug} needs at least three next tasks`);
  }
});
