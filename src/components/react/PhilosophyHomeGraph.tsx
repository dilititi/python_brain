import { ArrowUpRight, Network, RotateCcw, Search, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SubmitEvent,
} from "react";
import type {
  PhilosophyHomeGraphData,
  PhilosophyHomeGraphNode,
  PhilosophyHomeNodeKind,
} from "../../lib/philosophy-home-graph";
import { findPhilosophyHomeMatches } from "../../lib/philosophy-home-search";

type Props = {
  graph: PhilosophyHomeGraphData;
};

const nodeColors: Record<PhilosophyHomeNodeKind, string> = {
  question: "#5b8cff",
  notion: "#a78bfa",
  reading: "#f4b860",
  source: "#3ddbd9",
  entry: "#5ed69a",
  "understanding-claim": "#fb7185",
  perspective: "#8297ff",
};

const kindLabels: Record<PhilosophyHomeNodeKind, string> = {
  question: "问题",
  notion: "概念",
  reading: "阅读",
  source: "资料",
  entry: "立场变化",
  "understanding-claim": "理解主张",
  perspective: "理论视角",
};

const quickLinks = [
  { href: "/philosophy/review/", label: "学习回顾" },
  { href: "/philosophy/next/", label: "下一步学习" },
  { href: "/philosophy/evidence/", label: "证据锚点" },
  { href: "/philosophy/gaps/", label: "理解缺口" },
  { href: "/philosophy/abilities/", label: "能力维度" },
  { href: "/graph/", label: "Python 知识库" },
];

function replaceFocusInUrl(nodeId?: string) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  if (nodeId) {
    url.searchParams.set("focus", nodeId);
  } else {
    url.searchParams.delete("focus");
  }

  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

