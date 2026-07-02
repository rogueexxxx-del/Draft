'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

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
    <div className="relative min-h-screen w-full bg-[var(--color-surface)] py-12 px-12 md:px-24 flex flex-col items-center justify-between select-none font-degraded not-italic text-[var(--color-ink)]">
      
      {/* Top Header Row */}
      <div className="w-full flex justify-center items-center relative mt-6">
        {/* Centered 'you' logo wordmark */}
        <h1 className="text-6xl md:text-7xl text-[var(--color-rust)] font-degraded font-normal tracking-tight">
          <span className="italic">y</span>ou
        </h1>

        {/* Right Hamburger icon linking back to Dashboard */}
        <Link 
          href="/dashboard" 
          className="absolute right-0 top-3 flex flex-col space-y-1.5 justify-center items-center group cursor-pointer"
          title="Back to Dashboard"
        >
          <span className="w-6 h-[2px] bg-[var(--color-ink)] transition-transform duration-200 group-hover:scale-x-75" />
          <span className="w-6 h-[2px] bg-[var(--color-ink)]" />
          <span className="w-6 h-[2px] bg-[var(--color-ink)] transition-transform duration-200 group-hover:scale-x-75" />
        </Link>
      </div>

      {/* Centered User Email Display */}
      <div className="flex flex-col items-center my-auto space-y-2">
        <span className="text-sm tracking-widest text-[var(--color-muted)] uppercase">
          E<span className="italic">M</span>AIL
        </span>
        <h2 className="text-2xl md:text-3xl font-serif font-normal tracking-wide text-center uppercase break-all">
          {email}
        </h2>
      </div>

      {/* Bottom Option Actions Column (Stacked vertically with styling) */}
      <div className="flex flex-col items-center space-y-6 mb-12">
        {/* Sync */}
        <button
          onClick={handleSync}
          className="text-xl md:text-2xl font-serif not-italic hover:underline cursor-pointer tracking-wider"
        >
          S<span className="italic">Y</span>NC
        </button>

        {/* Delete Account */}
        <button
          onClick={handleDeleteAccount}
          className="text-xl md:text-2xl font-serif not-italic hover:underline cursor-pointer tracking-wider text-red-600"
        >
          D<span className="italic">E</span>L<span className="italic">E</span>TE <span className="italic">A</span>CCO<span className="italic">U</span>NT
        </button>

        {/* Log Out */}
        <button
          onClick={handleLogout}
          className="text-xl md:text-2xl font-serif not-italic hover:underline cursor-pointer tracking-wider"
        >
          L<span className="italic">O</span>G <span className="italic">O</span>UT
        </button>
      </div>

    </div>
  );
}
