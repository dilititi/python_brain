import { getAllContent } from "./relations";

export type GraphNode = {
  id: string;
  label: string;
  kind: "concept" | "case" | "project" | "person";
  category?: string;
  href: string;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  kind:
    | "prerequisite"
    | "related"
    | "expands"
    | "applies"
    | "builds"
    | "created-by";
};

function addEdge(edges: GraphEdge[], edge: Omit<GraphEdge, "id">) {
  const id = `${edge.source}:${edge.kind}:${edge.target}`;

  if (!edges.some((item) => item.id === id)) {
    edges.push({ id, ...edge });
  }
}

export async function buildGraph() {
  const { concepts, cases, projects, people } = await getAllContent();
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (const entry of concepts) {
    nodes.push({
      id: `concept:${entry.id}`,
      label: entry.data.title,
      kind: "concept",
      category: entry.data.category,
      href: `/concepts/${entry.id}/`
    });

    for (const target of entry.data.prerequisites) {
      addEdge(edges, {
        source: `concept:${target}`,
        target: `concept:${entry.id}`,
        kind: "prerequisite"
      });
    }

    for (const target of entry.data.related) {
      addEdge(edges, {
        source: `concept:${entry.id}`,
        target: `concept:${target}`,
        kind: "related"
      });
    }

    for (const target of entry.data.expandsTo) {
      addEdge(edges, {
        source: `concept:${entry.id}`,
        target: `concept:${target}`,
        kind: "expands"
      });
    }
  }

  for (const entry of cases) {
    nodes.push({
      id: `case:${entry.id}`,
      label: entry.data.title,
      kind: "case",
      href: `/cases/${entry.id}/`
    });

    for (const concept of entry.data.concepts) {
      addEdge(edges, {
        source: `concept:${concept}`,
        target: `case:${entry.id}`,
        kind: "applies"
      });
    }
  }

  for (const entry of projects) {
    nodes.push({
      id: `project:${entry.id}`,
      label: entry.data.title,
      kind: "project",
      href: `/projects/${entry.id}/`
    });

    for (const concept of entry.data.concepts) {
      addEdge(edges, {
        source: `concept:${concept}`,
        target: `project:${entry.id}`,
        kind: "builds"
      });
    }

    for (const caseId of entry.data.cases) {
      addEdge(edges, {
        source: `case:${caseId}`,
        target: `project:${entry.id}`,
        kind: "builds"
      });
    }
  }

  for (const entry of people) {
    nodes.push({
      id: `person:${entry.id}`,
      label: entry.data.name,
      kind: "person",
      href: `/people/${entry.id}/`
    });

    for (const concept of entry.data.concepts) {
      addEdge(edges, {
        source: `person:${entry.id}`,
        target: `concept:${concept}`,
        kind: "created-by"
      });
    }
  }

  return { nodes, edges };
}
