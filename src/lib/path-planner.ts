export type AssessmentAnswer = {
  questionId: string;
  track?: "web" | "data" | "automation" | "ai" | "creative";
  knownConcepts?: string[];
  confidence: 0 | 1 | 2 | 3;
};

export type Track = "beginner" | "web" | "data" | "automation" | "ai" | "creative";

export type PathRecommendation = {
  track: Track;
  startAfter: string[];
  reason: string;
};

export type ConceptPlanNode = {
  id: string;
  prerequisites: string[];
};

export type LearningPathPlan = {
  nodes: string[];
  skipped: string[];
  missing: string[];
};

const trackLabels = {
  beginner: "零基础主路径",
  web: "Web 后端",
  data: "数据分析",
  automation: "自动化办公",
  ai: "AI 工程",
  creative: "创意编程"
} as const;

export function scoreAssessment(
  answers: AssessmentAnswer[]
): PathRecommendation {
  const known = new Set(answers.flatMap((answer) => answer.knownConcepts ?? []));
  const averageConfidence =
    answers.reduce((sum, answer) => sum + answer.confidence, 0) /
    Math.max(answers.length, 1);

  const trackVotes = new Map<string, number>();
  for (const answer of answers) {
    if (answer.track) {
      trackVotes.set(answer.track, (trackVotes.get(answer.track) ?? 0) + 1);
    }
  }

  const [preferredTrack] =
    [...trackVotes.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];

  if (averageConfidence < 1.3 || known.size < 4) {
    return {
      track: "beginner",
      startAfter: [...known],
      reason: "测评显示基础概念还没有形成稳定连接，先走零基础主路径更稳。"
    };
  }

  const track =
    (preferredTrack as PathRecommendation["track"] | undefined) ?? "web";

  return {
    track,
    startAfter: [...known],
    reason: `你已经能识别若干核心概念，可以从${trackLabels[track]}路径进入。`
  };
}

export function planLearningPath({
  concepts,
  targetNodes,
  knownConcepts = []
}: {
  concepts: ConceptPlanNode[];
  targetNodes: string[];
  knownConcepts?: string[];
}): LearningPathPlan {
  const conceptById = new Map(concepts.map((concept) => [concept.id, concept]));
  const known = new Set(knownConcepts);
  const selected = new Set<string>();
  const missing = new Set<string>();
  const rankById = new Map<string, number>();

  function markRank(id: string, rank: number) {
    const current = rankById.get(id);
    if (current === undefined || rank < current) {
      rankById.set(id, rank);
    }
  }

  function collect(id: string, rank: number) {
    if (known.has(id)) {
      return;
    }

    const concept = conceptById.get(id);
    if (!concept) {
      missing.add(id);
      return;
    }

    selected.add(id);
    markRank(id, rank);

    for (const prerequisite of concept.prerequisites) {
      collect(prerequisite, rank);
    }
  }

  targetNodes.forEach((id, index) => collect(id, index));

  const successors = new Map<string, Set<string>>();
  const indegree = new Map<string, number>();

  for (const id of selected) {
    successors.set(id, new Set());
    indegree.set(id, 0);
  }

  for (const id of selected) {
    const concept = conceptById.get(id);
    if (!concept) {
      continue;
    }

    for (const prerequisite of concept.prerequisites) {
      if (!selected.has(prerequisite)) {
        continue;
      }

      successors.get(prerequisite)?.add(id);
      indegree.set(id, (indegree.get(id) ?? 0) + 1);
    }
  }

  const byRank = (a: string, b: string) =>
    (rankById.get(a) ?? Number.MAX_SAFE_INTEGER) -
      (rankById.get(b) ?? Number.MAX_SAFE_INTEGER) ||
    a.localeCompare(b);

  const ready = [...selected].filter((id) => indegree.get(id) === 0).sort(byRank);
  const nodes: string[] = [];

  while (ready.length > 0) {
    const id = ready.shift();
    if (!id) {
      break;
    }

    nodes.push(id);

    for (const successor of successors.get(id) ?? []) {
      const nextIndegree = (indegree.get(successor) ?? 0) - 1;
      indegree.set(successor, nextIndegree);
      if (nextIndegree === 0) {
        ready.push(successor);
        ready.sort(byRank);
      }
    }
  }

  if (nodes.length !== selected.size) {
    const remaining = [...selected].filter((id) => !nodes.includes(id)).sort(byRank);
    throw new Error(`Cannot plan learning path because prerequisites contain a cycle: ${remaining.join(", ")}`);
  }

  return {
    nodes,
    skipped: targetNodes.filter((id) => known.has(id)),
    missing: [...missing].sort()
  };
}
