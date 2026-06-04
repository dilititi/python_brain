import {
  PROGRESS_CATEGORIES,
  type AssessmentKind,
  type ProgressCategory,
  type ProgressCategoryConfig,
  type ProjectStage
} from "./progress-calculator";

type ConceptForProgress = {
  id: string;
  data: {
    category: string;
    codeExamples?: Array<{
      title?: string;
      runnable?: boolean;
    }>;
  };
};

type AssessmentForProgress = {
  data: {
    category: string;
    kind: string;
  };
};

type ProjectForProgress = {
  data: {
    stage: string;
    concepts?: string[];
  };
};

const progressCategorySet = new Set<string>(PROGRESS_CATEGORIES);
const assessmentKinds = new Set<string>([
  "recognition",
  "debugging",
  "completion",
  "timed-coding",
  "refactor"
]);

function isProgressCategory(value: string): value is ProgressCategory {
  return progressCategorySet.has(value);
}

function isAssessmentKind(value: string): value is AssessmentKind {
  return assessmentKinds.has(value);
}

function projectStage(stage: string): ProjectStage | null {
  if (stage === "intro") {
    return "entry";
  }

  if (stage === "core") {
    return "mid";
  }

  if (stage === "advanced") {
    return "capstone";
  }

  if (stage === "entry" || stage === "mid" || stage === "capstone") {
    return stage;
  }

  return null;
}

export function emptyProgressCategoryConfig(): ProgressCategoryConfig {
  return Object.fromEntries(
    PROGRESS_CATEGORIES.map((category) => [
      category,
      {
        conceptCount: 0,
        assessmentCounts: {},
        standardCodeCount: 0,
        productionCodeCount: 0,
        pep8Count: 0,
        entryProjectCount: 0,
        midOrCapstoneProjectCount: 0,
        reverseRecognitionCount: 0,
        crossConceptCount: 0
      }
    ])
  ) as ProgressCategoryConfig;
}

export function buildProgressCategoryConfig(input: {
  concepts: readonly ConceptForProgress[];
  assessments?: readonly AssessmentForProgress[];
  projects?: readonly ProjectForProgress[];
}): ProgressCategoryConfig {
  const config = emptyProgressCategoryConfig();
  const conceptCategory = new Map<string, ProgressCategory>();

  for (const concept of input.concepts) {
    if (!isProgressCategory(concept.data.category)) {
      continue;
    }

    const category = concept.data.category;
    const categoryConfig = config[category];
    conceptCategory.set(concept.id, category);
    categoryConfig.conceptCount += 1;

    if (concept.data.codeExamples?.some((example) => example.title === "standard" && example.runnable !== false)) {
      categoryConfig.standardCodeCount += 1;
    }

    if (concept.data.codeExamples?.some((example) => example.title === "production" && example.runnable !== false)) {
      categoryConfig.productionCodeCount += 1;
    }
  }

  for (const assessment of input.assessments ?? []) {
    if (!isProgressCategory(assessment.data.category) || !isAssessmentKind(assessment.data.kind)) {
      continue;
    }

    const counts = config[assessment.data.category].assessmentCounts;
    counts[assessment.data.kind] = (counts[assessment.data.kind] ?? 0) + 1;
  }

  for (const project of input.projects ?? []) {
    const stage = projectStage(project.data.stage);
    if (!stage) {
      continue;
    }

    const categories = new Set<ProgressCategory>();
    for (const conceptId of project.data.concepts ?? []) {
      const category = conceptCategory.get(conceptId);
      if (category) {
        categories.add(category);
      }
    }

    for (const category of categories) {
      if (stage === "entry") {
        config[category].entryProjectCount += 1;
      } else {
        config[category].midOrCapstoneProjectCount += 1;
      }
    }
  }

  return config;
}
