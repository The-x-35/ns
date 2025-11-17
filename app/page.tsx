'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import LiquidEther from '@/components/LiquidEther';

export default function Home() {
  const [ensName, setEnsName] = useState('');
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (ensName.trim()) {
      router.push(`/profile/${encodeURIComponent(ensName.trim())}`);
    }
  };

  const exampleNames = ['vitalik.eth', 'nick.eth', 'brantly.eth', 'balajis.eth'];

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
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24 relative z-10">
        <div className="w-full max-w-2xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              ENS Profile Viewer
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Discover Ethereum Name Service profiles on the blockchain
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={ensName}
                onChange={(e) => setEnsName(e.target.value)}
                placeholder="Enter ENS name (e.g., vitalik.eth)"
                className="w-full rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-md px-6 py-4 text-lg text-white placeholder-white/60 transition-all focus:border-white/40 focus:outline-none focus:ring-4 focus:ring-white/20 dark:border-white/20 dark:bg-white/10 dark:text-white dark:placeholder-white/60 dark:focus:border-white/40"
              />
            </div>
            <button
              type="submit"
              disabled={!ensName.trim()}
              className="w-full rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
            >
              View Profile
            </button>
          </form>

          {/* Example Names */}
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Try these examples:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {exampleNames.map((name) => (
                <button
                  key={name}
                  onClick={() => router.push(`/profile/${name}`)}
                  className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Network Graph CTA */}
          <div className="mt-12 text-center">
            <button
              onClick={() => router.push('/network')}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-blue-600 bg-white px-6 py-3 font-semibold text-blue-600 shadow-lg transition-all hover:bg-blue-50 dark:border-blue-400 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700"
            >
              <span className="text-xl">🕸️</span>
              Explore Network Graph
            </button>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Visualize connections between ENS names
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
