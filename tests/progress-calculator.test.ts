import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateProgress,
  PROGRESS_CATEGORIES,
  PROGRESS_SCHEMA_VERSION,
  type ProgressAttempt,
  type ProgressCategory
} from "../src/lib/progress-calculator";

function attempt(
  id: string,
  category: ProgressCategory,
  data: Partial<ProgressAttempt>
): ProgressAttempt {
  return {
    id,
    category,
    occurredAt: "2026-06-04T00:00:00.000Z",
    kind: "concept-read",
    ...data
  };
}

function tier1SyntaxEvidence(): ProgressAttempt[] {
  return [
    ...Array.from({ length: 15 }, (_, index) =>
      attempt(`read-${index}`, "syntax", {
        kind: "concept-read",
        conceptId: `syntax-concept-${index}`
      })
    ),
    ...Array.from({ length: 10 }, (_, index) =>
      attempt(`recognition-${index}`, "syntax", {
        kind: "assessment",
        assessmentKind: "recognition",
        assessmentId: `syntax-recognition-${index}`
      })
    ),
    ...Array.from({ length: 8 }, (_, index) =>
      attempt(`standard-${index}`, "syntax", {
        kind: "code-run",
        codeExampleTitle: "standard",
        conceptId: `syntax-standard-${index}`
      })
    )
  ];
}

function tier2SyntaxEvidence(): ProgressAttempt[] {
  return [
    ...Array.from({ length: 5 }, (_, index) =>
      attempt(`timed-${index}`, "syntax", {
        kind: "assessment",
        assessmentKind: "timed-coding",
        assessmentId: `syntax-timed-${index}`
      })
    ),
    ...Array.from({ length: 3 }, (_, index) =>
      attempt(`pep8-${index}`, "syntax", {
        kind: "pep8",
        assessmentId: `syntax-pep8-${index}`
      })
    )
  ];
}

test("calculateProgress returns an 8 category matrix with schema version", () => {
  const snapshot = calculateProgress([]);

  assert.equal(snapshot.schemaVersion, PROGRESS_SCHEMA_VERSION);
  assert.deepEqual(Object.keys(snapshot.matrix), [...PROGRESS_CATEGORIES]);

  for (const category of PROGRESS_CATEGORIES) {
    assert.equal(snapshot.tiersByCategory[category], "none");
    assert.equal(snapshot.matrix[category].tier1.status, "empty");
    assert.equal(snapshot.matrix[category].tier2.status, "blocked");
    assert.equal(snapshot.matrix[category].tier3.status, "blocked");
    assert.equal(snapshot.matrix[category].tier4.status, "blocked");
  }
});

test("tier 1 requires concepts read, recognition passes, and standard code runs", () => {
  const snapshot = calculateProgress(tier1SyntaxEvidence());
  const tier1 = snapshot.matrix.syntax.tier1;

  assert.equal(tier1.status, "complete");
  assert.equal(tier1.progress, 1);
  assert.equal(snapshot.tiersByCategory.syntax, "tier1");
  assert.equal(snapshot.matrix.syntax.tier2.status, "empty");
  assert.deepEqual(
    snapshot.evidenceByCell["syntax:tier1"].map((requirement) => requirement.current),
    [15, 10, 8]
  );
});

test("higher tiers are blocked until previous tiers are complete", () => {
  const snapshot = calculateProgress(tier2SyntaxEvidence());

  assert.equal(snapshot.matrix.syntax.tier2.rawComplete, true);
  assert.equal(snapshot.matrix.syntax.tier2.status, "blocked");
  assert.equal(snapshot.tiersByCategory.syntax, "none");
  assert.equal(snapshot.activeFrontier[0].category, "syntax");
  assert.equal(snapshot.activeFrontier[0].tier, "tier1");
});

test("tier 2 becomes complete when tier 1 is complete first", () => {
  const snapshot = calculateProgress([
    ...tier1SyntaxEvidence(),
    ...tier2SyntaxEvidence()
  ]);

  assert.equal(snapshot.matrix.syntax.tier1.status, "complete");
  assert.equal(snapshot.matrix.syntax.tier2.status, "complete");
  assert.equal(snapshot.tiersByCategory.syntax, "tier2");
  assert.equal(snapshot.matrix.syntax.tier3.status, "empty");
});

