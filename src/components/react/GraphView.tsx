import { Focus, Network, Rows3 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import "./islands.css";

type GraphNode = {
  id: string;
  label: string;
  kind: "concept" | "case" | "project" | "person";
  category?: string;
  href: string;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  kind: string;
};

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

const colors = {
  concept: "#2563eb",
  case: "#168a5b",
  project: "#b7791f",
  person: "#c24161"
};

const edgeColors = {
  prerequisite: "#2563eb",
  related: "#64748b",
  extends: "#6d5bd0",
  applies: "#168a5b",
  builds: "#b7791f",
  "created-by": "#c24161"
};

const filterLabels = {
  all: "全部",
  concept: "概念关系",
  case: "案例落地",
  project: "项目承接",
  person: "人物锚点"
} as const;

export default function GraphView({ nodes, edges }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);
  const [filter, setFilter] = useState<GraphNode["kind"] | "all">("all");

  const visible = useMemo(() => {
    const primaryIds = new Set(
      (filter === "all" ? nodes : nodes.filter((node) => node.kind === filter))
        .map((node) => node.id)
    );
    const ids = new Set(primaryIds);

    if (filter !== "all" && filter !== "concept") {
      for (const edge of edges) {
        if (primaryIds.has(edge.source)) {
          ids.add(edge.target);
        }

        if (primaryIds.has(edge.target)) {
          ids.add(edge.source);
        }
      }
    }

    const visibleNodes = nodes.filter((node) => ids.has(node.id));

    return {
      nodes: visibleNodes,
      edges: edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target))
    };
  }, [edges, filter, nodes]);

  useEffect(() => {
    let disposed = false;

    async function mount() {
      const { default: cytoscape } = await import("cytoscape");

      if (!containerRef.current || disposed) {
        return;
      }

      cyRef.current?.destroy();
      cyRef.current = cytoscape({
        container: containerRef.current,
        elements: [
          ...visible.nodes.map((node) => ({
            data: {
              id: node.id,
              label: node.label,
              kind: node.kind,
              href: node.href
            }
          })),
          ...visible.edges.map((edge) => ({
            data: {
              id: edge.id,
              source: edge.source,
              target: edge.target,
              kind: edge.kind
            }
          }))
        ],
        style: [
          {
            selector: "node",
            style: {
              "background-color": (element: any) => colors[element.data("kind") as keyof typeof colors],
              "border-color": "#ffffff",
              "border-width": 3,
              color: "#172033",
              content: "data(label)",
              "font-family": "Inter, system-ui, sans-serif",
              "font-size": 10,
              "font-weight": 700,
              "label": "data(label)",
              "text-background-color": "#ffffff",
              "text-background-opacity": 0.9,
              "text-background-padding": "2px",
              "text-halign": "center",
              "text-margin-y": 10,
              "text-outline-color": "#ffffff",
              "text-outline-width": 2,
              "text-valign": "bottom",
              "text-wrap": "wrap",
              "text-max-width": "86px",
              width: 34,
              height: 34
            }
          },
          {
            selector: "edge",
            style: {
              width: 2.2,
              "line-color": (element: any) => edgeColors[element.data("kind") as keyof typeof edgeColors] ?? "#94a3b8",
              "target-arrow-color": (element: any) => edgeColors[element.data("kind") as keyof typeof edgeColors] ?? "#94a3b8",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              opacity: 0.9
            }
          },
          {
            selector: "node:selected",
            style: {
              "border-color": "#172033",
              "border-width": 4
            }
          }
        ],
        layout: {
          name: "cose",
          animate: false,
          componentSpacing: filter === "all" ? 180 : 120,
          edgeElasticity: 0.08,
          gravity: 0.12,
          idealEdgeLength: filter === "all" ? 180 : 145,
          nodeOverlap: 18,
          nodeRepulsion: filter === "all" ? 18000 : 12000,
          numIter: 1200,
          padding: 64
        }
      });

      cyRef.current.fit(undefined, 64);

      cyRef.current.on("tap", "node", (event: any) => {
        const href = event.target.data("href");
        if (href) {
          window.location.href = href;
        }
      });
    }

    mount();

    return () => {
      disposed = true;
      cyRef.current?.destroy();
      cyRef.current = null;
    };
  }, [visible]);

  return (
    <div className="graph-shell">
      <div className="island-toolbar" role="toolbar" aria-label="图谱筛选">
        {(["all", "concept", "case", "project", "person"] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            className={filter === kind ? "active" : ""}
            onClick={() => setFilter(kind)}
            title={filterLabels[kind]}
          >
            {kind === "all" ? <Network size={16} /> : <Rows3 size={16} />}
            <span>{filterLabels[kind]}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => cyRef.current?.fit(undefined, 36)}
          title="重置视图"
        >
          <Focus size={16} />
          <span>重置</span>
        </button>
      </div>
      <div ref={containerRef} className="graph-canvas" />
    </div>
  );
}
