import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import test from "node:test";

async function loadAuthoring() {
  try {
    return await import("../src/lib/philosophy-authoring");
  } catch (error) {
    assert.fail(`philosophy authoring helpers are unavailable: ${String(error)}`);
  }
}

test("philosophy ids use stable collection-specific slug formats", async () => {
  const { assertPhilosophyId } = await loadAuthoring();

  assert.doesNotThrow(() => assertPhilosophyId("questions", "what-is-history"));
  assert.doesNotThrow(() => (
    assertPhilosophyId("entries", "2026-06-22-foucault-subject-resistance")
  ));
  assert.throws(
    () => assertPhilosophyId("questions", "What_Is_History"),
    /kebab-case/
  );
  assert.throws(
    () => assertPhilosophyId("entries", "foucault-subject-resistance"),
    /YYYY-MM-DD/
  );
});

test("question template is a buildable open question workspace", async () => {
  const { renderQuestionTemplate } = await loadAuthoring();
  const content = renderQuestionTemplate({
    id: "what-is-freedom",
    title: "自由是什么？",
    date: "2026-06-22"
  });

  assert.match(content, /title: "自由是什么？"/);
  assert.match(content, /status: open/);
  assert.match(content, /updatedAt: "2026-06-22"/);
  assert.match(content, /currentAnswer: "尚未形成暂定回答。"/);
  assert.match(content, /dimensions: \[\]/);
  assert.match(content, /relatedReadings: \[\]/);
  assert.match(content, /## 不同理论如何回答/);
  assert.match(content, /## 还剩哪些未解决的问题/);
  assert.doesNotMatch(content, /TODO|待补|暂无说明/);
});

test("source template requires a real URL and links back to a question", async () => {
  const { renderSourceTemplate } = await loadAuthoring();
  const content = renderSourceTemplate({
    id: "history-methods-overview",
    title: "History Methods Overview",
    url: "https://example.com/history-methods",
    type: "article",
    summary: "梳理历史研究中的解释方法。",
    whySaved: "用于比较不同理论怎样组织历史证据。",
    question: "what-is-history"
  });

  assert.match(content, /url: "https:\/\/example\.com\/history-methods"/);
  assert.match(content, /type: article/);
  assert.match(content, /status: saved/);
  assert.match(content, /relatedQuestions:\n  - what-is-history/);
  assert.match(content, /summary: "梳理历史研究中的解释方法。"/);
  assert.throws(
    () => renderSourceTemplate({
      id: "bad-source",
      title: "Bad source",
      url: "http://example.com",
      type: "article",
      summary: "摘要",
      whySaved: "保存理由",
      question: "what-is-history"
    }),
    /https:\/\//
  );
});

test("understanding claim template starts a draft evidence file", async () => {
  const { renderUnderstandingClaimTemplate } = await loadAuthoring();
  const content = renderUnderstandingClaimTemplate({
    id: "v36-understanding-claim",
    title: "我理解权力知识了吗？",
    date: "2026-06-23"
  });

  assert.match(content, /title: "我理解权力知识了吗？"/);
  assert.match(content, /targetType: "notion"/);
  assert.match(content, /target: ""/);
  assert.match(content, /claim: ""/);
  assert.match(content, /status: "draft"/);
  assert.match(content, /confidence: "medium"/);
  assert.match(content, /relatedQuestions: \[\]/);
  assert.match(content, /relatedNotions: \[\]/);
  assert.match(content, /relatedPerspectives: \[\]/);
  assert.match(content, /relatedReadings: \[\]/);
  assert.match(content, /relatedSources: \[\]/);
  assert.match(content, /relatedEntries: \[\]/);
  assert.match(content, /evidence: \[\]/);
  assert.match(content, /gaps: \[\]/);
  assert.match(content, /counterEvidence: \[\]/);
  assert.match(content, /nextTasks: \[\]/);
  assert.match(content, /createdAt: "2026-06-23"/);
  assert.match(content, /updatedAt: "2026-06-23"/);
  assert.match(content, /## 理解主张说明/);
  assert.match(content, /## 当前证据/);
  assert.match(content, /## 当前缺口/);
  assert.match(content, /## 下一步任务/);
});

function runNpm(args: string[]) {
  return process.platform === "win32"
    ? spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", "npm", ...args], {
        cwd: process.cwd(),
        encoding: "utf8"
      })
    : spawnSync("npm", args, { cwd: process.cwd(), encoding: "utf8" });
}

test("question CLI dry-run prints a template without writing content", () => {
  const id = "v13-dry-run-question";
  const target = join(process.cwd(), "src", "content", "questions", `${id}.mdx`);
  rmSync(target, { force: true });

  const result = runNpm([
    "run",
    "new:question",
    "--",
    `--id=${id}`,
    "--title=V1.3 Dry Run Question",
    "--date=2026-06-22",
    "--dry-run"
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /title: "V1\.3 Dry Run Question"/);
  assert.match(result.stdout, /status: open/);
  assert.equal(existsSync(target), false);
});

test("source CLI dry-run renders its question relation and rejects bad ids", () => {
  const validId = "v13-dry-run-source";
  const validTarget = join(process.cwd(), "src", "content", "sources", `${validId}.mdx`);
  const invalidTarget = join(process.cwd(), "src", "content", "sources", "Bad_Source.mdx");
  rmSync(validTarget, { force: true });
  rmSync(invalidTarget, { force: true });

  const valid = runNpm([
    "run",
    "new:source",
    "--",
    `--id=${validId}`,
    "--title=V1.3 Dry Run Source",
    "--url=https://example.com/source",
    "--type=article",
    "--summary=用于测试 source 模板。",
    "--why-saved=用于验证作者工作流。",
    "--question=what-is-history",
    "--dry-run"
  ]);

  assert.equal(valid.status, 0, valid.stderr || valid.stdout);
  assert.match(valid.stdout, /relatedQuestions:\r?\n  - what-is-history/);
  assert.equal(existsSync(validTarget), false);

  const invalid = runNpm([
    "run",
    "new:source",
    "--",
    "--id=Bad_Source",
    "--title=Bad Source",
    "--url=https://example.com/source",
    "--type=article",
    "--summary=摘要",
    "--why-saved=保存理由",
    "--question=what-is-history",
    "--dry-run"
  ]);

  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /kebab-case/);
  assert.equal(existsSync(invalidTarget), false);
});

test("understanding claim CLI dry-run and create use the standard template", () => {
  const id = "v36-understanding-claim-cli";
  const target = join(process.cwd(), "src", "content", "understanding-claims", `${id}.mdx`);
  rmSync(target, { force: true });

  const dryRun = runNpm([
    "run",
    "new:understanding-claim",
    "--",
    `--id=${id}`,
    "--title=V3.6 Understanding Claim",
    "--date=2026-06-23",
    "--dry-run"
  ]);

  assert.equal(dryRun.status, 0, dryRun.stderr || dryRun.stdout);
  assert.match(dryRun.stdout, /title: "V3\.6 Understanding Claim"/);
  assert.match(dryRun.stdout, /status: "draft"/);
  assert.match(dryRun.stdout, /## 当前证据/);
  assert.equal(existsSync(target), false);

  const created = runNpm([
    "run",
    "new:understanding-claim",
    "--",
    `--id=${id}`,
    "--title=V3.6 Understanding Claim",
    "--date=2026-06-23",
    "--skip-validate"
  ]);

  try {
    assert.equal(created.status, 0, created.stderr || created.stdout);
    assert.match(created.stdout, /Created src[\\/]content[\\/]understanding-claims[\\/]v36-understanding-claim-cli\.mdx/);
    assert.equal(existsSync(target), true);
  } finally {
    rmSync(target, { force: true });
  }
});
