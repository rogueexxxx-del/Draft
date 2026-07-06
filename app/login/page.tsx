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
      try {
        localStorage.setItem('draft_user_email', email);
      } catch (e) {}

      // Clear guest mode if they log in to a real account with real Supabase configurations
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
        document.cookie = "draft_guest_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        localStorage.removeItem("draft_guest_mode");
      } else {
        document.cookie = "draft_guest_mode=true; path=/";
        localStorage.setItem("draft_guest_mode", "true");
      }
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
    <main className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-transparent select-none relative overflow-hidden">
      {/* Generative WebGL backdrop (panel 1) */}
      <ShaderCanvas panel={1} opacity={1.0} />

      {/* Auth Card wrapped in glassmorphism panel */}
      <div className="w-full max-w-sm p-10 glass-panel flex flex-col items-center space-y-10 z-10">
        
        {/* WORDMARK & TAGLINE */}
        <div className="text-center flex flex-col items-center space-y-1">
          <img 
            src="/draft.svg" 
            alt="Draft" 
            className="w-40 h-auto select-none"
            draggable="false"
          />
          <p className="text-xs text-[var(--color-muted)] font-serif not-italic mt-[-2px]">
            everything in one place.
          </p>
        </div>

        <form onSubmit={handleLogin} className="w-full flex flex-col space-y-4">
          <input 
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            required
            aria-label="Email address"
            autoComplete="email"
            data-testid="login-email"
            className="w-full h-11 px-4 rounded-2xl text-center text-sm font-normal bg-zinc-50 border border-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rust)] placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-all"
          />
          <input 
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            required
            aria-label="Password"
            autoComplete="current-password"
            data-testid="login-password"
            className="w-full h-11 px-4 rounded-2xl text-center text-sm font-normal bg-zinc-50 border border-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rust)] placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-all"
          />
          {error && <div role="alert" aria-live="polite" className="text-red-600 bg-red-50 border border-red-100 px-3 py-2 text-xs text-center rounded-xl font-medium">{error}</div>}
          <button 
            type="submit"
            data-testid="login-submit"
            aria-label="Log in to your account"
            className="w-full h-11 rounded-2xl glass-btn uppercase font-bold tracking-widest text-xs mt-2"
          >
            l<span className="italic">o</span>g <span className="italic">i</span>n
          </button>
        </form>

        <div className="w-full border-t border-black/5 dark:border-white/5" />

        {/* SECONDARY ACTIONS */}
        <div className="flex flex-col items-center space-y-3 text-xs text-[var(--color-ink)] w-full">
          <div>
            no account yet? — <Link href="/signup" className="underline hover:opacity-75 transition-opacity font-bold">create one</Link>
          </div>
          <button
            type="button"
            onClick={handleGuestMode}
            data-testid="guest-mode-button"
            className="underline hover:opacity-75 transition-opacity bg-transparent border-none p-0 cursor-pointer font-medium text-xs"
          >
            try it without an account
          </button>
        </div>

      </div>
    </main>
  );
}
