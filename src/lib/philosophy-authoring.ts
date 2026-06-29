export const philosophySlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const philosophyEntryIdPattern = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const philosophySourceTypes = [
  "book",
  "paper",
  "encyclopedia",
  "article",
  "blog",
  "video",
  "course",
  "documentation",
  "news",
  "forum",
  "other"
] as const;

export type PhilosophyCollectionName =
  | "questions"
  | "perspectives"
  | "readings"
  | "notions"
  | "entries"
  | "sources"
  | "understanding-claims";

export type PhilosophySourceType = (typeof philosophySourceTypes)[number];

export type QuestionTemplateOptions = {
  id: string;
  title: string;
  date: string;
};

export type SourceTemplateOptions = {
  id: string;
  title: string;
  url: string;
  type: PhilosophySourceType;
  summary: string;
  whySaved: string;
  question: string;
};

export type UnderstandingClaimTemplateOptions = {
  id: string;
  title: string;
  date: string;
};

export function isPhilosophyId(collection: PhilosophyCollectionName, id: string): boolean {
  return collection === "entries"
    ? philosophyEntryIdPattern.test(id)
    : philosophySlugPattern.test(id);
}

export function assertPhilosophyId(collection: PhilosophyCollectionName, id: string): void {
  if (isPhilosophyId(collection, id)) return;

  if (collection === "entries") {
    throw new Error(`${collection} id must start with YYYY-MM-DD followed by a kebab-case slug`);
  }

  throw new Error(`${collection} id must be kebab-case, for example what-is-history`);
}

function assertUsefulOption(label: string, value: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty`);
  }
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

export function renderQuestionTemplate(options: QuestionTemplateOptions): string {
  assertPhilosophyId("questions", options.id);
  assertUsefulOption("title", options.title);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.date)) {
    throw new Error("date must use YYYY-MM-DD");
  }

  return `---
title: ${yamlString(options.title)}
status: open
updatedAt: ${yamlString(options.date)}
currentAnswer: "尚未形成暂定回答。"
dimensions: []
stances: []
relatedReadings: []
openQuestions: []
---

## 我正在追问什么

先说明这个问题为什么值得持续追问，以及它和哪些具体判断有关。

## 当前暂定回答

目前尚未形成暂定回答。后续每次变化通过 entry 留下版本记录。

## 不同理论如何回答

在 frontmatter 的 dimensions 和 stances 中建立同题对照，而不是罗列理论简介。

## 哪些 readings 支撑这些回答

把需要长期跟读的原典加入 relatedReadings；普通参考资料继续使用 sources。

## 我的立场如何演化

新增 entry 后，本节由 Question 页面时间线自动聚合。

## 还剩哪些未解决的问题

把下一轮阅读真正需要回答的问题加入 openQuestions。
`;
}

export function renderSourceTemplate(options: SourceTemplateOptions): string {
  assertPhilosophyId("sources", options.id);
  assertPhilosophyId("questions", options.question);
  assertUsefulOption("title", options.title);
  assertUsefulOption("summary", options.summary);
  assertUsefulOption("whySaved", options.whySaved);

  if (!options.url.startsWith("https://")) {
    throw new Error("source url must start with https://");
  }

  if (!philosophySourceTypes.includes(options.type)) {
    throw new Error(`source type must be one of: ${philosophySourceTypes.join(", ")}`);
  }

  return `---
title: ${yamlString(options.title)}
url: ${yamlString(options.url)}
type: ${options.type}
authors: []
language: zh
reliability: unknown
status: saved
relatedQuestions:
  - ${options.question}
relatedNotions: []
relatedPerspectives: []
summary: ${yamlString(options.summary)}
whySaved: ${yamlString(options.whySaved)}
useFor: []
limitations: []
---

## 这条资料如何帮助问题

记录它实际支持、修正或反驳了哪个判断。

## 使用结果与局限

阅读后补充可复用的证据、适用范围和仍需核对的限制。
`;
}

export function renderUnderstandingClaimTemplate(options: UnderstandingClaimTemplateOptions): string {
  assertPhilosophyId("understanding-claims", options.id);
  assertUsefulOption("title", options.title);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.date)) {
    throw new Error("date must use YYYY-MM-DD");
  }

  return `---
title: ${yamlString(options.title)}
targetType: "notion"
target: ""
claim: ""
status: "draft"
confidence: "medium"
relatedQuestions: []
relatedNotions: []
relatedPerspectives: []
relatedReadings: []
relatedSources: []
relatedEntries: []
evidence: []
gaps: []
counterEvidence: []
nextTasks: []
createdAt: ${yamlString(options.date)}
updatedAt: ${yamlString(options.date)}
---

## 理解主张说明

用自己的话写下：我到底声称自己理解了什么？

## 当前证据

列出能支持这条理解主张的阅读、资料、entry 或应用记录。

## 当前缺口

写下还无法解释、尚未细读或可能被反驳的地方。

## 下一步任务

把下一步验证动作写成可以执行的小任务。
`;
}
