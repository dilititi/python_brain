export const PROGRESS_SCHEMA_VERSION = 1;

export const PROGRESS_CATEGORIES = [
  "language",
  "syntax",
  "control-flow",
  "data-structure",
  "function",
  "oop",
  "module-eng",
  "stdlib"
] as const;

export const PROGRESS_TIERS = ["tier1", "tier2", "tier3", "tier4"] as const;

export type ProgressCategory = (typeof PROGRESS_CATEGORIES)[number];
export type ProgressTier = (typeof PROGRESS_TIERS)[number];

export type AssessmentKind =
  | "recognition"
  | "debugging"
  | "completion"
  | "timed-coding"
  | "refactor";

export type CodeExampleTitle = "naive" | "standard" | "production";
export type ProjectStage = "entry" | "mid" | "capstone";

export type ProgressEvidenceKind =
  | "concept-read"
  | "code-run"
  | "assessment"
  | "pep8"
  | "project-complete"
  | "reverse-recognition"
  | "cross-concept";

export type ProgressAttempt = {
  id: string;
  category: ProgressCategory;
  occurredAt: string;
  kind: ProgressEvidenceKind;
  passed?: boolean;
  conceptId?: string;
  concepts?: string[];
  assessmentId?: string;
  assessmentKind?: AssessmentKind;
  targetTier?: ProgressTier;
  codeExampleTitle?: CodeExampleTitle;
  projectId?: string;
  projectStage?: ProjectStage;
  pep8Passed?: boolean;
  pattern?: string;
  durationSeconds?: number;
};

export type RequirementKey =
  | "conceptsRead"
  | "recognitionPassed"
  | "standardCodeRun"
  | "timedCodingPassed"
  | "pep8Passed"
  | "entryProjectComplete"
  | "productionCodeRun"
  | "midOrCapstoneProjectComplete"
  | "reverseRecognitionPassed"
  | "crossConceptPassed";

export type RequirementStatus = {
  key: RequirementKey;
  label: string;
  current: number;
  target: number;
  complete: boolean;
};

export type CellStatus = "empty" | "in_progress" | "blocked" | "complete";

export type MatrixCell = {
  category: ProgressCategory;
  tier: ProgressTier;
  status: CellStatus;
  progress: number;
  rawComplete: boolean;
  requirements: RequirementStatus[];
  evidenceIds: string[];
};

export type ActiveFrontierItem = {
  category: ProgressCategory;
  tier: ProgressTier;
  progress: number;
  evidenceCount: number;
  missing: RequirementStatus[];
};

export type RecentPattern = {
  pattern: string;
  count: number;
  lastSeenAt: string;
};

export type ProgressSnapshot = {
  schemaVersion: typeof PROGRESS_SCHEMA_VERSION;
  matrix: Record<ProgressCategory, Record<ProgressTier, MatrixCell>>;
  tiersByCategory: Record<ProgressCategory, ProgressTier | "none">;
  evidenceByCell: Record<string, RequirementStatus[]>;
  activeFrontier: ActiveFrontierItem[];
  recentPatterns: RecentPattern[];
};

type RequirementDefinition = {
  key: RequirementKey;
  label: string;
  target: number;
};

type TierDefinition = {
  tier: ProgressTier;
  requirements: RequirementDefinition[];
};

type CategoryEvidence = {
  evidenceIds: Set<string>;
  conceptsRead: Set<string>;
  recognitionPassed: Set<string>;
  standardCodeRun: Set<string>;
  timedCodingPassed: Set<string>;
  pep8Passed: Set<string>;
  entryProjectComplete: Set<string>;
  productionCodeRun: Set<string>;
  midOrCapstoneProjectComplete: Set<string>;
  reverseRecognitionPassed: Set<string>;
  crossConceptPassed: Set<string>;
};

export const TIER_REQUIREMENTS: readonly TierDefinition[] = [
  {
    tier: "tier1",
    requirements: [
      { key: "conceptsRead", label: "读过概念", target: 15 },
      { key: "recognitionPassed", label: "通过识别题", target: 10 },
      { key: "standardCodeRun", label: "跑通 standard 代码", target: 8 }
    ]
  },
  {
    tier: "tier2",
    requirements: [
      { key: "timedCodingPassed", label: "限时题通过测试", target: 5 },
      { key: "pep8Passed", label: "通过 PEP 8 检查", target: 3 }
    ]
  },
  {
    tier: "tier3",
    requirements: [
      { key: "entryProjectComplete", label: "完成 entry 项目", target: 1 },
      { key: "productionCodeRun", label: "跑通 production 代码", target: 1 }
    ]
  },
  {
    tier: "tier4",
    requirements: [
      { key: "midOrCapstoneProjectComplete", label: "完成 mid/capstone 项目", target: 1 },
      { key: "reverseRecognitionPassed", label: "完成反向识别", target: 2 },
      { key: "crossConceptPassed", label: "通过跨概念题", target: 1 }
    ]
  }
] as const;

