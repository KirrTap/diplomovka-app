import { useEffect, useState } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  Panel,
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
}

const nodeWidth = 200;
const nodeHeight = 50;

interface SLDNodeData {
  bg: string;
  border: string;
  color: string;
  step: number;
  label: string;
}

const CustomSLDNode = ({ data }: { data: SLDNodeData }) => {
  return (
    <div
      style={{
        background: data.bg,
        border: `2px solid ${data.border}`,
        borderRadius: "8px",
        padding: "10px",
        fontWeight: "bold",
        color: data.color,
        width: nodeWidth,
        position: "relative",
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

const SLDTreeContent = ({ treeData }: SLDTreeProps) => {
  const { t } = useLanguage();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [visibleSteps, setVisibleSteps] = useState<number>(1);
  const isLocked = false; // Povolené približovanie a posúvanie
  const { fitView } = useReactFlow();

  useEffect(() => {
    // Reset steps to 1 whenever new tree data comes in
    setVisibleSteps(1);
  }, [treeData]);

  useEffect(() => {
    if (!treeData || treeData.nodes.length === 0) return;

    const initialNodes: Node[] = treeData.nodes.map((node, index) => {
      const goalsText = node.goals.length === 0 
        ? "□ (Success)" 
        : node.goals.map(g => predicateToString(g)).join(', ');
        
      let bg = '#ffffff';
      let border = '#d1d5db';
      let color = '#111827';
      
      if (node.status === "success") {
        bg = '#dcfce7';
        border = '#22c55e';
        color = '#14532d';
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
          step: index + 1
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
  }, [treeData, visibleSteps, setNodes, setEdges]);

  useEffect(() => {
    // Vždy po zmene kroku počkáme kým sa vykreslí dom a vycentrujeme pohľad
    const timeout = setTimeout(() => {
      fitView({ duration: 400, padding: 0.2 });
    }, 50);
    return () => clearTimeout(timeout);
  }, [visibleSteps, fitView]);

  return (
    <div className="w-full h-[700px] border border-gray-200 rounded-lg overflow-hidden bg-white mt-6 relative">
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
        
        <Panel position="top-left" className="bg-white p-2 rounded shadow-md text-sm font-semibold">
          {t("sld_resolution_tree")}
        </Panel>

        {treeData.nodes.length > 0 && (
          <Panel position="top-right" className="bg-white p-2 rounded shadow-md flex items-center gap-3">
            <button 
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium disabled:opacity-50 transition-colors"
              disabled={visibleSteps <= 1}
              onClick={() => setVisibleSteps(v => Math.max(1, v - 1))}
            >
              {t("stepper.prev")}
            </button>
            <span className="text-sm font-semibold whitespace-nowrap min-w-[80px] text-center">
              {t("stepper.step")} {visibleSteps} / {treeData.nodes.length}
            </span>
            <button 
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium disabled:opacity-50 transition-colors"
              disabled={visibleSteps >= treeData.nodes.length}
              onClick={() => setVisibleSteps(v => Math.min(treeData.nodes.length, v + 1))}
            >
              {t("stepper.next")}
            </button>
            <div className="w-[1px] h-6 bg-gray-300 mx-1"></div>
            <button 
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium transition-colors"
              onClick={() => setVisibleSteps(treeData.nodes.length)}
            >
              {t("stepper.show_all")}
            </button>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

export const SLDTree = ({ treeData }: SLDTreeProps) => {
  return (
    <ReactFlowProvider>
      <SLDTreeContent treeData={treeData} />
    </ReactFlowProvider>
  );
};
