'use client';

import LiquidEther from '@/components/LiquidEther';

export default function Loading() {
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
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Loading ENS profile...
          </p>
        </div>
      </div>
    </div>
  );
}

