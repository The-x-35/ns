'use client';

import { useState, useEffect } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  allNodes: Array<{ id: string; ensName: string }>;
  onAddConnection: (targetId: string) => void;
  onClose: () => void;
}

export default function ContextMenu({
  x,
  y,
  nodeId,
  allNodes,
  onAddConnection,
  onClose,
}: ContextMenuProps) {
  const [showTargetSelect, setShowTargetSelect] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Filter nodes excluding the source node
  const availableNodes = allNodes.filter(
    (node) => node.id !== nodeId && node.ensName.includes(searchTerm.toLowerCase())
  );

  if (!showTargetSelect) {
    return (
      <div
        className="fixed z-50 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
        style={{ left: x, top: y }}
      >
        <button
          onClick={() => setShowTargetSelect(true)}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Add Connection
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed z-50 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800"
      style={{ left: x, top: y }}
    >
      <div className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
        Connect to:
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search ENS name..."
        className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        autoFocus
      />
      <div className="max-h-48 overflow-y-auto">
        {availableNodes.length === 0 ? (
          <div className="py-2 text-center text-sm text-gray-500">No nodes available</div>
        ) : (
          availableNodes.map((node) => (
            <button
              key={node.id}
              onClick={() => {
                onAddConnection(node.id);
                onClose();
              }}
              className="w-full rounded px-2 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {node.ensName}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

