'use client';

import Link from 'next/link';
import LiquidEther from '@/components/LiquidEther';

export default function NotFound() {
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
      <div className="flex min-h-screen items-center justify-center px-6 relative z-10">
        <div className="max-w-md text-center">
          <div className="mb-6 text-6xl">🔍</div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
            ENS Name Not Found
          </h1>
          <p className="mb-8 text-gray-600 dark:text-gray-400">
            The ENS name you&apos;re looking for doesn&apos;t exist or couldn&apos;t be resolved on the Ethereum blockchain.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-green-700 hover:shadow-xl"
          >
            ← Back to Search
          </Link>
        </div>
      </div>
    </div>
  );
}

