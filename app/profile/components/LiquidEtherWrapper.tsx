'use client';

import LiquidEther from '@/components/LiquidEther';

export default function LiquidEtherWrapper({ children }: { children: React.ReactNode }) {
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
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