test("tier 3 and tier 4 use project and advanced evidence", () => {
  const snapshot = calculateProgress([
    ...tier1SyntaxEvidence(),
    ...tier2SyntaxEvidence(),
    attempt("entry-project", "syntax", {
      kind: "project-complete",
      projectId: "python-basics-lab",
      projectStage: "entry"
    }),
    attempt("production-code", "syntax", {
      kind: "code-run",
      codeExampleTitle: "production",
      conceptId: "f-string"
    }),
    attempt("mid-project", "syntax", {
      kind: "project-complete",
      projectId: "text-analyzer",
      projectStage: "mid"
    }),
    attempt("reverse-1", "syntax", {
      kind: "reverse-recognition",
      assessmentId: "syntax-reverse-1"
    }),
    attempt("reverse-2", "syntax", {
      kind: "reverse-recognition",
      assessmentId: "syntax-reverse-2"
    }),
    attempt("cross-concept", "syntax", {
      kind: "cross-concept",
      assessmentId: "syntax-cross-1"
    })
  ]);

  assert.equal(snapshot.matrix.syntax.tier3.status, "complete");
  assert.equal(snapshot.matrix.syntax.tier4.status, "complete");
  assert.equal(snapshot.tiersByCategory.syntax, "tier4");
});

test("duplicate evidence is counted once by stable concept or assessment id", () => {
  const snapshot = calculateProgress([
    attempt("read-a", "function", {
      kind: "concept-read",
      conceptId: "function"
    }),
    attempt("read-b", "function", {
      kind: "concept-read",
      conceptId: "function"
    }),
    attempt("recognition-a", "function", {
      kind: "assessment",
      assessmentKind: "recognition",
      assessmentId: "function-model"
    }),
    attempt("recognition-b", "function", {
      kind: "assessment",
      assessmentKind: "recognition",
      assessmentId: "function-model"
    })
  ]);

  const tier1 = snapshot.matrix.function.tier1;
  assert.equal(tier1.requirements.find((item) => item.key === "conceptsRead")?.current, 1);
  assert.equal(tier1.requirements.find((item) => item.key === "recognitionPassed")?.current, 1);
});

test("failed attempts do not count as evidence but feed recent pattern summaries", () => {
  const snapshot = calculateProgress([
    attempt("failed-1", "function", {
      kind: "assessment",
      assessmentKind: "timed-coding",
      assessmentId: "function-timed-1",
      passed: false,
      pattern: "missing boundary check",
      occurredAt: "2026-06-04T10:00:00.000Z"
    }),
    attempt("failed-2", "function", {
      kind: "assessment",
      assessmentKind: "timed-coding",
      assessmentId: "function-timed-2",
      passed: false,
      pattern: "missing boundary check",
      occurredAt: "2026-06-04T11:00:00.000Z"
    }),
    attempt("failed-3", "function", {
      kind: "assessment",
      assessmentKind: "debugging",
      assessmentId: "function-debug-1",
      passed: false,
      pattern: "confuses return and print",
      occurredAt: "2026-06-04T12:00:00.000Z"
    })
  ]);

  assert.equal(snapshot.matrix.function.tier2.requirements[0].current, 0);
  assert.deepEqual(snapshot.recentPatterns.map((item) => [item.pattern, item.count]), [
    ["missing boundary check", 2],
    ["confuses return and print", 1]
  ]);
  assert.equal(snapshot.recentPatterns[0].lastSeenAt, "2026-06-04T11:00:00.000Z");
});

test("active frontier prefers earliest incomplete tier, then strongest progress", () => {
  const snapshot = calculateProgress([
    attempt("syntax-read-1", "syntax", {
      kind: "concept-read",
      conceptId: "f-string"
    }),
    attempt("function-read-1", "function", {
      kind: "concept-read",
      conceptId: "function"
    }),
    attempt("function-read-2", "function", {
      kind: "concept-read",
      conceptId: "function-parameters"
    })
  ]);

  assert.equal(snapshot.activeFrontier[0].category, "function");
  assert.equal(snapshot.activeFrontier[0].tier, "tier1");
  assert.equal(snapshot.activeFrontier[1].category, "syntax");
});
