import { useEffect } from "react";
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

interface SLDTreeProps {
  treeData: SLDTreeData;
  visibleSteps: number;
  setVisibleSteps: React.Dispatch<React.SetStateAction<number>>;
  highlightedNodeId?: string | null;
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
      
      {/* Node order badge */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "-10px",
          transform: "translateY(-50%)",
          background: "#e5e7eb",
          border: "1px solid #9ca3af",
          color: "#374151",
          borderRadius: "50%",
          width: "18px",
          height: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "9px",
          fontWeight: "bold",
          zIndex: 10,
        }}
      >
        {data.step}
      </div>

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

const SLDTreeContent = ({ treeData, visibleSteps, setVisibleSteps, highlightedNodeId }: SLDTreeProps) => {
  const { t } = useLanguage();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const isLocked = false; // Povolené približovanie a posúvanie
  const { fitView } = useReactFlow();

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
        <div className="flex justify-between items-center bg-white p-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-700">{t("sld_tree")}</h3>
          <div className="flex items-center gap-3">
            <button 
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm font-medium disabled:opacity-50 transition-colors shadow-sm"
              disabled={visibleSteps <= 1}
              onClick={() => setVisibleSteps(v => Math.max(1, v - 1))}
            >
              {t("stepper.prev")}
            </button>
            <span className="text-sm font-semibold whitespace-nowrap min-w-[80px] text-center text-gray-700">
              {t("stepper.step")} {visibleSteps} / {treeData.nodes.length}
            </span>
            <button 
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium disabled:opacity-50 transition-colors shadow-sm"
              disabled={visibleSteps >= treeData.nodes.length}
              onClick={() => setVisibleSteps(v => Math.min(treeData.nodes.length, v + 1))}
            >
              {t("stepper.next")}
            </button>
            <div className="w-[1px] h-6 bg-gray-300 mx-1"></div>
            <button 
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium transition-colors shadow-sm"
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

export const SLDTree = ({ treeData, visibleSteps, setVisibleSteps, highlightedNodeId }: SLDTreeProps) => {
  return (
    <ReactFlowProvider>
      <SLDTreeContent treeData={treeData} visibleSteps={visibleSteps} setVisibleSteps={setVisibleSteps} highlightedNodeId={highlightedNodeId} />
    </ReactFlowProvider>
  );
};
