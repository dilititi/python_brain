import type { PhilosophyHomeGraphNode } from "./philosophy-home-graph";

function normalize(value: string | undefined): string {
  return value?.trim().toLocaleLowerCase("zh-CN") ?? "";
}

function matchRank(node: PhilosophyHomeGraphNode, query: string): number {
  const label = normalize(node.label);

  if (label === query) return 500;
  if (label.startsWith(query)) return 440;
  if (label.includes(query)) return 400;
  if (normalize(node.id).includes(query)) return 300;
  if (node.keywords.some((keyword) => normalize(keyword).includes(query))) return 200;
  if (normalize(node.description).includes(query)) return 100;
  return -1;
}

export function findPhilosophyHomeMatches(
  nodes: PhilosophyHomeGraphNode[],
  rawQuery: string,
  limit = 6,
): PhilosophyHomeGraphNode[] {
  const query = normalize(rawQuery);
  const safeLimit = Math.max(0, Math.floor(Number.isFinite(limit) ? limit : 6));

  if (!query || safeLimit === 0) {
    return [];
  }

  return nodes
    .map((node, index) => ({ node, index, rank: matchRank(node, query) }))
    .filter((candidate) => candidate.rank >= 0)
    .sort((left, right) => right.rank - left.rank || left.index - right.index)
    .slice(0, safeLimit)
    .map((candidate) => candidate.node);
}