export default function PhilosophyHomeGraph({ graph }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);
  const initialNode = graph.nodes.find((node) => node.id === graph.defaultCenterId)
    ?? graph.nodes[0];
  const [query, setQuery] = useState("");
  const [centerId, setCenterId] = useState(initialNode?.id ?? "");
  const [selectedNode, setSelectedNode] = useState<PhilosophyHomeGraphNode | undefined>(initialNode);
  const [hydrated, setHydrated] = useState(false);
  const [focusReady, setFocusReady] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);

  const focusNode = useCallback((
    nodeId: string,
    options: { syncUrl?: boolean; clearQuery?: boolean } = {},
  ) => {
    const node = graph.nodes.find((candidate) => candidate.id === nodeId);
    if (!node) return;
    setCenterId(node.id);
    setSelectedNode(node);
    setResultsOpen(false);
    setActiveResultIndex(-1);
    if (options.clearQuery) setQuery("");
    if (options.syncUrl !== false) replaceFocusInUrl(node.id);
  }, [graph.nodes]);

  const resetToDefault = useCallback(() => {
    const fallback = graph.nodes.find((node) => node.id === graph.defaultCenterId)
      ?? graph.nodes[0];
    if (fallback) {
      focusNode(fallback.id, { syncUrl: false, clearQuery: true });
    }
    setResultsOpen(false);
    setActiveResultIndex(-1);
    replaceFocusInUrl();
  }, [focusNode, graph.defaultCenterId, graph.nodes]);

  const searchResults = useMemo(
    () => findPhilosophyHomeMatches(graph.nodes, query, 6),
    [graph.nodes, query],
  );

  useEffect(() => {
    const url = new URL(window.location.href);
    const requestedFocus = url.searchParams.get("focus");
    const requestedNode = requestedFocus
      ? graph.nodes.find((node) => node.id === requestedFocus)
      : undefined;

    if (requestedNode) {
      focusNode(requestedNode.id, { syncUrl: false });
    } else if (requestedFocus) {
      const fallback = graph.nodes.find((node) => node.id === graph.defaultCenterId)
        ?? graph.nodes[0];
      if (fallback) focusNode(fallback.id, { syncUrl: false });
      replaceFocusInUrl();
    }

    setHydrated(true);
    setFocusReady(true);
  }, [focusNode, graph.defaultCenterId, graph.nodes]);

  const visibleGraph = useMemo(() => {
    const center = graph.nodes.find((node) => node.id === centerId);
    if (!center) {
      return { nodes: [] as PhilosophyHomeGraphNode[], edges: graph.edges.slice(0, 0), neighbors: [] as PhilosophyHomeGraphNode[] };
    }

    const neighborIds = new Set<string>();
    for (const edge of graph.edges) {
      if (edge.source === centerId) neighborIds.add(edge.target);
      if (edge.target === centerId) neighborIds.add(edge.source);
    }

    const neighbors = graph.nodes.filter((node) => neighborIds.has(node.id));
    const visibleIds = new Set([centerId, ...neighborIds]);

    return {
      nodes: [center, ...neighbors],
      neighbors,
      edges: graph.edges.filter(
        (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target),
      ),
    };
  }, [centerId, graph.edges, graph.nodes]);

  useEffect(() => {
    let disposed = false;
    let resizeObserver: ResizeObserver | undefined;

    async function mountGraph() {
      const { default: cytoscape } = await import("cytoscape");
      if (!containerRef.current || disposed) return;

      cyRef.current?.destroy();

      const positions = new Map<string, { x: number; y: number }>();
      positions.set(centerId, { x: 0, y: 0 });
      const neighborCount = visibleGraph.neighbors.length;
      const useTwoRings = neighborCount > 12;
      const innerRingCount = useTwoRings ? Math.ceil(neighborCount / 2) : neighborCount;

      visibleGraph.neighbors.forEach((node, index) => {
        const isOuterRing = useTwoRings && index >= innerRingCount;
        const ringIndex = isOuterRing ? index - innerRingCount : index;
        const ringCount = isOuterRing ? neighborCount - innerRingCount : innerRingCount;
        const radius = useTwoRings ? (isOuterRing ? 286 : 174) : neighborCount > 8 ? 245 : 205;
        const angleOffset = isOuterRing
          ? -Math.PI / 2 + Math.PI / Math.max(ringCount, 1)
          : -Math.PI / 2;
        const angle = (Math.PI * 2 * ringIndex) / Math.max(ringCount, 1) + angleOffset;
        positions.set(node.id, {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        });
      });

      cyRef.current = cytoscape({
        container: containerRef.current,
        elements: [
          ...visibleGraph.nodes.map((node) => ({
            data: {
              id: node.id,
              label: node.label,
              kind: node.kind,
              href: node.href,
              isCenter: node.id === centerId ? 1 : 0,
            },
            position: positions.get(node.id),
          })),
          ...visibleGraph.edges.map((edge) => ({
            data: {
              id: edge.id,
              source: edge.source,
              target: edge.target,
              kind: edge.kind,
            },
          })),
        ],
        style: [
          {
            selector: "node",
            style: {
              "background-color": (element: any) => nodeColors[element.data("kind") as PhilosophyHomeNodeKind],
              "border-color": "rgba(255, 255, 255, 0.72)",
              "border-width": 1.5,
              color: "#f7f8ff",
              content: "data(label)",
              "font-family": "Iowan Old Style, Noto Serif SC, Songti SC, serif",
              "font-size": 9,
              "font-weight": 600,
              height: 32,
              "label": "data(label)",
              "overlay-color": "#ffffff",
              "overlay-opacity": 0,
              "underlay-color": (element: any) => nodeColors[element.data("kind") as PhilosophyHomeNodeKind],
              "underlay-opacity": 0.1,
              "underlay-padding": 8,
              "text-background-color": "#08090d",
              "text-background-opacity": 0.86,
              "text-background-padding": "3px",
              "text-margin-y": 9,
              "text-outline-color": "#08090d",
              "text-outline-width": 2,
              "text-valign": "bottom",
              "text-wrap": "wrap",
              "text-max-width": "96px",
              width: 32,
            },
          },
          {
            selector: "node[isCenter = 1]",
            style: {
              "border-color": "#ffffff",
              "border-width": 3.5,
              "font-size": 14,
              "font-weight": 700,
              height: 68,
              "underlay-opacity": 0.2,
              "underlay-padding": 13,
              "text-margin-y": 16,
              "text-max-width": "156px",
              width: 68,
            },
          },
          {
            selector: "node:active",
            style: {
              "overlay-opacity": 0.12,
            },
          },
          {
            selector: "edge",
            style: {
              "curve-style": "straight",
              "line-color": "#526079",
              opacity: 0.44,
              "target-arrow-color": "#70809d",
              "target-arrow-shape": "triangle",
              "arrow-scale": 0.58,
              width: 1,
            },
          },
        ],
        layout: {
          name: "preset",
          animate: true,
          animationDuration: 320,
          fit: true,
          padding: 92,
        },
        autoungrabify: true,
        minZoom: 0.45,
        maxZoom: 2.2,
        wheelSensitivity: 0.22,
      });

      cyRef.current.on("tap", "node", (event: any) => {
        const nodeId = event.target.data("id");
        if (typeof nodeId === "string") {
          focusNode(nodeId, { clearQuery: true });
        }
      });

      resizeObserver = new ResizeObserver(() => {
        cyRef.current?.resize();
        cyRef.current?.fit(undefined, 72);
      });
      resizeObserver.observe(containerRef.current);
    }

    mountGraph();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      cyRef.current?.destroy();
      cyRef.current = null;
    };
  }, [centerId, focusNode, visibleGraph]);

  function handleQuery(nextQuery: string) {
    const nextResults = findPhilosophyHomeMatches(graph.nodes, nextQuery, 6);
    setQuery(nextQuery);
    setResultsOpen(Boolean(nextQuery.trim()) && nextResults.length > 0);
    setActiveResultIndex(nextResults.length > 0 ? 0 : -1);
  }

  function selectSearchResult(node: PhilosophyHomeGraphNode) {
    setQuery(node.label);
    focusNode(node.id);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = searchResults[activeResultIndex] ?? searchResults[0];
    if (result) selectSearchResult(result);
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && searchResults.length > 0) {
      event.preventDefault();
      setResultsOpen(true);
      setActiveResultIndex((current) => current < 0 ? 0 : (current + 1) % searchResults.length);
      return;
    }

    if (event.key === "ArrowUp" && searchResults.length > 0) {
      event.preventDefault();
      setResultsOpen(true);
      setActiveResultIndex((current) => current < 0
        ? searchResults.length - 1
        : (current - 1 + searchResults.length) % searchResults.length);
      return;
    }

    if (event.key === "Enter" && resultsOpen) {
      event.preventDefault();
      const result = searchResults[activeResultIndex] ?? searchResults[0];
      if (result) selectSearchResult(result);
      return;
    }

    if (event.key === "Escape" && resultsOpen) {
      event.preventDefault();
      setResultsOpen(false);
      setActiveResultIndex(-1);
    }
  }

  return (
    <section
      className="ph-home-graph"
      data-philosophy-graph-home
      data-hydrated={hydrated ? "true" : "false"}
      data-focus-ready={focusReady ? "true" : "false"}
    >
      <header className="ph-home-searchbar">
        <a className="ph-home-identity" href="/philosophy/" aria-label="进入思想工作台">
          <Network aria-hidden="true" size={18} />
          <span><strong>思想工作台</strong><small>QUESTION-DRIVEN GRAPH</small></span>
        </a>

        <form className="ph-home-search" role="search" onSubmit={handleSubmit}>
          <label className="ph-sr-only" htmlFor="philosophy-home-search">搜索思想节点</label>
          <Search aria-hidden="true" size={19} />
          <input
            id="philosophy-home-search"
            type="search"
            role="combobox"
            value={query}
            onChange={(event) => handleQuery(event.target.value)}
            onFocus={() => {
              if (query.trim() && searchResults.length > 0) setResultsOpen(true);
            }}
            onBlur={() => setResultsOpen(false)}
            onKeyDown={handleSearchKeyDown}
            placeholder="搜索问题、概念、理论、阅读……"
            autoComplete="off"
            aria-label="搜索思想节点"
            aria-autocomplete="list"
            aria-controls="philosophy-home-results"
            aria-expanded={resultsOpen}
            aria-activedescendant={resultsOpen && activeResultIndex >= 0
              ? `philosophy-home-result-${activeResultIndex}`
              : undefined}
          />
          {query && (
            <button type="button" onClick={() => handleQuery("")} aria-label="清空搜索">
              <X aria-hidden="true" size={17} />
            </button>
          )}
          <span className="ph-home-search-status" role="status">
            {query && searchResults.length === 0
              ? "未找到匹配"
              : resultsOpen
                ? `${searchResults.length} 个匹配 · 使用方向键选择`
                : query
                  ? `当前中心 · ${selectedNode?.label ?? "未选择"}`
                  : "搜索一个问题或概念，把它移到图谱中心"}
          </span>
          {resultsOpen && (
            <div
              id="philosophy-home-results"
              className="ph-home-results"
              role="listbox"
              aria-label="搜索结果"
            >
              {searchResults.map((node, index) => (
                <button
                  id={`philosophy-home-result-${index}`}
                  key={node.id}
                  type="button"
                  role="option"
                  aria-selected={index === activeResultIndex}
                  data-search-result={node.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveResultIndex(index)}
                  onClick={() => selectSearchResult(node)}
                >
                  <i
                    className="ph-home-result-dot"
                    style={{ background: nodeColors[node.kind] }}
                    aria-hidden="true"
                  />
                  <span>
                    <strong>{node.label}</strong>
                    <small>{kindLabels[node.kind]} · {node.id}</small>
                  </span>
                  {(node.status || node.confidence) && (
                    <em>{node.status ?? node.confidence}</em>
                  )}
                </button>
              ))}
            </div>
          )}
        </form>

        <div className="ph-home-controls">
          <button className="ph-home-reset" type="button" onClick={resetToDefault} aria-label="重置中心">
            <RotateCcw aria-hidden="true" size={14} />
            <span>Reset center</span>
          </button>
          <div className="ph-home-count" aria-label="图谱规模">
            <strong>{graph.nodes.length}</strong> nodes
            <span aria-hidden="true">/</span>
            <strong>{graph.edges.length}</strong> links
          </div>
        </div>
      </header>

      <div className="ph-home-legend" data-node-legend aria-label="节点类型图例" role="list">
        {(Object.keys(kindLabels) as PhilosophyHomeNodeKind[]).map((kind) => (
          <span key={kind} data-legend-kind={kind} role="listitem">
            <i style={{ background: nodeColors[kind] }} aria-hidden="true" />
            {kindLabels[kind]}
          </span>
        ))}
      </div>

      <div className="ph-home-stage">
        <div
          ref={containerRef}
          className="ph-home-canvas"
          data-graph-canvas
          role="img"
          aria-label={selectedNode ? `${selectedNode.label}及其一阶邻居的思想图谱` : "空思想图谱"}
        />
        {graph.nodes.length === 0 && (
          <p className="ph-home-empty">还没有可用于首页图谱的 philosophy 内容。</p>
        )}
      </div>

      <aside
        className="ph-home-inspector"
        data-graph-inspector
        data-center-id={selectedNode?.id ?? ""}
        style={{ "--node-accent": selectedNode ? nodeColors[selectedNode.kind] : "#8a94a8" } as React.CSSProperties}
      >
        {selectedNode ? (
          <>
            <div className="ph-home-inspector-topline">
              <span className="ph-home-kind"><i aria-hidden="true" />{kindLabels[selectedNode.kind]}</span>
              <span>{visibleGraph.neighbors.length} 个一阶邻居</span>
            </div>
            <h1>{selectedNode.label}</h1>
            <p className="ph-home-node-id">{selectedNode.id}</p>
            {(selectedNode.status || selectedNode.confidence) && (
              <div className="ph-home-meta">
                {selectedNode.status && <span>{selectedNode.status}</span>}
                {selectedNode.confidence && <span>confidence · {selectedNode.confidence}</span>}
              </div>
            )}
            <p className="ph-home-description" data-inspector-description>
              {selectedNode.description
                ?? "这条笔记还没有适合首页展示的摘要。进入详情页，可以继续查看正文与关联材料。"}
            </p>
            {visibleGraph.neighbors.length > 0 && (
              <div className="ph-home-neighbors">
                <p>相邻节点</p>
                <div>
                  {visibleGraph.neighbors.slice(0, 8).map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => focusNode(node.id, { clearQuery: true })}
                    >
                      <i style={{ background: nodeColors[node.kind] }} aria-hidden="true" />
                      {node.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <a className="ph-home-detail-link" href={selectedNode.href}>
              进入详情页 <ArrowUpRight aria-hidden="true" size={17} />
            </a>
          </>
        ) : (
          <p>还没有可以查看的中心节点。</p>
        )}
      </aside>

      <nav className="ph-home-quicklinks" aria-label="思想工作台快捷入口">
        {quickLinks.map((link) => (
          <a key={link.href} href={link.href}>{link.label}<ArrowUpRight aria-hidden="true" size={13} /></a>
        ))}
      </nav>
    </section>
  );
}
