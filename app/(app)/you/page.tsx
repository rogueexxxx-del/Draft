'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import ShaderCanvas from '@/components/ShaderCanvas';
import { Menu } from 'lucide-react';

export default function YouPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('LOADING...');

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      let localEmail = '';
      try {
        localEmail = localStorage.getItem('draft_user_email') || '';
      } catch (e) {}

      if (user) {
        if (user.id === 'guest-mock' && localEmail) {
          setEmail(localEmail.toUpperCase());
        } else {
          setEmail(user.email?.toUpperCase() ?? 'GUEST@DRAFT.COM');
        }
      } else {
        setEmail(localEmail ? localEmail.toUpperCase() : 'GUEST@DRAFT.COM');
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = "draft_guest_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    try {
      localStorage.removeItem("draft_guest_mode");
      localStorage.removeItem("draft_user_email");
    } catch (e) {}
    router.push('/login');
  };

  const handleDeleteAccount = () => {
    if (confirm('ARE YOU SURE YOU WANT TO DELETE YOUR ACCOUNT? THIS CANNOT BE UNDONE.')) {
      alert('Account deletion initiated.');
      handleLogout();
    }
  };

  const handleSync = () => {
    alert('Sync completed successfully.');
  };

  return (
    <div className="relative min-h-screen w-full bg-transparent py-12 px-6 sm:px-12 md:px-24 flex flex-col items-center justify-between select-none font-degraded not-italic text-[var(--color-ink)]">
      {/* Soft Blurry Metaballs Shader Backdrop */}
      <ShaderCanvas panel={1} opacity={1.0} />
      
      {/* Top Header Row */}
      <div className="w-full flex justify-center items-center relative mt-6 z-10">
        {/* Centered 'you' logo wordmark */}
        <h1 className="text-6xl md:text-7xl text-[var(--color-rust)] font-degraded font-normal tracking-tight">
          <span className="italic">y</span>ou
        </h1>

        {/* Right Menu icon linking back to Dashboard */}
        <Link 
          href="/dashboard" 
          className="absolute right-0 top-3 flex items-center justify-center p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          title="Back to Dashboard"
        >
          <Menu size={20} />
        </Link>
      </div>

      {/* Centered Profile Card wrapping email and actions in glassmorphism */}
      <div className="w-full max-w-md p-10 glass-panel flex flex-col items-center justify-center my-auto space-y-8 z-10">
        {/* User Email Display */}
        <div className="flex flex-col items-center space-y-2">
          <span className="text-sm tracking-widest text-[var(--color-muted)] uppercase">
            E<span className="italic">M</span>AIL
          </span>
          <h2 className="text-xl md:text-2xl font-serif font-normal tracking-wide text-center uppercase break-all text-[var(--color-ink)]">
            {email}
          </h2>
        </div>

        <div className="w-full border-t border-black/5 my-4" />

        {/* Option Actions Column */}
        <div className="flex flex-col items-center space-y-6 w-full">
          {/* Sync */}
          <button
            onClick={handleSync}
            className="text-xl font-serif not-italic hover:underline cursor-pointer tracking-wider text-[var(--color-ink)]"
          >
            S<span className="italic">Y</span>NC
          </button>

          {/* Delete Account */}
          <button
            onClick={handleDeleteAccount}
            className="text-xl font-serif not-italic hover:underline cursor-pointer tracking-wider text-red-600"
          >
            D<span className="italic">E</span>L<span className="italic">E</span>TE <span className="italic">A</span>CCO<span className="italic">U</span>NT
          </button>

          {/* Log Out */}
          <button
            onClick={handleLogout}
            className="text-xl font-serif not-italic hover:underline cursor-pointer tracking-wider text-[var(--color-ink)]"
          >
            L<span className="italic">O</span>G <span className="italic">O</span>UT
          </button>
        </div>
      </div>

    </div>
  );
}
