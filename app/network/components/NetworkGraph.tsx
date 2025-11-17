'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
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
import ContextMenu from './ContextMenu';
import Toast from './Toast';

interface NetworkGraphProps {
  graph: NetworkGraph;
  onRefresh?: () => Promise<void>;
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
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-green-100 bg-green-500 text-xl font-bold text-white dark:border-green-900">
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

export default function NetworkGraphComponent({ graph, onRefresh }: NetworkGraphProps) {
  const router = useRouter();
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<number | null>(null);

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
        style: selectedNode === node.id.toLowerCase() ? {
          border: '3px solid #f97316',
          boxShadow: '0 0 20px rgba(249, 115, 22, 0.5)',
        } : undefined,
      };
      console.log('Created node:', reactNode.id);
      return reactNode;
    });
  }, [graph.nodes, selectedNode]);

  const initialEdges: Edge[] = useMemo(() => {
    console.log('Creating edges from:', graph.connections);
    return graph.connections.map((conn, index) => {
      // Determine edge color and style based on connection type and source
      let color = '#9CA3AF'; // gray for none
      let strokeWidth = 2;
      let strokeDasharray = undefined;
      
      // If friend relationship, use orange and make it distinctive
      if (conn.source === 'friend') {
        color = '#F97316'; // orange
        strokeWidth = 3;
        strokeDasharray = '5 5'; // dashed line
      } else if (conn.type === 'onchain') {
        color = '#10B981'; // green (prioritize on-chain - most verifiable)
        strokeWidth = 3;
      } else if (conn.type === 'social') {
        color = '#3B82F6'; // blue
        strokeWidth = 2;
      }

      const edge = {
        id: `edge-${index}`,
        source: conn.from.toLowerCase(), // Ensure lowercase
        target: conn.to.toLowerCase(), // Ensure lowercase
        type: 'straight',
        animated: conn.source !== 'friend',
        style: {
          stroke: color,
          strokeWidth,
          strokeDasharray,
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

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when graph changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

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

  // Show toast notification
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true });
  }, []);

  // Handle adding a connection
  const handleAddConnection = useCallback(
    async (sourceId: string, targetId: string) => {
      try {
        const response = await fetch('/api/connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ens_name_1: sourceId,
            ens_name_2: targetId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          showToast(error.error || 'Failed to add connection', 'error');
          return;
        }

        // Refresh the graph data
        showToast('Friend relationship added successfully!', 'success');
        if (onRefresh) {
          await onRefresh();
        }
      } catch (error) {
        console.error('Error adding connection:', error);
        showToast('Failed to add connection', 'error');
      }
    },
    [onRefresh, showToast]
  );

  // Handle node click - navigate to profile or select for connection
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (editMode) {
        // In edit mode, select nodes to connect
        if (!selectedNode) {
          setSelectedNode(node.id);
        } else if (selectedNode !== node.id) {
          // Connect the two nodes
          handleAddConnection(selectedNode, node.id);
          setSelectedNode(null);
        }
      } else {
        // In normal mode, navigate to profile
        router.push(`/profile/${node.data.label}`);
      }
    },
    [editMode, selectedNode, router, handleAddConnection]
  );

  // Handle node right-click
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      if (editMode) {
        setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
      }
    },
    [editMode]
  );

  // Handle delete confirmation
  const handleDeleteClick = useCallback((connectionId: number) => {
    setConnectionToDelete(connectionId);
    setShowDeleteConfirm(true);
  }, []);

  // Handle deleting a connection
  const handleDeleteConnection = useCallback(
    async (connectionId: number) => {
      try {
        const response = await fetch(`/api/connections/${connectionId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          showToast(error.error || 'Failed to delete connection', 'error');
          return;
        }

        // Close modal and refresh the graph
        setSelectedConnection(null);
        setShowDeleteConfirm(false);
        setConnectionToDelete(null);
        showToast('Friend relationship deleted successfully!', 'success');
        if (onRefresh) {
          await onRefresh();
        }
      } catch (error) {
        console.error('Error deleting connection:', error);
        showToast('Failed to delete connection', 'error');
      }
    },
    [onRefresh, showToast]
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
      {/* Edit Mode Controls */}
      <div className="mb-4 flex items-center justify-between rounded-lg p-4 shadow">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditMode(!editMode);
              setSelectedNode(null);
            }}
            className={`rounded-lg px-4 py-2 font-semibold transition-colors ${
              editMode
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'border'
            }`}
          >
            {editMode ? '✓ Edit Mode Active' : 'Enable Edit Mode'}
          </button>
          {editMode && (
            <span className="text-sm text-white/80">
              {selectedNode ? 'Click another node to connect' : 'Click a node to start, or right-click to add connection'}
            </span>
          )}
        </div>
        {editMode && selectedNode && (
          <button
            onClick={() => setSelectedNode(null)}
            className="text-sm text-white/80 hover:text-white"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="h-[600px] w-full rounded-lg border-2 border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeClick={onEdgeClick}
          onPaneClick={() => {
            setContextMenu(null);
            if (editMode) setSelectedNode(null);
          }}
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

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            nodeId={contextMenu.nodeId}
            allNodes={graph.nodes.map(n => ({ id: n.id, ensName: n.ensName }))}
            onAddConnection={(targetId) => {
              handleAddConnection(contextMenu.nodeId, targetId);
              setContextMenu(null);
            }}
            onClose={() => setContextMenu(null)}
          />
        </>
      )}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setShowDeleteConfirm(false);
            setConnectionToDelete(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
              Delete Friend Relationship?
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this friend relationship? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setConnectionToDelete(null);
                }}
                className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (connectionToDelete) {
                    handleDeleteConnection(connectionToDelete);
                  }
                }}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
                {selectedConnection.source === 'friend' && (
                  <span className="mt-2 inline-block rounded bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    Friend Relationship
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {selectedConnection.source === 'friend' && selectedConnection.id && (
                  <button
                    onClick={() => handleDeleteClick(selectedConnection.id!)}
                    className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={() => setSelectedConnection(null)}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Connection Type Badge */}
            <div className="mb-4">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                  selectedConnection.type === 'onchain'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}
              >
                {selectedConnection.type === 'onchain'
                  ? 'On-Chain Connection'
                  : 'Social Connection'}
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

