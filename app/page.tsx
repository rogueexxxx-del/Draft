'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import ShaderCanvas from '@/components/ShaderCanvas';

export default function WelcomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      setMounted(true);
      
      let isGuest = false;
      try {
        isGuest = localStorage.getItem('draft_guest_mode') === 'true';
      } catch (e) {}

      if (isGuest) {
        router.push('/dashboard');
        return;
      }

      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push('/dashboard');
        }
      } catch (err) {
        console.warn("Auto-redirect check failed:", err);
      }
    };
    checkSession();
  }, [router]);

  const handleLetsGo = async () => {
    try {
      localStorage.setItem('draft_welcome_seen', 'true');
    } catch (e) {
      console.warn("Storage write failed:", e);
    }

    let isGuest = false;
    try {
      isGuest = localStorage.getItem('draft_guest_mode') === 'true';
    } catch (e) {
      console.warn("Storage read failed:", e);
    }

    if (isGuest) {
      router.push('/dashboard');
      return;
    }

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
        return;
      }
    } catch (err) {
      console.warn("Supabase auth check failed, defaulting to guest signup:", err);
    }

    router.push('/signup');
  };

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-transparent select-none">
      {/* Generative WebGL liquid waves background (panel 1) */}
      <ShaderCanvas panel={1} opacity={1.0} />

      {/* Hero Composition */}
      <div className="z-10 flex flex-col items-center text-center space-y-16 max-w-full">
        <div className="relative flex flex-col items-center w-[290px] sm:w-[440px] md:w-[580px]">
          {/* Wordmark "Draft" */}
          <img 
            src="/draft.svg" 
            alt="Draft" 
            className="w-full h-auto select-none"
            draggable="false"
          />

          {/* Tagline: Two separate, independently positioned fragments */}
          <div className="w-full flex justify-between mt-[-4px] sm:mt-[-12px] md:mt-[-20px] px-1.5 font-serif not-italic text-[11px] sm:text-[15px] md:text-xl text-[var(--color-ink)]">
            {/* Left fragment: positioned left-aligned under "Dra" */}
            <span className="text-left w-[47%] leading-none whitespace-nowrap pl-1 sm:pl-0">
              a <span className="italic">f</span>ocused centered
            </span>
            {/* Right fragment: positioned right-aligned under "ft" */}
            <span className="text-right w-[47%] leading-none whitespace-nowrap pr-2.5 sm:pr-0">
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
