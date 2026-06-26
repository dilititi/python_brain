export type SearchDocument = {
  id: string;
  title: string;
  description: string;
  href: string;
  kind: string;
  keywords?: string;
};

type Entry = {
  id: string;
  data: Record<string, unknown>;
};

export type PhilosophySearchInput = {
  questions: Entry[];
  perspectives: Entry[];
  readings: Entry[];
  notions: Entry[];
  entries: Entry[];
  sources: Entry[];
  understandingClaims?: Entry[];
};

const questionStatusLabels: Record<string, string> = {
  open: "持续追问",
  provisional: "已有暂定回答",
  settled: "阶段性稳定"
};

const readingStatusLabels: Record<string, string> = {
  unread: "未读",
  reading: "在读",
  finished: "已读完"
};

const sourceReliabilityLabels: Record<string, string> = {
  high: "高可靠性",
  medium: "中等可靠性",
  low: "低可靠性",
  unknown: "可靠性未判断"
};

const sourceStatusLabels: Record<string, string> = {
  saved: "已保存",
  skimmed: "已浏览",
  reading: "阅读中",
  read: "已读",
  extracted: "已提取",
  rejected: "已弃用"
};

const understandingClaimStatusLabels: Record<string, string> = {
  draft: "草稿",
  testing: "检验中",
  supported: "已有证据支持",
  contested: "存在反证",
  revised: "已修订",
  retired: "已搁置"
};

const understandingClaimConfidenceLabels: Record<string, string> = {
  low: "低信心",
  medium: "中等信心",
  high: "高信心"
};

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function compact(values: Array<string | undefined>): string {
  return values
    .flatMap((value) => value ? [value] : [])
    .join(" ")
    .trim();
}

function titleOf(map: Map<string, Entry>, id: unknown): string {
  return typeof id === "string" ? stringValue(map.get(id)?.data.title) || id : "";
}

export function buildPhilosophySearchDocuments(input: PhilosophySearchInput): SearchDocument[] {
  const questionById = new Map(input.questions.map((entry) => [entry.id, entry]));
  const readingById = new Map(input.readings.map((entry) => [entry.id, entry]));

  return [
    ...input.questions.map((entry) => ({
      id: `question:${entry.id}`,
      title: stringValue(entry.data.title) || entry.id,
      description: stringValue(entry.data.currentAnswer),
      href: `/questions/${entry.id}/`,
      kind: "思想问题",
      keywords: compact([
        questionStatusLabels[stringValue(entry.data.status)],
        ...stringArray(entry.data.openQuestions)
      ])
    })),
    ...input.perspectives.map((entry) => ({
      id: `perspective:${entry.id}`,
      title: stringValue(entry.data.title) || entry.id,
      description: stringValue(entry.data.summary) || stringArray(entry.data.coreClaims).join(" "),
      href: `/perspectives/${entry.id}/`,
      kind: "理论视角",
      keywords: compact([
        ...stringArray(entry.data.thinkers),
        ...stringArray(entry.data.coreClaims)
      ])
    })),
    ...input.readings.map((entry) => ({
      id: `reading:${entry.id}`,
      title: stringValue(entry.data.title) || entry.id,
      description: compact([
        stringValue(entry.data.author),
        stringValue(entry.data.notes)
      ]),
      href: `/readings/${entry.id}/`,
      kind: "原典阅读",
      keywords: compact([
        readingStatusLabels[stringValue(entry.data.status)],
        stringValue(entry.data.originalTitle)
      ])
    })),
    ...input.notions.map((entry) => ({
      id: `notion:${entry.id}`,
      title: stringValue(entry.data.title) || entry.id,
      description: stringValue(entry.data.summary),
      href: `/notions/${entry.id}/`,
      kind: "理论概念"
    })),
    ...input.entries.map((entry) => ({
      id: `entry:${entry.id}`,
      title: stringValue(entry.data.title) || entry.id,
      description: `V${String(entry.data.fromVersion ?? "?")} → V${String(entry.data.toVersion ?? "?")} · ${stringValue(entry.data.reason)}`,
      href: `/entries/${entry.id}/`,
      kind: "立场变化",
      keywords: compact([
        stringValue(entry.data.newStance),
        ...stringArray(entry.data.accepted),
        ...stringArray(entry.data.doubts),
        ...stringArray(entry.data.newQuestions),
        titleOf(questionById, entry.data.question),
        titleOf(readingById, entry.data.triggeredBy)
      ])
    })),
    ...input.sources.map((entry) => ({
      id: `source:${entry.id}`,
      title: stringValue(entry.data.title) || entry.id,
      description: stringValue(entry.data.summary),
      href: `/sources/${entry.id}/`,
      kind: "辅助资料",
      keywords: compact([
        stringValue(entry.data.whySaved),
        ...stringArray(entry.data.useFor),
        ...stringArray(entry.data.limitations),
        sourceReliabilityLabels[stringValue(entry.data.reliability)],
        sourceStatusLabels[stringValue(entry.data.status)],
        ...stringArray(entry.data.relatedQuestions).map((id) => titleOf(questionById, id))
      ])
    })),
    ...(input.understandingClaims ?? []).map((entry) => ({
      id: `understanding-claim:${entry.id}`,
      title: stringValue(entry.data.title) || entry.id,
      description: stringValue(entry.data.claim),
      href: `/understanding-claims/${entry.id}/`,
      kind: "理解主张",
      keywords: compact([
        understandingClaimStatusLabels[stringValue(entry.data.status)],
        understandingClaimConfidenceLabels[stringValue(entry.data.confidence)],
        ...stringArray(entry.data.gaps),
        ...stringArray(entry.data.nextTasks),
        ...stringArray(entry.data.relatedQuestions).map((id) => titleOf(questionById, id)),
        ...stringArray(entry.data.relatedReadings).map((id) => titleOf(readingById, id))
      ])
    }))
  ];
}

export function buildRecentStanceChanges(input: PhilosophySearchInput) {
  const questionById = new Map(input.questions.map((entry) => [entry.id, entry]));
  const readingById = new Map(input.readings.map((entry) => [entry.id, entry]));

  return [...input.entries]
    .sort((left, right) => (
      stringValue(right.data.date).localeCompare(stringValue(left.data.date))
      || (numberValue(right.data.toVersion) ?? 0) - (numberValue(left.data.toVersion) ?? 0)
      || right.id.localeCompare(left.id)
    ))
    .map((entry) => ({
      id: entry.id,
      title: stringValue(entry.data.title) || entry.id,
      date: stringValue(entry.data.date),
      href: `/entries/${entry.id}/`,
      questionId: stringValue(entry.data.question),
      questionTitle: titleOf(questionById, entry.data.question),
      readingId: stringValue(entry.data.triggeredBy) || undefined,
      readingTitle: titleOf(readingById, entry.data.triggeredBy) || undefined,
      fromVersion: numberValue(entry.data.fromVersion) ?? 0,
      toVersion: numberValue(entry.data.toVersion) ?? 0,
      reason: stringValue(entry.data.reason),
      newStance: stringValue(entry.data.newStance),
      accepted: stringArray(entry.data.accepted),
      doubts: stringArray(entry.data.doubts),
      newQuestions: stringArray(entry.data.newQuestions)
    }));
}
