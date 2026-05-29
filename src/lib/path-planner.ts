export type AssessmentAnswer = {
  questionId: string;
  track?: "web" | "data" | "automation" | "ai" | "creative";
  knownConcepts?: string[];
  confidence: 0 | 1 | 2 | 3;
};

export type PathRecommendation = {
  track: "beginner" | "web" | "data" | "automation" | "ai" | "creative";
  startAfter: string[];
  reason: string;
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
