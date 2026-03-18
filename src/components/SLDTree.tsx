import { useEffect } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  Panel,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";

interface SLDTreeProps {
  goals: string[][];
}

const nodeWidth = 200;
const nodeHeight = 50;

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

export const SLDTree = ({ goals }: SLDTreeProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    // For now, we only render the initial goal as the root node
    const initialNodes = goals.map((clause, idx) => ({
      id: `root-${idx}`,
      data: { 
        label: `?- ${clause.map(lit => lit.replace(/^¬/, '')).join(', ')}` 
      },
      position: { x: 0, y: 0 },
      type: "input",
      style: { 
        background: '#fee2e2', 
        border: '1px solid #ef4444',
        borderRadius: '8px',
        padding: '10px',
        fontWeight: 'bold',
        color: '#7f1d1d'
      }
    }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      []
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [goals, setNodes, setEdges]);

  return (
    <div className="w-full h-[400px] border border-gray-200 rounded-lg overflow-hidden bg-white mt-6">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background />
        <Controls />
        <Panel position="top-left" className="bg-white p-2 rounded shadow-md text-sm font-semibold">
          SLD Resolution Tree
        </Panel>
      </ReactFlow>
      <style>{`
        .react-flow__handle {
          display: none !important;
        }
      `}</style>
    </div>
  );
};
