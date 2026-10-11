'use client';

import ShaderCanvas from '@/components/ShaderCanvas';
import FlowingMenu from '@/components/FlowingMenu';

const menuItems = [
  { link: '/notes', text: 'notes' },
  { link: '/scrapbook', text: 'scrapbook' },
  { link: '/shot-list', text: 'shot list' },
  { link: '/script', text: 'script' },
  { link: '/you', text: 'you' },
];

export default function DashboardPage() {
  return (
    <main className="dashboard-page min-h-[100dvh] w-full bg-transparent flex flex-col justify-center select-none relative overflow-hidden p-0">
      
      {/* Generative WebGL backdrop study */}
      <ShaderCanvas panel={0} opacity={0.42} />

      <header className="dashboard-header"><span>draft<span>.</span></span><small>a focus centered creative tool</small></header>

      <div className="dashboard-menu z-10 w-full flex items-center justify-center">
        <FlowingMenu items={menuItems} />
      </div>

      <footer className="dashboard-footer"><span>make space for the idea.</span><span>01 — 05</span></footer>

    </main>
  );
}
