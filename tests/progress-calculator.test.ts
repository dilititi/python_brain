import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateProgress,
  PROGRESS_CATEGORIES,
  PROGRESS_SCHEMA_VERSION,
  weeklySummary,
  type ProgressCategoryConfigItem,
  type ProgressAttempt,
  type ProgressCategory
} from "../src/lib/progress-calculator";
import { emptyProgressCategoryConfig } from "../src/lib/progress-config";

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
    ...Array.from({ length: 6 }, (_, index) =>
      attempt(`read-${index}`, "syntax", {
        kind: "concept-read",
        conceptId: `syntax-concept-${index}`
      })
    ),
    ...Array.from({ length: 1 }, (_, index) =>
      attempt(`recognition-${index}`, "syntax", {
        kind: "assessment",
        assessmentKind: "recognition",
        assessmentId: `syntax-recognition-${index}`
      })
    ),
    ...Array.from({ length: 6 }, (_, index) =>
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
    ...Array.from({ length: 1 }, (_, index) =>
      attempt(`timed-${index}`, "syntax", {
        kind: "assessment",
        assessmentKind: "timed-coding",
        assessmentId: `syntax-timed-${index}`
      })
    )
  ];
}

function categoryConfig(
  overrides: Partial<Record<ProgressCategory, Partial<ProgressCategoryConfigItem>>> = {}
) {
  const config = emptyProgressCategoryConfig();

  for (const [category, override] of Object.entries(overrides) as Array<[
    ProgressCategory,
    Partial<ProgressCategoryConfigItem>
  ]>) {
    config[category] = {
      ...config[category],
      ...override,
      assessmentCounts: {
        ...config[category].assessmentCounts,
        ...override.assessmentCounts
      }
    };
  }

  return config;
}

const syntaxConfig = categoryConfig({
  syntax: {
    conceptCount: 6,
    assessmentCounts: {
      recognition: 1,
      "timed-coding": 1
    },
    standardCodeCount: 6,
    productionCodeCount: 1,
    entryProjectCount: 1,
    midOrCapstoneProjectCount: 1
  }
});

test("calculateProgress returns an 8 category matrix with schema version", () => {
  const snapshot = calculateProgress([], emptyProgressCategoryConfig());

  assert.equal(snapshot.schemaVersion, PROGRESS_SCHEMA_VERSION);
  assert.deepEqual(Object.keys(snapshot.matrix), [...PROGRESS_CATEGORIES]);

  for (const category of PROGRESS_CATEGORIES) {
    assert.equal(snapshot.tiersByCategory[category], "none");
    assert.equal(snapshot.matrix[category].tier1.status, "n/a");
    assert.equal(snapshot.matrix[category].tier2.status, "n/a");
    assert.equal(snapshot.matrix[category].tier3.status, "n/a");
    assert.equal(snapshot.matrix[category].tier4.status, "n/a");
  }
});

test("tier 1 uses concepts, recognition, completion, and standard code evidence", () => {
  const snapshot = calculateProgress(tier1SyntaxEvidence(), syntaxConfig);
  const tier1 = snapshot.matrix.syntax.tier1;

  assert.equal(tier1.status, "complete");
  assert.equal(tier1.progress, 1);
  assert.equal(snapshot.tiersByCategory.syntax, "tier1");
  assert.equal(snapshot.matrix.syntax.tier2.status, "empty");
  assert.deepEqual(
    snapshot.evidenceByCell["syntax:tier1"].map((requirement) => requirement.current),
    [6, 1, 0, 6]
  );
  assert.deepEqual(
    snapshot.evidenceByCell["syntax:tier1"].map((requirement) => requirement.target),
    [6, 1, 0, 6]
  );
});

test("higher tiers are blocked until previous tiers are complete", () => {
  const snapshot = calculateProgress(tier2SyntaxEvidence(), syntaxConfig);

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
  ], syntaxConfig);

  assert.equal(snapshot.matrix.syntax.tier1.status, "complete");
  assert.equal(snapshot.matrix.syntax.tier2.status, "complete");
  assert.equal(snapshot.tiersByCategory.syntax, "tier2");
  assert.equal(snapshot.matrix.syntax.tier3.status, "empty");
  assert.deepEqual(
    snapshot.matrix.syntax.tier2.requirements.map((requirement) => requirement.target),
    [0, 1, 0]
  );
});

