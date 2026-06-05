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
  | "completionPassed"
  | "standardCodeRun"
  | "debuggingPassed"
  | "timedCodingPassed"
  | "pep8Passed"
  | "entryProjectComplete"
  | "productionCodeRun"
  | "refactorPassed"
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

export type CellStatus = "empty" | "in_progress" | "blocked" | "complete" | "n/a";

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

export type WeeklyEvidenceItem = {
  id: string;
  category: ProgressCategory;
  kind: ProgressEvidenceKind;
  occurredAt: string;
  assessmentKind?: AssessmentKind;
  assessmentId?: string;
  conceptId?: string;
  codeExampleTitle?: CodeExampleTitle;
  projectId?: string;
};

export type WeeklySummary = {
  weekStart: string;
  weekEnd: string;
  total: number;
  byCategory: Partial<Record<ProgressCategory, number>>;
  byKind: Partial<Record<ProgressEvidenceKind, number>>;
  items: WeeklyEvidenceItem[];
};

export type StalledCategory = {
  category: ProgressCategory;
  currentTier: ProgressTier | "none";
  lastEvidenceAt: string;
  daysSinceLastEvidence: number;
};

export type ProgressCategoryConfigItem = {
  conceptCount: number;
  assessmentCounts: Partial<Record<AssessmentKind, number>>;
  standardCodeCount: number;
  productionCodeCount: number;
  pep8Count: number;
  entryProjectCount: number;
  midOrCapstoneProjectCount: number;
  reverseRecognitionCount: number;
  crossConceptCount: number;
};

