'use client';

import { useState } from 'react';
import Link from 'next/link';
import { buildNetworkGraph, updateFriendRelationships, NetworkGraph } from '@/lib/connections';
import NetworkGraphComponent from './components/NetworkGraph';

export default function NetworkPage() {
  const [input, setInput] = useState('');
  const [graph, setGraph] = useState<NetworkGraph | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exampleInput = `vitalik.eth, nick.eth, brantly.eth, balajis.eth`;

  const handleAnalyze = async () => {
    if (!input.trim()) {
      setError('Please enter ENS names');
      return;
    }

    setLoading(true);
    setError(null);
    setGraph(null);

    try {
      const networkGraph = await buildNetworkGraph(input);
      setGraph(networkGraph);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze network');
    } finally {
      setLoading(false);
    }
  };

  // Refresh graph data without losing input - only updates friend relationships, doesn't re-analyze on-chain
  const refreshGraph = async () => {
    if (!graph) return;
    
    try {
      setLoading(true);
      // Only update friend relationships, keep existing on-chain analysis
      const updatedGraph = await updateFriendRelationships(graph);
      setGraph(updatedGraph);
    } catch (err) {
      console.error('Failed to refresh graph:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh graph');
    } finally {
      setLoading(false);
    }
  };

  const loadExample = () => {
    setInput(exampleInput);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-black dark:to-purple-950">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ← Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="ENS Logo"
              className="h-12 w-12"
            />
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                ENS Network Graph
              </h1>
              <p className="mt-1 text-lg text-gray-600 dark:text-gray-300">
                Visualize social and on-chain connections between ENS names
              </p>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <label className="text-lg font-semibold text-gray-900 dark:text-white">
              Enter ENS Name Pairs
            </label>
            <button
              onClick={loadExample}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Load Example
            </button>
          </div>
          
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            Format: Comma-separated ENS names. The app will analyze connections between all of them.
          </p>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="vitalik.eth, nick.eth, brantly.eth, fireEyes.eth"
            className="h-32 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
          />
          
          <button
            onClick={handleAnalyze}
            disabled={loading || !input.trim()}
            className="mt-4 w-full rounded-lg bg-linear-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Network'}
          </button>
          
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-xl bg-white p-12 text-center shadow-lg dark:bg-gray-800">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400"></div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Analyzing connections...
            </p>
          </div>
        )}

        {/* Graph Visualization */}
        {graph && !loading && (
          <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Network Visualization
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {graph.nodes.length} nodes • {graph.connections.length} connections
                </div>
              </div>
              
              {/* Show connection details */}
              {graph.connections.length > 0 && (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    View connection details
                  </summary>
                  <div className="mt-2 space-y-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                    {graph.connections.map((conn, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="text-xs">
                          <span className="font-semibold">{conn.from}</span> ↔{' '}
                          <span className="font-semibold">{conn.to}</span>:{' '}
                          <span className="text-gray-600 dark:text-gray-400">
                            {conn.details.length > 0 ? conn.details.join(', ') : 'No details'}
                          </span>
                        </div>
                        {conn.transfers && conn.transfers.length > 0 && (
                          <div className="ml-4 space-y-1">
                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              Transactions:
                            </div>
                            {conn.transfers.map((transfer, tidx) => (
                              <a
                                key={tidx}
                                href={`https://etherscan.io/tx/${transfer.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs text-blue-600 hover:underline dark:text-blue-400"
                              >
                                {transfer.hash.slice(0, 10)}...{transfer.hash.slice(-8)} 
                                {transfer.value && ` (${transfer.asset})`}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
            
            {/* Legend */}
            <div className="mb-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border-2 border-dashed border-green-500 bg-transparent"></div>
                <span className="text-gray-700 dark:text-gray-300">On-Chain Connection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border-2 border-dashed border-blue-500 bg-transparent"></div>
                <span className="text-gray-700 dark:text-gray-300">Social Connection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border-2 border-dashed border-orange-500 bg-transparent"></div>
                <span className="text-gray-700 dark:text-gray-300">Friend Relationship</span>
              </div>
            </div>
            
            <NetworkGraphComponent graph={graph} onRefresh={refreshGraph} />
          </div>
        )}

      </div>
    </div>
  );
}

