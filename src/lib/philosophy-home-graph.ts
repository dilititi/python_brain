import type { CollectionEntry } from "astro:content";

export type PhilosophyHomeNodeKind =
  | "question"
  | "notion"
  | "reading"
  | "source"
  | "entry"
  | "understanding-claim"
  | "perspective";

export type PhilosophyHomeEdgeKind =
  | "question-notion"
  | "question-reading"
  | "question-source"
  | "question-entry"
  | "question-claim"
  | "question-perspective"
  | "claim-reading"
  | "claim-source"
  | "claim-entry"
  | "claim-notion"
  | "claim-perspective"
  | "perspective-notion"
  | "perspective-reading";

export type PhilosophyHomeGraphNode = {
  id: string;
  label: string;
  kind: PhilosophyHomeNodeKind;
  href: string;
  description?: string;
  keywords: string[];
  status?: string;
  confidence?: string;
};

export type PhilosophyHomeGraphEdge = {
  id: string;
  source: string;
  target: string;
  kind: PhilosophyHomeEdgeKind;
};

export type PhilosophyHomeGraphData = {
  nodes: PhilosophyHomeGraphNode[];
  edges: PhilosophyHomeGraphEdge[];
  defaultCenterId: string;
};

type PhilosophyHomeGraphInput = {
  questions: CollectionEntry<"questions">[];
  notions: CollectionEntry<"notions">[];
  readings: CollectionEntry<"readings">[];
  sources: CollectionEntry<"sources">[];
  entries: CollectionEntry<"entries">[];
  understandingClaims: CollectionEntry<"understanding-claims">[];
  perspectives: CollectionEntry<"perspectives">[];
};

function asRecord(data: unknown): Record<string, unknown> {
  return typeof data === "object" && data !== null
    ? data as Record<string, unknown>
    : {};
}

