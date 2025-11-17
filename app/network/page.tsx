'use client';

import { useState } from 'react';
import Link from 'next/link';
import { buildNetworkGraph, updateFriendRelationships, NetworkGraph } from '@/lib/connections';
import NetworkGraphComponent from './components/NetworkGraph';
import LiquidEther from '@/components/LiquidEther';

export default function NetworkPage() {
  const [input, setInput] = useState('');
  const [graph, setGraph] = useState<NetworkGraph | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exampleNames = ['vitalik.eth', 'nick.eth', 'brantly.eth', 'balajis.eth'];
  const exampleInput = exampleNames.join(', ');

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
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Liquid Ether Background */}
      <div className="absolute inset-0 z-0">
        <LiquidEther
          colors={["#42d392", "#34c78e", "#2cb883", "#27a37b"]}
          mouseForce={40}
          cursorSize={150}
        />
      </div>
      <div className="mx-auto max-w-7xl px-6 py-12 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
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
              <h1 className="text-4xl font-bold text-white">
                ENS Network Graph
              </h1>
              <p className="mt-1 text-lg text-white/80">
                Visualize social and on-chain connections between ENS names
              </p>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="mb-8 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-6 shadow-lg">
          <div className="mb-4">
            <label className="text-lg font-semibold text-white">
              Enter ENS Name Pairs
            </label>
          </div>
          
          <p className="mb-3 text-sm text-white/80">
            Format: Comma-separated ENS names. The app will analyze connections between all of them.
          </p>

          {/* Example Button */}
          <div className="mb-4">
            <button
              onClick={loadExample}
              className="rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              Try Example
            </button>
          </div>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="vitalik.eth, nick.eth, brantly.eth, balajis.eth"
            className="h-32 w-full rounded-lg border-2 border-white/20 bg-white/10 backdrop-blur-md px-4 py-3 text-white placeholder-white/60 transition-all focus:border-white/40 focus:outline-none focus:ring-4 focus:ring-white/20"
          />
          
          <button
            onClick={handleAnalyze}
            disabled={loading || !input.trim()}
            className="mt-4 w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            {loading ? 'Analyzing...' : 'Analyze Network'}
          </button>
          
          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 backdrop-blur-sm p-4 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-12 text-center shadow-lg">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-blue-400"></div>
            <p className="text-lg text-white/80">
              Analyzing connections...
            </p>
          </div>
        )}

        {/* Graph Visualization */}
        {graph && !loading && (
          <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-6 shadow-lg">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  Network Visualization
                </h2>
                <div className="text-sm text-white/80">
                  {graph.nodes.length} nodes • {graph.connections.length} connections
                </div>
              </div>
              
              {/* Show connection details */}
              {graph.connections.length > 0 && (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer text-white/80 hover:text-white">
                    View connection details
                  </summary>
                  <div className="mt-2 space-y-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-3">
                    {graph.connections.map((conn, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="text-xs">
                          <span className="font-semibold text-white">{conn.from}</span> ↔{' '}
                          <span className="font-semibold text-white">{conn.to}</span>:{' '}
                          <span className="text-white/70">
                            {conn.details.length > 0 ? conn.details.join(', ') : 'No details'}
                          </span>
                        </div>
                        {conn.transfers && conn.transfers.length > 0 && (
                          <div className="ml-4 space-y-1">
                            <div className="text-xs font-semibold text-white/80">
                              Transactions:
                            </div>
                            {conn.transfers.map((transfer, tidx) => (
                              <a
                                key={tidx}
                                href={`https://etherscan.io/tx/${transfer.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs text-blue-300 hover:text-blue-200 hover:underline"
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
                <span className="text-white/80">On-Chain Connection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border-2 border-dashed border-blue-500 bg-transparent"></div>
                <span className="text-white/80">Social Connection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border-2 border-dashed border-orange-500 bg-transparent"></div>
                <span className="text-white/80">Friend Relationship</span>
              </div>
            </div>
            
            <NetworkGraphComponent graph={graph} onRefresh={refreshGraph} />
          </div>
        )}

      </div>
    </div>
  );
}

