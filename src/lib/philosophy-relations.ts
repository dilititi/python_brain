import {
  isPhilosophyId,
  philosophySlugPattern,
  type PhilosophyCollectionName
} from "./philosophy-authoring";

export type PhilosophyRelationEntry = {
  id: string;
  data: Record<string, unknown>;
};

export type PhilosophyRelationsInput = {
  questions: PhilosophyRelationEntry[];
  perspectives: PhilosophyRelationEntry[];
  readings: PhilosophyRelationEntry[];
  notions: PhilosophyRelationEntry[];
  entries: PhilosophyRelationEntry[];
  sources: PhilosophyRelationEntry[];
  understandingClaims?: PhilosophyRelationEntry[];
  concepts?: PhilosophyRelationEntry[];
  cases?: PhilosophyRelationEntry[];
  projects?: PhilosophyRelationEntry[];
  people?: PhilosophyRelationEntry[];
  paths?: PhilosophyRelationEntry[];
};

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function recordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    : [];
}

function checkMany(
  errors: string[],
  collection: string,
  entry: PhilosophyRelationEntry,
  field: string,
  values: unknown,
  targetIds: Set<string>,
  targetLabel: string
) {
  stringArray(values).forEach((value, index) => {
    if (!philosophySlugPattern.test(value)) {
      errors.push(`${collection}/${entry.id} | ${field}[${index}] must be a kebab-case ${targetLabel} slug, received "${value}"`);
      return;
    }

    if (!targetIds.has(value)) {
      errors.push(`${collection}/${entry.id} | ${field}[${index}] references missing ${targetLabel} "${value}"`);
    }
  });
}

function checkOne(
  errors: string[],
  collection: string,
  entry: PhilosophyRelationEntry,
  field: string,
  value: unknown,
  targetIds: Set<string>,
  targetLabel: string
) {
  if (typeof value !== "string") return;

  if (!philosophySlugPattern.test(value)) {
    errors.push(`${collection}/${entry.id} | ${field} must be a kebab-case ${targetLabel} slug, received "${value}"`);
    return;
  }

  if (!targetIds.has(value)) {
    errors.push(`${collection}/${entry.id} | ${field} references missing ${targetLabel} "${value}"`);
  }
}

function checkCollectionIds(
  errors: string[],
  collection: PhilosophyCollectionName,
  entries: PhilosophyRelationEntry[]
) {
  for (const entry of entries) {
    if (isPhilosophyId(collection, entry.id)) continue;

    errors.push(collection === "entries"
      ? `${collection}/${entry.id} | id must start with YYYY-MM-DD followed by a kebab-case slug`
      : `${collection}/${entry.id} | id must be kebab-case (lowercase letters, numbers, and single hyphens)`);
  }
}