const tierRank: Record<ProgressTier, number> = {
  tier1: 1,
  tier2: 2,
  tier3: 3,
  tier4: 4
};

function emptyCategoryEvidence(): CategoryEvidence {
  return {
    evidenceIds: new Set(),
    conceptsRead: new Set(),
    recognitionPassed: new Set(),
    standardCodeRun: new Set(),
    timedCodingPassed: new Set(),
    pep8Passed: new Set(),
    entryProjectComplete: new Set(),
    productionCodeRun: new Set(),
    midOrCapstoneProjectComplete: new Set(),
    reverseRecognitionPassed: new Set(),
    crossConceptPassed: new Set()
  };
}

function makeEvidenceByCategory() {
  return Object.fromEntries(
    PROGRESS_CATEGORIES.map((category) => [category, emptyCategoryEvidence()])
  ) as Record<ProgressCategory, CategoryEvidence>;
}

function passed(attempt: ProgressAttempt) {
  return attempt.passed !== false;
}

function evidenceKey(attempt: ProgressAttempt, fallbackPrefix: string) {
  return attempt.assessmentId ?? attempt.projectId ?? attempt.conceptId ?? `${fallbackPrefix}:${attempt.id}`;
}

function addConcepts(target: Set<string>, attempt: ProgressAttempt) {
  if (attempt.conceptId) {
    target.add(attempt.conceptId);
  }

  for (const conceptId of attempt.concepts ?? []) {
    target.add(conceptId);
  }

  if (!attempt.conceptId && (attempt.concepts?.length ?? 0) === 0) {
    target.add(attempt.id);
  }
}

function collectEvidence(attempts: readonly ProgressAttempt[]) {
  const evidence = makeEvidenceByCategory();

  for (const attempt of attempts) {
    const categoryEvidence = evidence[attempt.category];
    categoryEvidence.evidenceIds.add(attempt.id);

    if (!passed(attempt)) {
      continue;
    }

    if (attempt.kind === "concept-read") {
      addConcepts(categoryEvidence.conceptsRead, attempt);
      continue;
    }

    if (attempt.kind === "code-run") {
      if (attempt.codeExampleTitle === "standard") {
        categoryEvidence.standardCodeRun.add(evidenceKey(attempt, "standard-code"));
      }

      if (attempt.codeExampleTitle === "production") {
        categoryEvidence.productionCodeRun.add(evidenceKey(attempt, "production-code"));
      }

      continue;
    }

    if (attempt.kind === "assessment") {
      if (attempt.assessmentKind === "recognition") {
        categoryEvidence.recognitionPassed.add(evidenceKey(attempt, "recognition"));
      }

      if (attempt.assessmentKind === "timed-coding") {
        categoryEvidence.timedCodingPassed.add(evidenceKey(attempt, "timed-coding"));
      }

      if (attempt.pep8Passed) {
        categoryEvidence.pep8Passed.add(evidenceKey(attempt, "pep8"));
      }

      continue;
    }

    if (attempt.kind === "pep8" || attempt.pep8Passed) {
      categoryEvidence.pep8Passed.add(evidenceKey(attempt, "pep8"));
    }

    if (attempt.kind === "project-complete") {
      if (attempt.projectStage === "entry") {
        categoryEvidence.entryProjectComplete.add(evidenceKey(attempt, "entry-project"));
      }

      if (attempt.projectStage === "mid" || attempt.projectStage === "capstone") {
        categoryEvidence.midOrCapstoneProjectComplete.add(evidenceKey(attempt, "advanced-project"));
      }
    }

    if (attempt.kind === "reverse-recognition") {
      categoryEvidence.reverseRecognitionPassed.add(evidenceKey(attempt, "reverse-recognition"));
    }

    if (attempt.kind === "cross-concept") {
      categoryEvidence.crossConceptPassed.add(evidenceKey(attempt, "cross-concept"));
    }
  }

  return evidence;
}

function requirementStatus(
  evidence: CategoryEvidence,
  definition: RequirementDefinition
): RequirementStatus {
  const current = evidence[definition.key].size;

  return {
    key: definition.key,
    label: definition.label,
    current,
    target: definition.target,
    complete: current >= definition.target
  };
}

