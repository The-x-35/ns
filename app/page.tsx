'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [ensName, setEnsName] = useState('');
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (ensName.trim()) {
      router.push(`/profile/${encodeURIComponent(ensName.trim())}`);
    }
  };

  const exampleNames = ['vitalik.eth', 'nick.eth', 'brantly.eth'];

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-black dark:to-purple-950">
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
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
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-6 py-4 text-lg text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-blue-400"
              />
            </div>
            <button
              type="submit"
              disabled={!ensName.trim()}
              className="w-full rounded-xl bg-linear-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-blue-600 disabled:hover:to-purple-600"
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

          {/* Features */}
          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg bg-white/50 p-6 text-center backdrop-blur-sm dark:bg-gray-800/50">
              <div className="mb-3 text-3xl">🔍</div>
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                Search
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Look up any ENS name by searching or URL
              </p>
            </div>
            <div className="rounded-lg bg-white/50 p-6 text-center backdrop-blur-sm dark:bg-gray-800/50">
              <div className="mb-3 text-3xl">⛓️</div>
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                On-Chain
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All data fetched directly from Ethereum
              </p>
            </div>
            <div className="rounded-lg bg-white/50 p-6 text-center backdrop-blur-sm dark:bg-gray-800/50">
              <div className="mb-3 text-3xl">📋</div>
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                Complete
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View all populated profile fields
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