export type ProgressCategoryConfig = Record<ProgressCategory, ProgressCategoryConfigItem>;

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
  completionPassed: Set<string>;
  standardCodeRun: Set<string>;
  debuggingPassed: Set<string>;
  timedCodingPassed: Set<string>;
  pep8Passed: Set<string>;
  entryProjectComplete: Set<string>;
  productionCodeRun: Set<string>;
  refactorPassed: Set<string>;
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
      { key: "completionPassed", label: "通过补全题", target: 5 },
      { key: "standardCodeRun", label: "跑通 standard 代码", target: 8 }
    ]
  },
  {
    tier: "tier2",
    requirements: [
      { key: "debuggingPassed", label: "通过改错题", target: 5 },
      { key: "timedCodingPassed", label: "限时题通过测试", target: 5 },
      { key: "pep8Passed", label: "通过 PEP 8 检查", target: 3 }
    ]
  },
  {
    tier: "tier3",
    requirements: [
      { key: "entryProjectComplete", label: "完成 entry 项目", target: 1 },
      { key: "productionCodeRun", label: "跑通 production 代码", target: 1 },
      { key: "refactorPassed", label: "通过重构题", target: 3 }
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

// v1.2 PR4 does not yet ship browser ruff, reverse triggers, or cross-concept
// assessment flows. Keep these dimensions visible in the type model, but make
// their targets explicitly unavailable until the corresponding feature lands.
const DISABLED_REQUIREMENTS = new Set<RequirementKey>([
  "pep8Passed",
  "reverseRecognitionPassed",
  "crossConceptPassed"
]);

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
    completionPassed: new Set(),
    standardCodeRun: new Set(),
    debuggingPassed: new Set(),
    timedCodingPassed: new Set(),
    pep8Passed: new Set(),
    entryProjectComplete: new Set(),
    productionCodeRun: new Set(),
    refactorPassed: new Set(),
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
    const categoryEvidence = (evidence as Partial<Record<string, CategoryEvidence>>)[attempt.category];
    if (!categoryEvidence) {
      continue;
    }

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

      if (attempt.assessmentKind === "completion") {
        categoryEvidence.completionPassed.add(evidenceKey(attempt, "completion"));
      }

      if (attempt.assessmentKind === "debugging") {
        categoryEvidence.debuggingPassed.add(evidenceKey(attempt, "debugging"));
      }

      if (attempt.assessmentKind === "timed-coding") {
        categoryEvidence.timedCodingPassed.add(evidenceKey(attempt, "timed-coding"));
      }

      if (attempt.assessmentKind === "refactor") {
        categoryEvidence.refactorPassed.add(evidenceKey(attempt, "refactor"));
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
  definition: RequirementDefinition,
  target: number
): RequirementStatus {
  const current = evidence[definition.key].size;

  return {
    key: definition.key,
    label: definition.label,
    current,
    target,
    complete: target === 0 || current >= target
  };
}

function cellProgress(requirements: readonly RequirementStatus[]) {
  const measurable = requirements.filter((requirement) => requirement.target > 0);

  if (measurable.length === 0) {
    return 0;
  }

  const total = measurable.reduce((sum, requirement) => {
    return sum + Math.min(requirement.current / requirement.target, 1);
  }, 0);

  return Number((total / measurable.length).toFixed(4));
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

function requirementTarget(
  config: ProgressCategoryConfigItem,
  definition: RequirementDefinition
) {
  if (DISABLED_REQUIREMENTS.has(definition.key)) {
    return 0;
  }

  switch (definition.key) {
    case "conceptsRead":
      return config.conceptCount;
    case "recognitionPassed":
      return config.assessmentCounts.recognition ?? 0;
    case "completionPassed":
      return config.assessmentCounts.completion ?? 0;
    case "standardCodeRun":
      return config.standardCodeCount;
    case "debuggingPassed":
      return config.assessmentCounts.debugging ?? 0;
    case "timedCodingPassed":
      return config.assessmentCounts["timed-coding"] ?? 0;
    case "pep8Passed":
      return config.pep8Count;
    case "entryProjectComplete":
      return Math.min(config.entryProjectCount, definition.target);
    case "productionCodeRun":
      return Math.min(config.productionCodeCount, definition.target);
    case "refactorPassed":
      return config.assessmentCounts.refactor ?? 0;
    case "midOrCapstoneProjectComplete":
      return Math.min(config.midOrCapstoneProjectCount, definition.target);
    case "reverseRecognitionPassed":
      return Math.min(config.reverseRecognitionCount, definition.target);
    case "crossConceptPassed":
      return Math.min(config.crossConceptCount, definition.target);
  }
}

export function calculateProgress(
  attempts: readonly ProgressAttempt[],
  categoryConfig: ProgressCategoryConfig,
  options: { recentPatternLimit?: number } = {}
): ProgressSnapshot {
  const evidence = collectEvidence(attempts);
  const matrix = {} as Record<ProgressCategory, Record<ProgressTier, MatrixCell>>;
  const evidenceByCell: Record<string, RequirementStatus[]> = {};
  const tiersByCategory = {} as Record<ProgressCategory, ProgressTier | "none">;
  const activeFrontier: ActiveFrontierItem[] = [];

  for (const category of PROGRESS_CATEGORIES) {
    const categoryEvidence = evidence[category];
    const config = categoryConfig[category];
    matrix[category] = {} as Record<ProgressTier, MatrixCell>;
    let previousComplete = true;
    let highestTier: ProgressTier | "none" = "none";

    for (const tierDefinition of TIER_REQUIREMENTS) {
      const requirements = tierDefinition.requirements.map((requirement) =>
        requirementStatus(categoryEvidence, requirement, requirementTarget(config, requirement))
      );
      const hasMeasurableRequirements = requirements.some((requirement) => requirement.target > 0);
      const rawComplete = hasMeasurableRequirements && requirements.every((requirement) => requirement.complete);
      const complete: boolean = previousComplete && rawComplete;
      const progress = cellProgress(requirements);
      let status: CellStatus = "empty";

      if (!hasMeasurableRequirements) {
        status = "n/a";
      } else if (complete) {
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
      if (hasMeasurableRequirements) {
        previousComplete = complete;
      }
    }

    tiersByCategory[category] = highestTier;

    const nextTier = PROGRESS_TIERS.find((tier) => {
      const status = matrix[category][tier].status;
      return status !== "complete" && status !== "n/a";
    });
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

function emptyWeeklySummary(): WeeklySummary {
  return {
    weekStart: "",
    weekEnd: "",
    total: 0,
    byCategory: {},
    byKind: {},
    items: []
  };
}

export function weeklySummary(
  attempts: readonly ProgressAttempt[],
  weekStart: string
): WeeklySummary {
  const start = Date.parse(weekStart);
  if (!Number.isFinite(start)) {
    return emptyWeeklySummary();
  }

  const end = start + 7 * 24 * 60 * 60 * 1000;
  const categorySet = new Set<string>(PROGRESS_CATEGORIES);
  const items: WeeklyEvidenceItem[] = [];
  const byCategory: Partial<Record<ProgressCategory, number>> = {};
  const byKind: Partial<Record<ProgressEvidenceKind, number>> = {};

  for (const attempt of attempts) {
    const occurredAt = Date.parse(attempt.occurredAt);
    if (
      attempt.passed === false ||
      !Number.isFinite(occurredAt) ||
      occurredAt < start ||
      occurredAt >= end ||
      !categorySet.has(attempt.category)
    ) {
      continue;
    }

    const category = attempt.category as ProgressCategory;
    byCategory[category] = (byCategory[category] ?? 0) + 1;
    byKind[attempt.kind] = (byKind[attempt.kind] ?? 0) + 1;
    items.push({
      id: attempt.id,
      category,
      kind: attempt.kind,
      occurredAt: new Date(occurredAt).toISOString(),
      assessmentKind: attempt.assessmentKind,
      assessmentId: attempt.assessmentId,
      conceptId: attempt.conceptId,
      codeExampleTitle: attempt.codeExampleTitle,
      projectId: attempt.projectId
    });
  }

  items.sort((a, b) => {
    const timeDifference = Date.parse(b.occurredAt) - Date.parse(a.occurredAt);
    return timeDifference !== 0 ? timeDifference : a.id.localeCompare(b.id);
  });

  return {
    weekStart: new Date(start).toISOString(),
    weekEnd: new Date(end).toISOString(),
    total: items.length,
    byCategory,
    byKind,
    items
  };
}

export function stalledCategories(
  attempts: readonly ProgressAttempt[],
  tiersByCategory: Readonly<Record<ProgressCategory, ProgressTier | "none">>,
  asOf: string,
  options: { stallThresholdDays?: number } = {}
): StalledCategory[] {
  const asOfTime = Date.parse(asOf);
  if (!Number.isFinite(asOfTime)) {
    return [];
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const thresholdDays = Math.max(0, options.stallThresholdDays ?? 14);
  const thresholdMs = thresholdDays * dayMs;
  const categorySet = new Set<string>(PROGRESS_CATEGORIES);
  const lastEvidenceByCategory = new Map<ProgressCategory, number>();

  for (const attempt of attempts) {
    const occurredAt = Date.parse(attempt.occurredAt);
    if (
      !Number.isFinite(occurredAt) ||
      occurredAt > asOfTime ||
      !categorySet.has(attempt.category)
    ) {
      continue;
    }

    const category = attempt.category as ProgressCategory;
    const previous = lastEvidenceByCategory.get(category);
    if (previous === undefined || occurredAt > previous) {
      lastEvidenceByCategory.set(category, occurredAt);
    }
  }

  return PROGRESS_CATEGORIES.flatMap((category) => {
    const lastEvidenceAt = lastEvidenceByCategory.get(category);
    const currentTier = tiersByCategory[category];
    if (
      lastEvidenceAt === undefined ||
      (currentTier !== "none" && currentTier !== "tier1") ||
      asOfTime - lastEvidenceAt < thresholdMs
    ) {
      return [];
    }

    return [{
      category,
      currentTier,
      lastEvidenceAt: new Date(lastEvidenceAt).toISOString(),
      daysSinceLastEvidence: Math.floor((asOfTime - lastEvidenceAt) / dayMs)
    }];
  }).sort((left, right) => (
    right.daysSinceLastEvidence - left.daysSinceLastEvidence
      || PROGRESS_CATEGORIES.indexOf(left.category) - PROGRESS_CATEGORIES.indexOf(right.category)
  ));
}
