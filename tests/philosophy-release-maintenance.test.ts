import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

test("authoring guide explains how the graph-first homepage is generated", () => {
  const guide = readFileSync(join(process.cwd(), "docs", "philosophy-authoring.md"), "utf8");

  assert.match(guide, /## 首页图谱如何生成/);
  assert.match(guide, /buildPhilosophyHomeGraph/);
  assert.match(guide, /questions.*notions.*readings.*sources.*entries.*understanding-claims.*perspectives/s);
  assert.match(guide, /一阶邻居/);
  assert.match(guide, /slug 字符串/);
});

test("changelog records the graph homepage release and V4.9 polish", () => {
  const changelogPath = join(process.cwd(), "CHANGELOG.md");
  assert.equal(existsSync(changelogPath), true, "CHANGELOG.md should exist");

  const changelog = readFileSync(changelogPath, "utf8");
  assert.match(changelog, /V4\.9/);
  assert.match(changelog, /Graph-first Homepage/i);
  assert.match(changelog, /导航|navigation/i);
  assert.match(changelog, /测试|verified|verification/i);
});
