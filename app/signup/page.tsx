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
      // Clear guest mode if they sign up
      document.cookie = "draft_guest_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      localStorage.removeItem("draft_guest_mode");
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
      {/* Generative WebGL crystal growth backdrop with Rust theme (panel 6) */}
      <ShaderCanvas panel={6} theme="rust" opacity={1.0} />

      <div className="w-full max-w-lg flex flex-col items-center space-y-16 z-10">
        
        {/* WORDMARK & TAGLINE */}
        <div className="text-center flex flex-col items-center space-y-1">
          <img 
            src="/draft.svg" 
            alt="Draft" 
            className="w-48 h-auto select-none brightness-0 invert"
            draggable="false"
          />
          <p className="text-base text-[var(--color-surface)] font-serif not-italic whitespace-nowrap mt-[-6px] opacity-90">
            start with one idea.
          </p>
        </div>

        <form onSubmit={handleSignup} className="w-full flex flex-col space-y-4 max-w-sm">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-M4IL"
            required
            className="w-full h-[35px] px-4 rounded-full text-center text-xs font-normal glass-panel text-[var(--color-surface)] focus:outline-none placeholder:text-center placeholder:text-white/60 placeholder:text-xs outline-none"
          />
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="P4SSW0RD"
            required
            className="w-full h-[35px] px-4 rounded-full text-center text-xs font-normal glass-panel text-[var(--color-surface)] focus:outline-none placeholder:text-center placeholder:text-white/60 placeholder:text-xs outline-none"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="C0NFIRM P4SSW0RD"
            required
            className="w-full h-[35px] px-4 rounded-full text-center text-xs font-normal glass-panel text-[var(--color-surface)] focus:outline-none placeholder:text-center placeholder:text-white/60 placeholder:text-xs outline-none"
          />
          
          {error && <p className="text-red-300 glass-panel-dark px-3 py-1.5 text-xs text-center rounded-full">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[35px] rounded-full glass-panel-dark text-[var(--color-surface)] uppercase font-bold tracking-widest hover:scale-[1.02] disabled:opacity-50 transition-all text-xs"
          >
            {loading ? 'PR0CESSING...' : 'S1GN UP'}
          </button>
        </form>

        {/* SECONDARY ACTIONS */}
        <div className="flex flex-col items-center space-y-3 text-sm text-[var(--color-surface)]">
          <div>
            already in — <Link href="/login" className="underline hover:opacity-75 transition-opacity">log in</Link>
          </div>
          <button
            type="button"
            onClick={handleGuestMode}
            className="underline hover:opacity-75 transition-opacity bg-transparent border-none p-0 cursor-pointer font-normal text-sm text-[var(--color-surface)]"
          >
            try it without an account
          </button>
        </div>

      </div>
    </main>
  );
}
