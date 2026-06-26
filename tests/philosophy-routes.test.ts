import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

test("question essay link is only exposed for questions with an existing essay route", () => {
  const questionPage = readFileSync(
    join(process.cwd(), "src", "pages", "questions", "[slug].astro"),
    "utf8"
  );
  const essayPage = join(process.cwd(), "src", "pages", "questions", "what-is-history", "essay.astro");

  assert.equal(existsSync(essayPage), true);
  assert.match(questionPage, /entry\.id\s*===\s*"what-is-history"/);
  assert.match(questionPage, /href="\/questions\/what-is-history\/essay\/"/);
  assert.doesNotMatch(questionPage, /href=\{`\/questions\/\$\{entry\.id\}\/essay\/`\}/);
});

test("question local map schema and fixture enable the detail panel variant", () => {
  const schema = readFileSync(join(process.cwd(), "src", "content.philosophy.ts"), "utf8");
  const question = readFileSync(join(process.cwd(), "src", "content", "questions", "what-is-history.mdx"), "utf8");

  assert.match(schema, /variant:\s*z\.enum\(\[\s*"summary",\s*"detail-panel",\s*"object-map"\s*\]\)\.default\("summary"\)/s);
  assert.match(schema, /showDetailPanel:\s*z\.boolean\(\)\.default\(true\)/);
  assert.match(schema, /note:\s*z\.string\(\)\.optional\(\)/);
  assert.match(schema, /localMap:\s*questionLocalMapSchema/);

  assert.match(question, /localMap:\r?\n/);
  assert.match(question, /variant:\s*"detail-panel"/);
  assert.match(question, /showDetailPanel:\s*true/);
});
