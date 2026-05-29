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

export default function GraphView({ nodes, edges }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);
  const [filter, setFilter] = useState<GraphNode["kind"] | "all">("all");

  const visible = useMemo(() => {
    const visibleNodes =
      filter === "all" ? nodes : nodes.filter((node) => node.kind === filter);
    const ids = new Set(visibleNodes.map((node) => node.id));
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
              "border-width": 2,
              color: "#172033",
              content: "data(label)",
              "font-family": "Inter, system-ui, sans-serif",
              "font-size": 11,
              "label": "data(label)",
              "text-margin-y": -9,
              "text-wrap": "wrap",
              "text-max-width": "92px",
              width: 24,
              height: 24
            }
          },
          {
            selector: "edge",
            style: {
              width: 1.4,
              "line-color": "#b8c2d2",
              "target-arrow-color": "#b8c2d2",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              opacity: 0.75
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
          nodeRepulsion: 6000,
          idealEdgeLength: 100
        }
      });

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
            title={kind === "all" ? "全部" : kind}
          >
            {kind === "all" ? <Network size={16} /> : <Rows3 size={16} />}
            <span>{kind === "all" ? "全部" : kind}</span>
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