export function validatePhilosophyRelations(input: PhilosophyRelationsInput): string[] {
  const errors: string[] = [];
  const understandingClaims = input.understandingClaims ?? [];
  const questionIds = new Set(input.questions.map((entry) => entry.id));
  const perspectiveIds = new Set(input.perspectives.map((entry) => entry.id));
  const readingIds = new Set(input.readings.map((entry) => entry.id));
  const notionIds = new Set(input.notions.map((entry) => entry.id));
  const sourceIds = new Set(input.sources.map((entry) => entry.id));
  const entryIds = new Set(input.entries.map((entry) => entry.id));
  const conceptIds = new Set((input.concepts ?? []).map((entry) => entry.id));
  const caseIds = new Set((input.cases ?? []).map((entry) => entry.id));
  const projectIds = new Set((input.projects ?? []).map((entry) => entry.id));
  const personIds = new Set((input.people ?? []).map((entry) => entry.id));
  const pathIds = new Set((input.paths ?? []).map((entry) => entry.id));
  const localRefTargets = new Map<string, { ids: Set<string>; label: string }>([
    ["question", { ids: questionIds, label: "question" }],
    ["perspective", { ids: perspectiveIds, label: "perspective" }],
    ["reading", { ids: readingIds, label: "reading" }],
    ["notion", { ids: notionIds, label: "notion" }],
    ["source", { ids: sourceIds, label: "source" }],
    ["entry", { ids: entryIds, label: "entry" }],
    ["concept", { ids: conceptIds, label: "concept" }],
    ["case", { ids: caseIds, label: "case" }],
    ["project", { ids: projectIds, label: "project" }],
    ["person", { ids: personIds, label: "person" }],
    ["path", { ids: pathIds, label: "path" }]
  ]);

  checkCollectionIds(errors, "questions", input.questions);
  checkCollectionIds(errors, "perspectives", input.perspectives);
  checkCollectionIds(errors, "readings", input.readings);
  checkCollectionIds(errors, "notions", input.notions);
  checkCollectionIds(errors, "entries", input.entries);
  checkCollectionIds(errors, "sources", input.sources);
  checkCollectionIds(errors, "understanding-claims", understandingClaims);

  for (const question of input.questions) {
    checkMany(errors, "questions", question, "relatedReadings", question.data.relatedReadings, readingIds, "reading");

    recordArray(question.data.stances).forEach((stance, index) => {
      checkOne(errors, "questions", question, `stances[${index}].perspective`, stance.perspective, perspectiveIds, "perspective");
    });
  }

  for (const perspective of input.perspectives) {
    checkMany(errors, "perspectives", perspective, "keyNotions", perspective.data.keyNotions, notionIds, "notion");
    checkMany(errors, "perspectives", perspective, "readings", perspective.data.readings, readingIds, "reading");
  }

  for (const reading of input.readings) {
    checkOne(errors, "readings", reading, "perspective", reading.data.perspective, perspectiveIds, "perspective");
  }

  for (const notion of input.notions) {
    checkOne(errors, "notions", notion, "perspective", notion.data.perspective, perspectiveIds, "perspective");
  }

  for (const entry of input.entries) {
    checkOne(errors, "entries", entry, "question", entry.data.question, questionIds, "question");
    checkOne(errors, "entries", entry, "triggeredBy", entry.data.triggeredBy, readingIds, "reading");

    if (
      typeof entry.data.question === "string" &&
      typeof entry.data.triggeredBy === "string" &&
      questionIds.has(entry.data.question) &&
      readingIds.has(entry.data.triggeredBy)
    ) {
      const question = input.questions.find((item) => item.id === entry.data.question);
      const relatedReadings = stringArray(question?.data.relatedReadings);
      const questionReadingRefsAreValid = relatedReadings.every((reading) => (
        philosophySlugPattern.test(reading) && readingIds.has(reading)
      ));

      if (questionReadingRefsAreValid && !relatedReadings.includes(entry.data.triggeredBy)) {
        errors.push(
          `entries/${entry.id} | triggeredBy reading "${entry.data.triggeredBy}" must be listed in questions/${entry.data.question} relatedReadings`
        );
      }
    }

    if (
      typeof entry.data.fromVersion === "number" &&
      typeof entry.data.toVersion === "number" &&
      entry.data.toVersion !== entry.data.fromVersion + 1
    ) {
      errors.push(`entries/${entry.id} | toVersion must equal fromVersion + 1`);
    }
  }

  const entriesByQuestion = new Map<string, PhilosophyRelationEntry[]>();
  for (const entry of input.entries) {
    if (typeof entry.data.question !== "string") continue;
    entriesByQuestion.set(entry.data.question, [...(entriesByQuestion.get(entry.data.question) ?? []), entry]);
  }

  for (const [questionId, questionEntries] of entriesByQuestion) {
    const ordered = questionEntries
      .filter((entry) => typeof entry.data.fromVersion === "number" && typeof entry.data.toVersion === "number")
      .sort((left, right) => Number(left.data.fromVersion) - Number(right.data.fromVersion));

    if (ordered.length > 0 && ordered[0]?.data.fromVersion !== 0) {
      errors.push(`entries/${ordered[0]?.id} | the first entry for question ${questionId} must start at V0`);
    }

    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1];
      const current = ordered[index];
      if (!previous || !current) continue;

      if (current.data.fromVersion !== previous.data.toVersion) {
        errors.push(`entries/${current.id} | fromVersion must continue from the previous entry V${String(previous.data.toVersion)}`);
      }

      if (
        typeof current.data.priorStance === "string" &&
        typeof previous.data.newStance === "string" &&
        current.data.priorStance.trim() !== previous.data.newStance.trim()
      ) {
        errors.push(`entries/${current.id} | priorStance must match the previous entry newStance for question ${questionId}`);
      }
    }
  }

  for (const source of input.sources) {
    checkMany(errors, "sources", source, "relatedQuestions", source.data.relatedQuestions, questionIds, "question");
    checkMany(errors, "sources", source, "relatedNotions", source.data.relatedNotions, notionIds, "notion");
    checkMany(errors, "sources", source, "relatedPerspectives", source.data.relatedPerspectives, perspectiveIds, "perspective");
  }

  for (const claim of understandingClaims) {
    if (typeof claim.data.targetType === "string" && claim.data.targetType !== "other") {
      const target = localRefTargets.get(claim.data.targetType);
      if (target) {
        const targetValue = typeof claim.data.target === "string" ? claim.data.target : "";
        if (targetValue.trim().length > 0) {
          checkOne(errors, "understanding-claims", claim, "target", targetValue, target.ids, target.label);
        } else if (claim.data.status !== "draft") {
          errors.push(`understanding-claims/${claim.id} | target is required when targetType is "${claim.data.targetType}"`);
        }
      }
    }

    checkMany(errors, "understanding-claims", claim, "relatedQuestions", claim.data.relatedQuestions, questionIds, "question");
    checkMany(errors, "understanding-claims", claim, "relatedNotions", claim.data.relatedNotions, notionIds, "notion");
    checkMany(errors, "understanding-claims", claim, "relatedPerspectives", claim.data.relatedPerspectives, perspectiveIds, "perspective");
    checkMany(errors, "understanding-claims", claim, "relatedReadings", claim.data.relatedReadings, readingIds, "reading");
    checkMany(errors, "understanding-claims", claim, "relatedSources", claim.data.relatedSources, sourceIds, "source");
    checkMany(errors, "understanding-claims", claim, "relatedEntries", claim.data.relatedEntries, entryIds, "entry");

    recordArray(claim.data.evidence).forEach((evidence, index) => {
      if (typeof evidence.refType !== "string" || evidence.refType === "none" || evidence.refType === "external") {
        return;
      }

      const target = localRefTargets.get(evidence.refType);
      if (!target) return;

      if (typeof evidence.ref !== "string") {
        errors.push(`understanding-claims/${claim.id} | evidence[${index}].ref is required when refType is "${evidence.refType}"`);
        return;
      }

      checkOne(errors, "understanding-claims", claim, `evidence[${index}].ref`, evidence.ref, target.ids, target.label);
    });
  }

  return errors;
}
