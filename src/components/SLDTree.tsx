import { useEffect } from "react";
import { FaCopy } from "react-icons/fa";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { type SLDTreeData } from "../utils/sldResolutionDFS";
import { predicateToString } from "../utils/unification";
import { useLanguage } from "../translations/LanguageContext";
import { SearchStrategySwitcher } from "./InputBox/SearchStrategySwitcher";

interface SLDTreeProps {
  treeData: SLDTreeData;
  visibleSteps: number;
  setVisibleSteps: React.Dispatch<React.SetStateAction<number>>;
  highlightedNodeId?: string | null;
  onNodeClick?: (nodeId: string) => void;
  strategy: "dfs" | "bfs";
  onStrategyChange: (strategy: "dfs" | "bfs") => void;
}

const nodeWidth = 200;
const nodeHeight = 50;

interface SLDNodeData {
  bg: string;
  border: string;
  color: string;
  step: number;
  label: string;
  isHighlighted?: boolean;
}

const CustomSLDNode = ({ data }: { data: SLDNodeData }) => {
  return (
    <div
      style={{
        background: data.bg,
        border: `2px solid ${data.isHighlighted ? '#3b82f6' : data.border}`,
        borderRadius: "8px",
        padding: "10px",
        fontWeight: "bold",
        color: data.color,
        width: nodeWidth,
        position: "relative",
        boxShadow: data.isHighlighted ? "0 0 0 4px rgba(59, 130, 246, 0.4)" : "none",
        transform: data.isHighlighted ? "scale(1.05)" : "scale(1)",
        transition: "all 0.2s ease-in-out",
        zIndex: data.isHighlighted ? 100 : 1,
      }}
    >
      {/* Hidden handles for edge connections */}
      <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 'none' }} />
      
      <div className="text-center break-words" style={{ fontSize: '10px', lineHeight: '1.2' }} title={data.label}>{data.label}</div>

      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 'none' }} />
    </div>
  );
};