function cellProgress(requirements: readonly RequirementStatus[]) {
  if (requirements.length === 0) {
    return 0;
  }

  const total = requirements.reduce((sum, requirement) => {
    return sum + Math.min(requirement.current / requirement.target, 1);
  }, 0);

  return Number((total / requirements.length).toFixed(4));
}

function cellKey(category: ProgressCategory, tier: ProgressTier) {
  return `${category}:${tier}`;
}

function buildRecentPatterns(attempts: readonly ProgressAttempt[], limit: number) {
  const failedWithPattern = attempts
    .filter((attempt) => attempt.passed === false && typeof attempt.pattern === "string" && attempt.pattern.trim())
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, limit);

  const patterns = new Map<string, RecentPattern>();

  for (const attempt of failedWithPattern) {
    const pattern = attempt.pattern?.trim();
    if (!pattern) {
      continue;
    }

    const current = patterns.get(pattern);
    if (!current) {
      patterns.set(pattern, {
        pattern,
        count: 1,
        lastSeenAt: attempt.occurredAt
      });
      continue;
    }

    current.count += 1;
    if (Date.parse(attempt.occurredAt) > Date.parse(current.lastSeenAt)) {
      current.lastSeenAt = attempt.occurredAt;
    }
  }

  return [...patterns.values()].sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }

    return Date.parse(b.lastSeenAt) - Date.parse(a.lastSeenAt);
  });
}

export function calculateProgress(
  attempts: readonly ProgressAttempt[],
  options: { recentPatternLimit?: number } = {}
): ProgressSnapshot {
  const evidence = collectEvidence(attempts);
  const matrix = {} as Record<ProgressCategory, Record<ProgressTier, MatrixCell>>;
  const evidenceByCell: Record<string, RequirementStatus[]> = {};
  const tiersByCategory = {} as Record<ProgressCategory, ProgressTier | "none">;
  const activeFrontier: ActiveFrontierItem[] = [];

  for (const category of PROGRESS_CATEGORIES) {
    const categoryEvidence = evidence[category];
    matrix[category] = {} as Record<ProgressTier, MatrixCell>;
    let previousComplete = true;
    let highestTier: ProgressTier | "none" = "none";

    for (const tierDefinition of TIER_REQUIREMENTS) {
      const requirements = tierDefinition.requirements.map((requirement) =>
        requirementStatus(categoryEvidence, requirement)
      );
      const rawComplete = requirements.every((requirement) => requirement.complete);
      const complete: boolean = previousComplete && rawComplete;
      const progress = cellProgress(requirements);
      let status: CellStatus = "empty";

      if (complete) {
        status = "complete";
        highestTier = tierDefinition.tier;
      } else if (!previousComplete) {
        status = "blocked";
      } else if (progress > 0) {
        status = "in_progress";
      }

      const cell: MatrixCell = {
        category,
        tier: tierDefinition.tier,
        status,
        progress,
        rawComplete,
        requirements,
        evidenceIds: [...categoryEvidence.evidenceIds].sort()
      };

      matrix[category][tierDefinition.tier] = cell;
      evidenceByCell[cellKey(category, tierDefinition.tier)] = requirements;
      previousComplete = complete;
    }

    tiersByCategory[category] = highestTier;

    const nextTier = PROGRESS_TIERS.find((tier) => matrix[category][tier].status !== "complete");
    if (nextTier) {
      const cell = matrix[category][nextTier];
      activeFrontier.push({
        category,
        tier: nextTier,
        progress: cell.progress,
        evidenceCount: cell.evidenceIds.length,
        missing: cell.requirements.filter((requirement) => !requirement.complete)
      });
    }
  }

  activeFrontier.sort((a, b) => {
    if (tierRank[a.tier] !== tierRank[b.tier]) {
      return tierRank[a.tier] - tierRank[b.tier];
    }

    if (b.progress !== a.progress) {
      return b.progress - a.progress;
    }

    if (b.evidenceCount !== a.evidenceCount) {
      return b.evidenceCount - a.evidenceCount;
    }

    return PROGRESS_CATEGORIES.indexOf(a.category) - PROGRESS_CATEGORIES.indexOf(b.category);
  });

  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    matrix,
    tiersByCategory,
    evidenceByCell,
    activeFrontier,
    recentPatterns: buildRecentPatterns(attempts, options.recentPatternLimit ?? 20)
  };
}
