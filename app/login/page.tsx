'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import ShaderCanvas from '@/components/ShaderCanvas';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      // Clear guest mode if they log in to a real account
      document.cookie = "draft_guest_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      localStorage.removeItem("draft_guest_mode");
      router.push('/dashboard');
    }
  };

  const handleGuestMode = async () => {
    setError(null);
    const supabase = createClient();
    try {
      // Tapping this signs the user in via Supabase anonymous auth.
      // ponytail: guest mode is trial-only for now; upgrade path requires supabase.auth.linkIdentity()
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      
      document.cookie = "draft_guest_mode=true; path=/";
      localStorage.setItem("draft_guest_mode", "true");
      router.push("/dashboard");
    } catch (err: any) {
      // Fallback to local guest mode bypass if Supabase is not yet configured
      console.warn("Supabase anonymous auth failed, falling back to local guest mode:", err.message);
      document.cookie = "draft_guest_mode=true; path=/";
      localStorage.setItem("draft_guest_mode", "true");
      router.push("/dashboard");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-transparent select-none relative overflow-hidden">
      {/* Generative WebGL fractal terrain backdrop (panel 2) */}
      <ShaderCanvas panel={2} opacity={0.4} />

      <div className="w-full max-w-lg flex flex-col items-center space-y-16 z-10">
        
        {/* WORDMARK & TAGLINE */}
        <div className="text-center flex flex-col items-center space-y-1">
          <img 
            src="/draft.svg" 
            alt="Draft" 
            className="w-48 h-auto select-none"
            draggable="false"
          />
          <p className="text-base text-[var(--color-muted)] font-serif not-italic whitespace-nowrap mt-[-6px]">
            everything you're working on in one place.
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="w-full flex flex-col space-y-4">
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-4 bg-[var(--color-input-bg)] text-[var(--color-ink)] placeholder-[#808080] placeholder:not-italic focus:outline-none rounded-none text-lg text-center"
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-4 bg-[var(--color-input-bg)] text-[var(--color-ink)] placeholder-[#808080] placeholder:not-italic focus:outline-none rounded-none text-lg text-center"
          />
          
          {error && <p className="text-red-500 text-sm text-center font-serif">{error}</p>}
          
          <button
            type="submit"
            className="w-full py-4 mt-4 bg-[var(--color-ink)] text-[var(--color-surface)] uppercase font-bold tracking-widest hover:opacity-90 transition-opacity rounded-none text-base"
          >
            LOG IN
          </button>
        </form>

        {/* SECONDARY ACTIONS */}
        <div className="flex flex-col items-center space-y-3 text-sm text-[var(--color-ink)]">
          <div>
            no account yet — <Link href="/signup" className="underline hover:opacity-75 transition-opacity">create one</Link>
          </div>
          <button
            type="button"
            onClick={handleGuestMode}
            className="underline hover:opacity-75 transition-opacity bg-transparent border-none p-0 cursor-pointer font-normal text-sm"
          >
            try it without an account
          </button>
        </div>

      </div>
    </main>
  );
}
