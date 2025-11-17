'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NetworkGraph, Connection } from '@/lib/connections';

interface NetworkGraphProps {
  graph: NetworkGraph;
}

// Custom node component with avatar
interface ENSNodeData {
  label: string;
  avatar?: string;
  address: string;
}

function ENSNode({ data }: { data: ENSNodeData }) {
  return (
    <div className="group cursor-pointer">
      {/* Handles for connecting edges */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      
      <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-gray-300 bg-white p-3 shadow-lg transition-all hover:border-blue-500 hover:shadow-xl dark:border-gray-600 dark:bg-gray-800">
        {data.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.avatar}
            alt={data.label}
            className="h-12 w-12 rounded-full border-2 border-blue-100 object-cover dark:border-blue-900"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue-100 bg-linear-to-br from-blue-400 to-purple-500 text-xl font-bold text-white dark:border-blue-900">
            {data.label[0].toUpperCase()}
          </div>
        )}
        <div className="max-w-[120px] truncate text-center text-sm font-semibold text-gray-900 dark:text-white">
          {data.label}
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  ensNode: ENSNode,
};

export default function NetworkGraphComponent({ graph }: NetworkGraphProps) {
  const router = useRouter();
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);

  // Convert network graph to ReactFlow format
  const initialNodes: Node[] = useMemo(() => {
    console.log('Creating nodes from:', graph.nodes);
    return graph.nodes.map((node, index) => {
      // Calculate position in a circular layout
      const angle = (index / graph.nodes.length) * 2 * Math.PI;
      const radius = Math.max(200, graph.nodes.length * 30);
      
      const reactNode = {
        id: node.id.toLowerCase(), // Ensure lowercase
        type: 'ensNode',
        position: {
          x: Math.cos(angle) * radius + 400,
          y: Math.sin(angle) * radius + 300,
        },
        data: {
          label: node.ensName,
          avatar: node.avatar,
          address: node.address,
        },
      };
      console.log('Created node:', reactNode.id);
      return reactNode;
    });
  }, [graph.nodes]);

  const initialEdges: Edge[] = useMemo(() => {
    console.log('Creating edges from:', graph.connections);
    return graph.connections.map((conn, index) => {
      // Determine edge color based on connection type
      let color = '#3B82F6'; // blue for social
      if (conn.type === 'onchain') {
        color = '#10B981'; // green
      } else if (conn.type === 'mutual') {
        color = '#A855F7'; // purple
      } else if (conn.type === 'none') {
        color = '#9CA3AF'; // gray for no connection
      }

      const edge = {
        id: `edge-${index}`,
        source: conn.from.toLowerCase(), // Ensure lowercase
        target: conn.to.toLowerCase(), // Ensure lowercase
        type: 'straight',
        animated: conn.strength > 0.5,
        style: {
          stroke: color,
          strokeWidth: Math.max(2, conn.strength * 6),
        },
        label: conn.details.join(', '),
        labelStyle: {
          fontSize: 11,
          fill: '#1f2937',
          fontWeight: 500,
        },
        labelBgStyle: {
          fill: 'white',
          fillOpacity: 0.9,
        },
        labelBgPadding: [8, 4] as [number, number],
        labelBgBorderRadius: 4,
      };
      console.log('Created edge:', edge.source, '->', edge.target);
      return edge;
    });
  }, [graph.connections]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Debug logging
  console.log('=== DEBUG INFO ===');
  console.log('Graph nodes:', nodes.map(n => ({ id: n.id, label: n.data.label })));
  console.log('Graph edges:', edges.map(e => ({ id: e.id, source: e.source, target: e.target })));
  console.log('Raw connections:', graph.connections);
  console.log('Node IDs:', nodes.map(n => n.id));
  console.log('Edge sources/targets:', edges.map(e => `${e.source} -> ${e.target}`));
  
  // Check for ID mismatches
  edges.forEach(edge => {
    const sourceExists = nodes.some(n => n.id === edge.source);
    const targetExists = nodes.some(n => n.id === edge.target);
    if (!sourceExists) console.error(`Source node "${edge.source}" not found!`);
    if (!targetExists) console.error(`Target node "${edge.target}" not found!`);
  });

  // Handle node click - navigate to profile
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      router.push(`/profile/${node.data.label}`);
    },
    [router]
  );

  // Handle edge click - show connection details
  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      const connection = graph.connections.find(
        (c) => c.from === edge.source && c.to === edge.target
      );
      if (connection) {
        setSelectedConnection(connection);
      }
    },
    [graph.connections]
  );

  return (
    <>
      <div className="h-[600px] w-full rounded-lg border-2 border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          attributionPosition="bottom-left"
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            style: { strokeWidth: 2, stroke: '#3B82F6' },
          }}
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor={() => '#3B82F6'}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      {/* Connection Details Modal */}
      {selectedConnection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedConnection(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Connection Details
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">{selectedConnection.from}</span> ↔{' '}
                  <span className="font-semibold">{selectedConnection.to}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedConnection(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {/* Connection Type Badge */}
            <div className="mb-4">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                  selectedConnection.type === 'onchain'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : selectedConnection.type === 'mutual'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    : selectedConnection.type === 'social'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {selectedConnection.type === 'onchain'
                  ? 'On-Chain Connection'
                  : selectedConnection.type === 'mutual'
                  ? 'Social + On-Chain'
                  : selectedConnection.type === 'social'
                  ? 'Social Connection'
                  : 'No Connection Found'}
              </span>
            </div>

            {/* Details */}
            <div className="mb-4">
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                Summary
              </h3>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {selectedConnection.details.map((detail, idx) => (
                  <li key={idx}>• {detail}</li>
                ))}
              </ul>
            </div>

            {/* Transactions */}
            {selectedConnection.transfers && selectedConnection.transfers.length > 0 && (
              <div>
                <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                  Transactions ({selectedConnection.transfers.length})
                </h3>
                <div className="space-y-2">
                  {selectedConnection.transfers.map((transfer, idx) => (
                    <a
                      key={idx}
                      href={`https://etherscan.io/tx/${transfer.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-sm text-gray-900 dark:text-white">
                            {transfer.hash.slice(0, 16)}...{transfer.hash.slice(-14)}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{transfer.from.slice(0, 6)}...{transfer.from.slice(-4)}</span>
                            <span>→</span>
                            <span>{transfer.to.slice(0, 6)}...{transfer.to.slice(-4)}</span>
                            {transfer.value && transfer.asset && (
                              <>
                                <span>•</span>
                                <span className="font-semibold">{transfer.asset}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="ml-3 text-blue-600 dark:text-blue-400">
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => setSelectedConnection(null)}
              className="mt-6 w-full rounded-lg bg-gray-100 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

