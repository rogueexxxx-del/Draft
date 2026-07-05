'use client';

import Link from 'next/link';
import ShaderCanvas from '@/components/ShaderCanvas';

export default function DashboardPage() {
  return (
    <main className="min-h-screen w-full bg-transparent flex flex-col justify-between p-6 sm:p-16 md:p-24 select-none relative overflow-hidden">
      
      {/* Generative WebGL backdrop study */}
      <ShaderCanvas panel={0} opacity={1.0} />

      {/* Mode picker stacked top-left */}
      <div className="flex flex-col space-y-12 md:space-y-16 mt-8 z-10">
        <Link
          href="/notes"
          className="font-degraded italic text-5xl sm:text-6xl md:text-7xl text-[var(--color-rust)] hover:opacity-80 transition-opacity w-fit"
        >
          notes
        </Link>
        <span className="font-degraded italic text-5xl sm:text-6xl md:text-7xl text-[var(--color-muted)] cursor-default select-none">
          scrapbook
        </span>
        <span className="font-degraded italic text-5xl sm:text-6xl md:text-7xl text-[var(--color-muted)] cursor-default select-none">
          shot list
        </span>
        <span className="font-degraded italic text-5xl sm:text-6xl md:text-7xl text-[var(--color-muted)] cursor-default select-none">
          script
        </span>
      </div>

      {/* "you" label positioned bottom-right */}
      <div className="flex justify-end mt-auto z-10">
        <Link
          href="/you"
          className="font-degraded italic text-5xl sm:text-6xl md:text-7xl text-[var(--color-rust)] hover:opacity-80 transition-opacity"
        >
          you
        </Link>
      </div>

    </main>
  );
}
