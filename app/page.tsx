'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import ShaderCanvas from '@/components/ShaderCanvas';

export default function WelcomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLetsGo = async () => {
    localStorage.setItem('draft_welcome_seen', 'true');
    if (localStorage.getItem('draft_guest_mode') === 'true') {
      router.push('/dashboard');
      return;
    }
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/signup');
    }
  };

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-transparent select-none">
      {/* Generative WebGL liquid waves background (panel 4) */}
      <ShaderCanvas panel={4} opacity={0.4} />

      {/* Hero Composition */}
      <div className="z-10 flex flex-col items-center text-center space-y-16 max-w-full">
        <div className="relative flex flex-col items-center w-[360px] sm:w-[480px] md:w-[620px]">
          {/* Wordmark "Draft" */}
          <img 
            src="/draft.svg" 
            alt="Draft" 
            className="w-full h-auto select-none"
            draggable="false"
          />

          {/* Tagline: Two separate, independently positioned fragments */}
          <div className="w-full flex justify-between mt-[-24px] sm:mt-[-36px] md:mt-[-48px] px-2 font-serif not-italic text-xl sm:text-2xl md:text-3xl text-[var(--color-ink)]">
            {/* Left fragment: positioned left-aligned under "Dra" */}
            <span className="text-left w-[45%] leading-none whitespace-nowrap">
              a <span className="italic">f</span>ocused centered
            </span>
            {/* Right fragment: positioned right-aligned under "ft" */}
            <span className="text-right w-[45%] leading-none whitespace-nowrap">
              creative tool
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleLetsGo}
          className="px-12 py-4 bg-[var(--color-ink)] text-[var(--color-surface)] text-sm md:text-base uppercase tracking-widest font-bold rounded-none hover:opacity-90 transition-opacity"
        >
          let's go
        </button>
      </div>
    </main>
  );
}