test("debugging completion and refactor assessments contribute to the matrix", () => {
  const attempts = [
    ...Array.from({ length: 5 }, (_, index) =>
      attempt(`completion-${index}`, "syntax", {
        kind: "assessment",
        assessmentKind: "completion",
        assessmentId: `syntax-completion-${index}`
      })
    ),
    ...Array.from({ length: 5 }, (_, index) =>
      attempt(`debugging-${index}`, "syntax", {
        kind: "assessment",
        assessmentKind: "debugging",
        assessmentId: `syntax-debugging-${index}`
      })
    ),
    ...Array.from({ length: 5 }, (_, index) =>
      attempt(`refactor-${index}`, "syntax", {
        kind: "assessment",
        assessmentKind: "refactor",
        assessmentId: `syntax-refactor-${index}`
      })
    )
  ];
  const snapshot = calculateProgress(attempts, categoryConfig({
    syntax: {
      assessmentCounts: {
        completion: 5,
        debugging: 5,
        refactor: 5
      }
    }
  }));

  assert.equal(snapshot.matrix.syntax.tier1.status, "complete");
  assert.equal(snapshot.matrix.syntax.tier2.status, "complete");
  assert.equal(snapshot.matrix.syntax.tier3.status, "complete");
  assert.equal(snapshot.tiersByCategory.syntax, "tier3");
  assert.deepEqual(
    snapshot.matrix.syntax.tier1.requirements.map((requirement) => requirement.current),
    [0, 0, 5, 0]
  );
  assert.deepEqual(
    snapshot.matrix.syntax.tier2.requirements.map((requirement) => requirement.current),
    [5, 0, 0]
  );
  assert.deepEqual(
    snapshot.matrix.syntax.tier3.requirements.map((requirement) => requirement.current),
    [0, 0, 5]
  );
  assert.deepEqual(
    snapshot.matrix.syntax.tier3.requirements.map((requirement) => requirement.target),
    [0, 0, 5]
  );
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
  ], syntaxConfig);

  assert.equal(snapshot.matrix.syntax.tier3.status, "complete");
  assert.equal(snapshot.matrix.syntax.tier4.status, "complete");
  assert.equal(snapshot.tiersByCategory.syntax, "tier4");
  assert.deepEqual(
    snapshot.matrix.syntax.tier4.requirements.map((requirement) => requirement.target),
    [1, 0, 0]
  );
});

test("n/a tiers are transparent when later tier evidence is complete", () => {
  const config = categoryConfig({
    stdlib: {
      conceptCount: 4,
      standardCodeCount: 4,
      productionCodeCount: 1,
      entryProjectCount: 1
    }
  });
  const attempts = [
    ...Array.from({ length: 4 }, (_, index) =>
      attempt(`stdlib-read-${index}`, "stdlib", {
        kind: "concept-read",
        conceptId: `stdlib-concept-${index}`
      })
    ),
    ...Array.from({ length: 4 }, (_, index) =>
      attempt(`stdlib-standard-${index}`, "stdlib", {
        kind: "code-run",
        codeExampleTitle: "standard",
        conceptId: `stdlib-standard-${index}`
      })
    ),
    attempt("stdlib-entry-project", "stdlib", {
      kind: "project-complete",
      projectId: "python-basics-lab",
      projectStage: "entry"
    }),
    attempt("stdlib-production", "stdlib", {
      kind: "code-run",
      codeExampleTitle: "production",
      conceptId: "json"
    })
  ];
  const snapshot = calculateProgress(attempts, config);

  assert.equal(snapshot.matrix.stdlib.tier1.status, "complete");
  assert.equal(snapshot.matrix.stdlib.tier2.status, "n/a");
  assert.equal(snapshot.matrix.stdlib.tier3.rawComplete, true);
  assert.equal(snapshot.matrix.stdlib.tier3.status, "complete");
  assert.equal(snapshot.tiersByCategory.stdlib, "tier3");
});

test("n/a tiers do not unlock later tiers when previous measurable tier is incomplete", () => {
  const config = categoryConfig({
    stdlib: {
      conceptCount: 4,
      standardCodeCount: 4,
      productionCodeCount: 1,
      entryProjectCount: 1
    }
  });
  const snapshot = calculateProgress([
    attempt("stdlib-entry-project", "stdlib", {
      kind: "project-complete",
      projectId: "python-basics-lab",
      projectStage: "entry"
    }),
    attempt("stdlib-production", "stdlib", {
      kind: "code-run",
      codeExampleTitle: "production",
      conceptId: "json"
    })
  ], config);

  assert.equal(snapshot.matrix.stdlib.tier1.status, "empty");
  assert.equal(snapshot.matrix.stdlib.tier2.status, "n/a");
  assert.equal(snapshot.matrix.stdlib.tier3.rawComplete, true);
  assert.equal(snapshot.matrix.stdlib.tier3.status, "blocked");
  assert.equal(snapshot.tiersByCategory.stdlib, "none");
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
  ], categoryConfig({
    function: {
      conceptCount: 2,
      assessmentCounts: { recognition: 1 },
      standardCodeCount: 1
    }
  }));

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
  ], categoryConfig({
    function: {
      conceptCount: 1,
      assessmentCounts: { "timed-coding": 1 },
      standardCodeCount: 1
    }
  }));

  assert.equal(snapshot.matrix.function.tier2.requirements[0].current, 0);
  assert.deepEqual(snapshot.recentPatterns.map((item) => [item.pattern, item.count]), [
    ["missing boundary check", 2],
    ["confuses return and print", 1]
  ]);
  assert.equal(snapshot.recentPatterns[0].lastSeenAt, "2026-06-04T11:00:00.000Z");
});

