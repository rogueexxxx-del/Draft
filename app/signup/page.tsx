'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import ShaderCanvas from '@/components/ShaderCanvas';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      try {
        localStorage.setItem('draft_user_email', email);
      } catch (e) {}

      // Clear guest mode if they sign up with real Supabase configurations
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
      // Tapping this signs the user in via Supabase anonymous auth
      // ponytail: guest mode is trial-only for now; upgrade path requires supabase.auth.linkIdentity()
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      
      document.cookie = "draft_guest_mode=true; path=/";
      localStorage.setItem("draft_guest_mode", "true");
      router.push("/dashboard");
    } catch (err: any) {
      console.warn("Supabase anonymous auth failed, falling back to local guest mode:", err.message);
      document.cookie = "draft_guest_mode=true; path=/";
      localStorage.setItem("draft_guest_mode", "true");
      router.push("/dashboard");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-transparent select-none relative overflow-hidden">
      {/* Generative WebGL crystal growth backdrop with Rust theme (panel 1) */}
      <ShaderCanvas panel={1} theme="rust" opacity={1.0} />

      {/* Auth Card wrapped in glassmorphism panel */}
      <div className="w-full max-w-sm p-10 glass-panel flex flex-col items-center space-y-10 z-10 bg-white/80 dark:bg-zinc-900/80 shadow-2xl">
        
        {/* WORDMARK & TAGLINE */}
        <div className="text-center flex flex-col items-center space-y-1">
          <img 
            src="/draft.svg" 
            alt="Draft" 
            className="w-40 h-auto select-none"
            draggable="false"
          />
          <p className="text-xs text-[var(--color-muted)] font-serif not-italic mt-[-2px]">
            start with one idea.
          </p>
        </div>

        <form onSubmit={handleSignup} className="w-full flex flex-col space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            required
            className="w-full h-11 px-4 rounded-2xl text-center text-sm font-normal bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-rust)] placeholder:text-zinc-400 outline-none transition-all"
          />
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            required
            className="w-full h-11 px-4 rounded-2xl text-center text-sm font-normal bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-rust)] placeholder:text-zinc-400 outline-none transition-all"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="confirm password"
            required
            className="w-full h-11 px-4 rounded-2xl text-center text-sm font-normal bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-rust)] placeholder:text-zinc-400 outline-none transition-all"
          />
          
          {error && <div className="text-red-600 bg-red-50 border border-red-100 px-3 py-2 text-xs text-center rounded-xl font-medium">{error}</div>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-2xl bg-[var(--color-ink)] text-[var(--color-surface)] uppercase font-bold tracking-widest hover:opacity-90 disabled:opacity-50 transition-opacity text-xs mt-2"
          >
            {loading ? 'processing...' : 'sign up'}
          </button>
        </form>

        <div className="w-full border-t border-black/5 dark:border-white/5" />

        {/* SECONDARY ACTIONS */}
        <div className="flex flex-col items-center space-y-3 text-xs text-[var(--color-ink)] w-full">
          <div>
            already in? — <Link href="/login" className="underline hover:opacity-75 transition-opacity font-bold">log in</Link>
          </div>
          <button
            type="button"
            onClick={handleGuestMode}
            className="underline hover:opacity-75 transition-opacity bg-transparent border-none p-0 cursor-pointer font-medium text-xs"
          >
            try it without an account
          </button>
        </div>

      </div>
    </main>
  );
}
