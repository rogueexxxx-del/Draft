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

  const handleGoogleLogin = async () => {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
    }
  };

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-transparent select-none relative overflow-hidden">
      {/* Generative WebGL crystal growth backdrop with Rust theme (panel 1) */}
      <ShaderCanvas panel={1} theme="rust" opacity={1.0} />

      {/* Auth Card wrapped in glassmorphism panel */}
      <div className="w-full max-w-sm p-10 glass-panel flex flex-col items-center space-y-10 z-10">
        
        {/* WORDMARK & TAGLINE */}
        <div className="text-center flex flex-col items-center space-y-1">
          <h1 className="text-4xl text-[var(--color-ink)] font-bold tracking-widest uppercase font-degraded">
            d<span className="italic">r</span>aft
          </h1>
          <p className="text-xs text-[var(--color-muted)] font-serif not-italic mt-[-2px]">
            start with one idea.
          </p>
        </div>

        <form onSubmit={handleSignup} className="w-full flex flex-col space-y-4">
          <input 
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="EMAIL"
            required
            aria-label="Email address"
            autoComplete="email"
            data-testid="signup-email"
            className="w-full h-11 px-4 rounded-2xl text-center text-sm font-normal glass-input focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-all"
          />
          <input 
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="PASSWORD"
            required
            aria-label="Password"
            autoComplete="new-password"
            data-testid="signup-password"
            className="w-full h-11 px-4 rounded-2xl text-center text-sm font-normal glass-input focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-all"
          />
          <input
            id="signup-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="CONFIRM PASSWORD"
            required
            aria-label="Confirm password"
            autoComplete="new-password"
            data-testid="signup-confirm-password"
            className="w-full h-11 px-4 rounded-2xl text-center text-sm font-normal glass-input focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-all"
          />
          
          {error && <div role="alert" aria-live="polite" className="text-red-600 bg-red-50 border border-red-100 px-3 py-2 text-xs text-center rounded-xl font-medium">{error}</div>}
          
          <button
            type="submit"
            disabled={loading}
            data-testid="signup-submit"
            aria-label="Create account"
            className="w-full h-11 rounded-2xl glass-btn uppercase font-bold tracking-widest text-xs mt-2 disabled:opacity-50"
          >
            {loading ? 'processing...' : <>s<span className="italic">i</span>gn <span className="italic">u</span>p</>}
          </button>
          
          <button 
            type="button"
            onClick={handleGoogleLogin}
            aria-label="Sign up with Google"
            className="w-full h-11 rounded-2xl glass-btn uppercase font-bold tracking-widest text-xs"
          >
            c<span className="italic">o</span>nt<span className="italic">i</span>nu<span className="italic">e</span> w<span className="italic">i</span>th g<span className="italic">o</span>o<span className="italic">g</span>l<span className="italic">e</span>
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