test("unknown categories from localStorage-shaped data are ignored", () => {
  const snapshot = calculateProgress([
    {
      id: "stale-category",
      category: "third-party",
      occurredAt: "2026-06-04T13:00:00.000Z",
      kind: "concept-read",
      conceptId: "requests"
    } as unknown as ProgressAttempt
  ], categoryConfig({
    syntax: {
      conceptCount: 1,
      standardCodeCount: 1
    }
  }));

  assert.deepEqual(snapshot.tiersByCategory.syntax, "none");
  assert.equal(snapshot.activeFrontier[0].category, "syntax");
  assert.equal(snapshot.activeFrontier[0].tier, "tier1");
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
  ], categoryConfig({
    syntax: {
      conceptCount: 2,
      standardCodeCount: 2
    },
    function: {
      conceptCount: 3,
      standardCodeCount: 3
    }
  }));

  assert.equal(snapshot.activeFrontier[0].category, "function");
  assert.equal(snapshot.activeFrontier[0].tier, "tier1");
  assert.equal(snapshot.activeFrontier[1].category, "syntax");
});

test("weeklySummary slices a pure seven-day evidence window", () => {
  const weekStart = "2026-06-01T00:00:00.000Z";
  const attempts: ProgressAttempt[] = [
    attempt("at-start", "syntax", {
      kind: "concept-read",
      conceptId: "variable",
      occurredAt: weekStart
    }),
    attempt("assessment", "function", {
      kind: "assessment",
      assessmentKind: "timed-coding",
      assessmentId: "function-timed",
      occurredAt: "2026-06-04T12:00:00.000Z"
    }),
    attempt("code-run", "syntax", {
      kind: "code-run",
      codeExampleTitle: "standard",
      conceptId: "f-string",
      occurredAt: "2026-06-07T23:59:59.999Z"
    }),
    attempt("failed", "syntax", {
      kind: "assessment",
      assessmentKind: "debugging",
      assessmentId: "syntax-debug",
      passed: false,
      occurredAt: "2026-06-05T00:00:00.000Z"
    }),
    attempt("previous-window", "syntax", {
      kind: "concept-read",
      conceptId: "operators",
      occurredAt: "2026-05-31T23:59:59.999Z"
    }),
    attempt("next-window", "syntax", {
      kind: "concept-read",
      conceptId: "type-casting",
      occurredAt: "2026-06-08T00:00:00.000Z"
    }),
    attempt("invalid-time", "syntax", {
      kind: "concept-read",
      conceptId: "variable",
      occurredAt: "not-a-date"
    }),
    {
      ...attempt("invalid-category", "syntax", {
        kind: "concept-read",
        conceptId: "requests",
        occurredAt: "2026-06-03T00:00:00.000Z"
      }),
      category: "third-party"
    } as unknown as ProgressAttempt
  ];

  const summary = weeklySummary(attempts, weekStart);

  assert.equal(summary.weekStart, weekStart);
  assert.equal(summary.weekEnd, "2026-06-08T00:00:00.000Z");
  assert.equal(summary.total, 3);
  assert.deepEqual(summary.byCategory, { syntax: 2, function: 1 });
  assert.deepEqual(summary.byKind, {
    "concept-read": 1,
    assessment: 1,
    "code-run": 1
  });
  assert.deepEqual(summary.items.map((item) => item.id), [
    "code-run",
    "assessment",
    "at-start"
  ]);
});

test("weeklySummary returns deterministic empty windows for empty or invalid input", () => {
  assert.deepEqual(weeklySummary([], "2026-06-01T00:00:00.000Z"), {
    weekStart: "2026-06-01T00:00:00.000Z",
    weekEnd: "2026-06-08T00:00:00.000Z",
    total: 0,
    byCategory: {},
    byKind: {},
    items: []
  });

  const first = weeklySummary([], "invalid");
  const second = weeklySummary([], "invalid");
  assert.deepEqual(first, {
    weekStart: "",
    weekEnd: "",
    total: 0,
    byCategory: {},
    byKind: {},
    items: []
  });
  assert.deepEqual(second, first);
});
