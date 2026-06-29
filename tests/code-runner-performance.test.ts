import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

test("CodeRunner does not force a hidden-runner layout probe during initial load", () => {
  const source = readFileSync(
    join(process.cwd(), "src", "components", "astro", "CodeRunner.astro"),
    "utf8"
  );

  assert.doesNotMatch(source, /setTimeout\(bindVisibleRunners\s*,\s*0\)/);
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /requestAnimationFrame\(bindVisibleRunners\)/);
});

test("Lighthouse uses a median of three runs without lowering the performance gate", () => {
  const config = JSON.parse(readFileSync(join(process.cwd(), "lighthouserc.json"), "utf8"));
  const performanceAssertion = config.ci.assert.assertions["categories:performance"];

  assert.equal(config.ci.collect.numberOfRuns, 3);
  assert.deepEqual(performanceAssertion, ["error", { minScore: 0.9 }]);
});
