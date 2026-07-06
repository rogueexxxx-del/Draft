'use client';

import ShaderCanvas from '@/components/ShaderCanvas';
import FlowingMenu from '@/components/FlowingMenu';

const menuItems = [
  { link: '/notes', text: 'notes' },
  { link: '#', text: 'scrapbook', disabled: true },
  { link: '#', text: 'shot list', disabled: true },
  { link: '#', text: 'script', disabled: true },
  { link: '/you', text: 'you' },
];

export default function DashboardPage() {
  return (
    <main className="min-h-[100dvh] w-full bg-transparent flex flex-col justify-center select-none relative overflow-hidden p-0">
      
      {/* Generative WebGL backdrop study */}
      <ShaderCanvas panel={0} opacity={1.0} />

      <div className="z-10 w-full h-[70dvh] flex items-center justify-center">
        <FlowingMenu items={menuItems} />
      </div>

    </main>
  );
}