function getString(data: unknown, key: string): string | undefined {
  const value = asRecord(data)[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function getStringArray(data: unknown, key: string): string[] {
  const value = asRecord(data)[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
}

function getUnknownArray(data: unknown, key: string): unknown[] {
  const value = asRecord(data)[key];
  return Array.isArray(value) ? value : [];
}

function compactKeywords(values: unknown[]): string[] {
  return [...new Set(
    values
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      )
      .map((value) => value.trim()),
  )];
}

export function buildPhilosophyHomeGraph(
  input: PhilosophyHomeGraphInput,
): PhilosophyHomeGraphData {
  const nodes: PhilosophyHomeGraphNode[] = [];
  const edges: PhilosophyHomeGraphEdge[] = [];

  for (const entry of input.questions) {
    const description = getString(entry.data, "currentPosition")
      ?? getString(entry.data, "currentAnswer")
      ?? getString(entry.data, "summary");
    const status = getString(entry.data, "status");

    nodes.push({
      id: `question:${entry.id}`,
      label: getString(entry.data, "title") ?? entry.id,
      kind: "question",
      href: `/questions/${entry.id}/`,
      description,
      keywords: compactKeywords([
        entry.id,
        getString(entry.data, "title"),
        description,
        status,
        getStringArray(entry.data, "abilities"),
      ]),
      status,
    });
  }

  for (const entry of input.notions) {
    const summary = getString(entry.data, "summary");

    nodes.push({
      id: `notion:${entry.id}`,
      label: getString(entry.data, "title") ?? entry.id,
      kind: "notion",
      href: `/notions/${entry.id}/`,
      description: summary,
      keywords: compactKeywords([
        entry.id,
        getString(entry.data, "title"),
        summary,
        getStringArray(entry.data, "abilities"),
      ]),
    });
  }

  for (const entry of input.readings) {
    const status = getString(entry.data, "status");
    const description = getString(entry.data, "notes");

    nodes.push({
      id: `reading:${entry.id}`,
      label: getString(entry.data, "title") ?? entry.id,
      kind: "reading",
      href: `/readings/${entry.id}/`,
      description,
      keywords: compactKeywords([
        entry.id,
        getString(entry.data, "title"),
        getString(entry.data, "originalTitle"),
        getString(entry.data, "author"),
        getString(entry.data, "perspective"),
        description,
        status,
      ]),
      status,
    });
  }

  for (const entry of input.sources) {
    const description = getString(entry.data, "summary")
      ?? getString(entry.data, "whySaved");
    const status = getString(entry.data, "status");

    nodes.push({
      id: `source:${entry.id}`,
      label: getString(entry.data, "title") ?? entry.id,
      kind: "source",
      href: `/sources/${entry.id}/`,
      description,
      keywords: compactKeywords([
        entry.id,
        getString(entry.data, "title"),
        description,
        getString(entry.data, "whySaved"),
        getString(entry.data, "reliability"),
        status,
      ]),
      status,
    });
  }

  for (const entry of input.entries) {
    const date = getString(entry.data, "date");

    nodes.push({
      id: `entry:${entry.id}`,
      label: getString(entry.data, "title") ?? entry.id,
      kind: "entry",
      href: `/entries/${entry.id}/`,
      keywords: compactKeywords([
        entry.id,
        getString(entry.data, "title"),
        date,
      ]),
      status: date,
    });
  }

  for (const entry of input.understandingClaims) {
    const claim = getString(entry.data, "claim");
    const status = getString(entry.data, "status");
    const confidence = getString(entry.data, "confidence");

    nodes.push({
      id: `claim:${entry.id}`,
      label: getString(entry.data, "title") ?? entry.id,
      kind: "understanding-claim",
      href: `/understanding-claims/${entry.id}/`,
      description: claim,
      keywords: compactKeywords([
        entry.id,
        getString(entry.data, "title"),
        claim,
        status,
        confidence,
      ]),
      status,
      confidence,
    });
  }

  for (const entry of input.perspectives) {
    const summary = getString(entry.data, "summary");

    nodes.push({
      id: `perspective:${entry.id}`,
      label: getString(entry.data, "title") ?? entry.id,
      kind: "perspective",
      href: `/perspectives/${entry.id}/`,
      description: summary,
      keywords: compactKeywords([
        entry.id,
        getString(entry.data, "title"),
        summary,
      ]),
    });
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edgeKeys = new Set<string>();

  function addEdge(
    source: string,
    target: string,
    kind: PhilosophyHomeEdgeKind,
  ) {
    if (!nodeIds.has(source) || !nodeIds.has(target) || source === target) {
      return;
    }

    const key = `${source}|${target}|${kind}`;
    if (edgeKeys.has(key)) {
      return;
    }

    edgeKeys.add(key);
    edges.push({
      id: `edge:${kind}:${source}->${target}`,
      source,
      target,
      kind,
    });
  }

  for (const question of input.questions) {
    const questionId = `question:${question.id}`;

    for (const notionId of getStringArray(question.data, "relatedNotions")) {
      addEdge(questionId, `notion:${notionId}`, "question-notion");
    }

    for (const notion of input.notions) {
      if (getStringArray(notion.data, "relatedQuestions").includes(question.id)) {
        addEdge(questionId, `notion:${notion.id}`, "question-notion");
      }
    }

    for (const readingId of getStringArray(question.data, "relatedReadings")) {
      addEdge(questionId, `reading:${readingId}`, "question-reading");
    }

    for (const reading of input.readings) {
      if (getStringArray(reading.data, "relatedQuestions").includes(question.id)) {
        addEdge(questionId, `reading:${reading.id}`, "question-reading");
      }
    }

    for (const source of input.sources) {
      if (getStringArray(source.data, "relatedQuestions").includes(question.id)) {
        addEdge(questionId, `source:${source.id}`, "question-source");
        for (const notionId of getStringArray(source.data, "relatedNotions")) {
          addEdge(questionId, `notion:${notionId}`, "question-notion");
        }
      }
    }

    for (const entry of input.entries) {
      const relatedQuestions = getStringArray(entry.data, "relatedQuestions");
      const singleQuestion = getString(entry.data, "question");

      if (relatedQuestions.includes(question.id) || singleQuestion === question.id) {
        addEdge(questionId, `entry:${entry.id}`, "question-entry");
      }
    }

    for (const claim of input.understandingClaims) {
      const isRelated = getStringArray(claim.data, "relatedQuestions").includes(question.id);
      const isTarget = getString(claim.data, "targetType") === "question"
        && getString(claim.data, "target") === question.id;

      if (isRelated || isTarget) {
        addEdge(questionId, `claim:${claim.id}`, "question-claim");
      }
    }

    for (const stance of getUnknownArray(question.data, "stances")) {
      const perspective = getString(stance, "perspective");
      if (perspective) {
        addEdge(questionId, `perspective:${perspective}`, "question-perspective");
      }
    }
  }

  const claimRelations: Array<{
    field: string;
    prefix: "reading" | "source" | "entry" | "notion" | "perspective";
    kind: PhilosophyHomeEdgeKind;
  }> = [
    { field: "relatedReadings", prefix: "reading", kind: "claim-reading" },
    { field: "relatedSources", prefix: "source", kind: "claim-source" },
    { field: "relatedEntries", prefix: "entry", kind: "claim-entry" },
    { field: "relatedNotions", prefix: "notion", kind: "claim-notion" },
    { field: "relatedPerspectives", prefix: "perspective", kind: "claim-perspective" },
  ];

  const evidenceRelations: Record<string, {
    prefix: "reading" | "source" | "entry" | "notion" | "perspective";
    kind: PhilosophyHomeEdgeKind;
  }> = {
    reading: { prefix: "reading", kind: "claim-reading" },
    source: { prefix: "source", kind: "claim-source" },
    entry: { prefix: "entry", kind: "claim-entry" },
    notion: { prefix: "notion", kind: "claim-notion" },
    perspective: { prefix: "perspective", kind: "claim-perspective" },
  };

  for (const claim of input.understandingClaims) {
    const claimId = `claim:${claim.id}`;

    for (const relation of claimRelations) {
      for (const ref of getStringArray(claim.data, relation.field)) {
        addEdge(claimId, `${relation.prefix}:${ref}`, relation.kind);
      }
    }

    for (const evidence of getUnknownArray(claim.data, "evidence")) {
      const refType = getString(evidence, "refType");
      const ref = getString(evidence, "ref");
      const relation = refType ? evidenceRelations[refType] : undefined;

      if (relation && ref) {
        addEdge(claimId, `${relation.prefix}:${ref}`, relation.kind);
      }
    }
  }

  for (const perspective of input.perspectives) {
    const perspectiveId = `perspective:${perspective.id}`;
    const notionIds = new Set([
      ...getStringArray(perspective.data, "keyNotions"),
      ...getStringArray(perspective.data, "relatedNotions"),
    ]);
    const readingIds = new Set([
      ...getStringArray(perspective.data, "readings"),
      ...getStringArray(perspective.data, "relatedReadings"),
    ]);

    for (const notionId of notionIds) {
      addEdge(perspectiveId, `notion:${notionId}`, "perspective-notion");
    }

    for (const readingId of readingIds) {
      addEdge(perspectiveId, `reading:${readingId}`, "perspective-reading");
    }
  }

  const defaultCenterId = nodes.some((node) => node.id === "question:what-is-history")
    ? "question:what-is-history"
    : nodes.find((node) => node.kind === "question")?.id ?? nodes[0]?.id ?? "";

  return { nodes, edges, defaultCenterId };
}