const nodeTypes = {
  sldNode: CustomSLDNode,
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "TB") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const SLDTreeContent = ({ treeData, visibleSteps, setVisibleSteps, highlightedNodeId, onNodeClick, strategy, onStrategyChange }: SLDTreeProps) => {
  const { t } = useLanguage();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const isLocked = false; // Povolené približovanie a posúvanie
  const { fitView } = useReactFlow();

  const copyTreeToLatex = () => {
    if (!treeData || treeData.nodes.length === 0) return;

    // Convert the tree into a representation suitable for LaTeX forest
    const nodesMap = new Map(treeData.nodes.map(n => [n.id, n]));
    const childrenMap = new Map<string, typeof treeData.nodes>();
    const edgesMap = new Map(treeData.edges.map(e => [`${e.source}->${e.target}`, e]));

    // Find root (node with no incoming edges)
    const hasIncoming = new Set(treeData.edges.map(e => e.target));
    const rootNodes = treeData.nodes.filter(n => !hasIncoming.has(n.id));
    if (rootNodes.length === 0) return;
    const root = rootNodes[0];

    // Build children map
    treeData.edges.forEach(e => {
      const children = childrenMap.get(e.source) || [];
      const targetNode = nodesMap.get(e.target);
      if (targetNode) {
        children.push(targetNode);
        childrenMap.set(e.source, children);
      }
    });

    const formatLatexLabel = (goals: any[]) => {
      if (goals.length === 0) return "\\Box";
      // To allow text wrapping inside math mode in TikZ/Forest, we can wrap each predicate 
      // in its own math mode. Instead of using commas natively, we'll wrap it in a tabular 
      // or similar environment if we want very strict multi-line breaks, but standard text
      // separation using spaces helps LaTeX break it.
      // We will replace spaces with line breaks (\\) natively for VERY long goals if needed,
      // but simply separating them by ", " and using text width should work.
      // To ensure that even a SINGLE long predicate wraps, we can't easily break inside math mode.
      // But we will allow breaking at the commas.
      return goals.map(g => `$${predicateToString(g).replace(/[~¬]/g, '\\neg ').replace(/_/g, '\\_')}$`).join(",\\\\");
    };

    const buildTreeString = (nodeId: string, edgeToThisNode?: any): string => {
      const node = nodesMap.get(nodeId);
      if (!node) return "";
      
      const isVisible = treeData.nodes.findIndex(n => n.id === nodeId) < visibleSteps;
      if (!isVisible) return "";

      // We don't wrap the entire label in $...$ anymore, because formatLatexLabel does it per-predicate.
      // This allows LaTeX's text width and centering algorithms to break lines between predicates!
      const label = formatLatexLabel(node.goals);
      let options: string[] = [];

      // Removed colors entirely for LaTeX export, keep standard styling
      // If needed, specific styling can be added back, but unified look is preferred.

      if (edgeToThisNode) {
        const edgeLabel = edgeToThisNode.label || "";
        const displayEdgeLabel = edgeLabel === "{}" ? "\\{\\}" : edgeLabel.replace(/{/g, "\\{").replace(/}/g, "\\}").replace(/_/g, '\\_');
        if (displayEdgeLabel) {
          options.push(`edge label={node[midway, right, font=\\scriptsize, fill=white, inner sep=2pt]{$${displayEdgeLabel}$}}`);
        }
      }

      const optionsStr = options.length > 0 ? `, ${options.join(', ')}` : '';
      
      // Enclose label in {} so that commas in goals do not break forest options parser!
      let result = `[{${label}}${optionsStr}`;

      const children = childrenMap.get(nodeId) || [];
      const visibleChildren = children.filter(c => treeData.nodes.findIndex(n => n.id === c.id) < visibleSteps);

      // We no longer sort by X coordinate because dagre's internal X coordinate 
      // might be right-to-left. Instead, we use the original order from treeData (DFS/BFS generation order), 
      // which exactly matches the 1-to-1 top-down and left-to-right table order.
      visibleChildren.sort((a, b) => {
        const idxA = treeData.nodes.findIndex(n => n.id === a.id);
        const idxB = treeData.nodes.findIndex(n => n.id === b.id);
        return idxA - idxB;
      });

      visibleChildren.forEach(child => {
        const edge = edgesMap.get(`${nodeId}->${child.id}`);
        const childStr = buildTreeString(child.id, edge);
        if (childStr) {
          result += `\n  ${childStr.split('\n').join('\n  ')}`;
        }
      });

      result += `]`;
      return result;
    };

    const treeLatex = buildTreeString(root.id);

    const latex = `\\documentclass{article}
\\usepackage{xcolor}
\\usepackage{forest}
\\usepackage{amssymb}
\\usepackage[a4paper, margin=1cm]{geometry}

\\begin{document}

\\begin{center}
\\begin{forest}
  for tree={
    font=\\sffamily\\small,
    child anchor=north,
    parent anchor=south,
    align=center,
    text centered,
    text width=3.5cm,
    minimum height=0.8cm,
    inner sep=4pt,
    edge={->, thick},
    l sep=12mm,
    s sep=15mm,
    draw,
    rounded corners,
    fill=white
  }
${treeLatex}
\\end{forest}
\\end{center}

\\end{document}`;

    navigator.clipboard.writeText(latex);
  };

  useEffect(() => {
    if (!treeData || treeData.nodes.length === 0) return;

    const initialNodes: Node[] = treeData.nodes.map((node, index) => {
      let goalsText = "";
      if (node.goals.length === 0) {
        goalsText = "□";
      } else {
        goalsText = node.goals.map(g => predicateToString(g)).join(', ');
      }
        
      let bg = '#ffffff';
      let border = '#d1d5db';
      let color = '#111827';
      
      if (node.status === "success") {
        bg = '#dcfce7';
        border = '#22c55e';
        color = '#14532d'; // Dark green text in the tree
      } else if (node.status === "failure") {
        bg = '#fee2e2';
        border = '#ef4444';
        color = '#7f1d1d';
      }

      return {
        id: node.id,
        data: { 
          label: goalsText,
          bg,
          border,
          color,
          step: index + 1,
          isHighlighted: node.id === highlightedNodeId
        },
        position: { x: 0, y: 0 },
        type: "sldNode",
      };
    });

    const initialEdges: Edge[] = treeData.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: 'smoothstep',
      labelStyle: { fill: '#374151', fontWeight: 500 },
      labelBgStyle: { fill: '#f3f4f6', stroke: '#d1d5db' },
      animated: true,
      style: {
        stroke: (edge.source === highlightedNodeId || edge.target === highlightedNodeId) ? '#3b82f6' : '#b1b1b7',
        strokeWidth: (edge.source === highlightedNodeId || edge.target === highlightedNodeId) ? 3 : 1,
      },
    }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    const currentNodesData = treeData.nodes.slice(0, visibleSteps);
    const visibleNodeIds = new Set(currentNodesData.map(n => n.id));

    const visibleNodes = layoutedNodes.filter(n => visibleNodeIds.has(n.id));
    const visibleEdges = layoutedEdges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));

    setNodes(visibleNodes);
    setEdges(visibleEdges);
  }, [treeData, visibleSteps, setNodes, setEdges, t, highlightedNodeId]);

  useEffect(() => {
    // Vždy po zmene kroku počkáme kým sa vykreslí dom a vycentrujeme pohľad
    const timeout = setTimeout(() => {
      fitView({ duration: 400, padding: 0.2 });
    }, 50);
    return () => clearTimeout(timeout);
  }, [visibleSteps, fitView]);

  return (
    <div className="flex flex-col w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Stepper bar inside the container header */}
      {treeData.nodes.length > 0 && (
        <div className="flex justify-between items-center bg-white p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg text-gray-700">{t("sld_tree")}</h3>
            <button 
              onClick={copyTreeToLatex}
              className="p-2 ml-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Copy Tree to LaTeX"
            >
              <FaCopy className="w-5 h-5" />
            </button>
          </div>
          <div className="flex justify-center items-center">
            <SearchStrategySwitcher
              strategy={strategy}
              setStrategy={onStrategyChange}
            />
          </div>
          <div className="flex items-center gap-4">
            <button 
              className="px-5 py-1.5 min-w-[120px] bg-gray-100 text-gray-600 rounded-md border border-gray-200 hover:bg-gray-200 hover:text-gray-800 font-bold disabled:opacity-50 transition-all text-sm"
              disabled={visibleSteps <= 1}
              onClick={() => setVisibleSteps(v => Math.max(1, v - 1))}
            >
              {t("stepper.prev")}
            </button>
            <span className="text-sm font-semibold whitespace-nowrap min-w-[90px] text-center text-gray-700">
              {t("stepper.step")} {visibleSteps} / {treeData.nodes.length}
            </span>
            <button 
              className="px-5 py-1.5 min-w-[120px] bg-blue-600 text-white rounded-md border border-blue-600 shadow-sm hover:bg-blue-700 hover:border-blue-700 font-bold disabled:opacity-50 transition-all text-sm"
              disabled={visibleSteps >= treeData.nodes.length}
              onClick={() => setVisibleSteps(v => Math.min(treeData.nodes.length, v + 1))}
            >
              {t("stepper.next")}
            </button>
            <div className="w-[1px] h-8 bg-gray-300 mx-1"></div>
            <button 
              className="px-5 py-1.5 min-w-[140px] bg-green-600 text-white rounded-md border border-green-600 shadow-md hover:shadow-lg hover:bg-green-700 hover:border-green-700 font-bold transition-all text-sm"
              onClick={() => setVisibleSteps(treeData.nodes.length)}
            >
              {t("stepper.show_all")}
            </button>
          </div>
        </div>
      )}

      <div className="w-full h-[700px] relative bg-white">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => onNodeClick && onNodeClick(node.id)}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={!isLocked}
          zoomOnScroll={!isLocked}
          zoomOnPinch={!isLocked}
          zoomOnDoubleClick={!isLocked}
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
};

export const SLDTree = ({ treeData, visibleSteps, setVisibleSteps, highlightedNodeId, onNodeClick, strategy, onStrategyChange }: SLDTreeProps) => {
  return (
    <ReactFlowProvider>
      <SLDTreeContent 
        treeData={treeData} 
        visibleSteps={visibleSteps} 
        setVisibleSteps={setVisibleSteps} 
        highlightedNodeId={highlightedNodeId}
        onNodeClick={onNodeClick} 
        strategy={strategy}
        onStrategyChange={onStrategyChange}
      />
    </ReactFlowProvider>
  );
};
