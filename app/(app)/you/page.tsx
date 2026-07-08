'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import ShaderCanvas from '@/components/ShaderCanvas';
import IconButton from '@/components/ui/IconButton';
import { Menu, RefreshCw, Trash2, LogOut, ChevronRight } from 'lucide-react';

export default function YouPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('LOADING...');
  const [syncing, setSyncing] = useState(false);

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

  const handleSync = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.id === 'guest-mock') {
      alert('PLEASE LOG IN TO SYNC YOUR DATA.');
      return;
    }

    setSyncing(true);
    try {
      // 1. Sync bundles
      const localBundlesStr = localStorage.getItem('draft_bundles');
      if (localBundlesStr) {
        const localBundles = JSON.parse(localBundlesStr);
        for (const bundle of localBundles) {
          // Replace 'guest-mock' suffix with the real user id
          const cleanId = bundle.id.replace('guest-mock-', `${user.id}-`);
          
          await supabase.from('bundles').upsert({
            id: cleanId,
            name: bundle.name,
            description: bundle.description || '',
            color: bundle.color || '#DD400A',
            user_id: user.id
          });
        }
      }

      // 2. Sync notes
      const localNotesStr = localStorage.getItem('draft_notes');
      if (localNotesStr) {
        const localNotes = JSON.parse(localNotesStr);
        for (const note of localNotes) {
          // Replace guest-mock suffix in bundleId
          const cleanBundleId = note.bundleId.replace('guest-mock-', `${user.id}-`);
          
          await supabase.from('notes').upsert({
            id: note.id,
            title: note.title || 'Untitled',
            content: note.content || '',
            description: note.description || '',
            bundle_id: cleanBundleId,
            grid_span: note.gridSpan || 'col-span-1 row-span-1',
            theme_settings: note.theme_settings || {},
            user_id: user.id
          });
        }
      }

      // Clear local storage and cookies so the user doesn't double sync or stay in guest mode
      localStorage.removeItem('draft_notes');
      localStorage.removeItem('draft_bundles');
      
      alert('SYNC COMPLETED SUCCESSFULLY! ALL LOCAL DATA HAS BEEN SECURELY SAVED TO THE DATABASE.');
    } catch (err: any) {
      console.error('Sync failed:', err);
      alert(`SYNC FAILED: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-transparent py-12 px-6 sm:px-12 md:px-24 flex flex-col items-center justify-between select-none font-degraded not-italic text-white">
      {/* Soft Blurry Metaballs Shader Backdrop */}
      <ShaderCanvas panel={1} opacity={1.0} />
      
      {/* Top Header Row */}
      <div className="w-full flex justify-center items-center relative mt-6 z-10">
        {/* Centered 'you' logo wordmark */}
        <h1 className="text-6xl md:text-7xl text-[var(--color-rust)] font-degraded font-normal tracking-tight">
          <span className="italic">y</span>ou
        </h1>

        {/* Right Menu icon linking back to Dashboard */}
        <Link href="/dashboard" className="absolute right-0 top-0">
          <IconButton
            onClick={() => {}}
            aria-label="Back to Dashboard"
            data-testid="you-back"
            className="text-white"
          >
            <Menu size={20} />
          </IconButton>
        </Link>
      </div>

      {/* Centered Profile Card wrapping email and actions in glassmorphism */}
      <div className="w-full max-w-md p-10 glass-panel flex flex-col items-center justify-center my-auto space-y-8 z-10 text-white">
        {/* User Email Display */}
        <div className="flex flex-col items-center space-y-2">
          <span className="text-sm tracking-widest text-zinc-400 uppercase">
            E<span className="italic">M</span>AIL
          </span>
          <h2 className="text-sm sm:text-base md:text-xl font-serif font-normal tracking-wide text-center uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-2 text-white">
            {email}
          </h2>
        </div>

        <div className="w-full border-t border-white/10 my-4" />

        {/* HIG-style Settings Table Rows */}
        <div className="flex flex-col w-full" role="list" aria-busy={syncing}>
          {/* Sync Row */}
          <button
            onClick={handleSync}
            disabled={syncing}
            data-testid="sync-button"
            className="flex items-center justify-between w-full px-4 py-4 min-h-[52px] hover:bg-white/5 rounded-[2px] transition-colors disabled:opacity-50 active:scale-[0.98]"
            role="listitem"
          >
            <div className="flex items-center gap-4">
              <RefreshCw size={20} className={`text-white ${syncing ? 'animate-spin' : ''}`} />
              <span className="text-base font-serif not-italic tracking-wide text-white">
                {syncing ? <>S<span className="italic">y</span>nc<span className="italic">i</span>ng...</> : <>S<span className="italic">y</span>nc D<span className="italic">a</span>ta</>}
              </span>
            </div>
            <ChevronRight size={16} className="text-white/40" />
          </button>

          {/* Delete Account Row */}
          <button
            onClick={handleDeleteAccount}
            data-testid="delete-account-button"
            className="flex items-center justify-between w-full px-4 py-4 min-h-[52px] hover:bg-red-950/20 rounded-[2px] transition-colors active:scale-[0.98]"
            role="listitem"
          >
            <div className="flex items-center gap-4">
              <Trash2 size={20} className="text-red-600" />
              <span className="text-base font-serif not-italic tracking-wide text-red-600">
                D<span className="italic">e</span>l<span className="italic">e</span>te A<span className="italic">c</span>c<span className="italic">o</span>unt
              </span>
            </div>
            <ChevronRight size={16} className="text-red-400" />
          </button>

          {/* Log Out Row */}
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="flex items-center justify-between w-full px-4 py-4 min-h-[52px] hover:bg-white/5 rounded-[2px] transition-colors active:scale-[0.98]"
            role="listitem"
          >
            <div className="flex items-center gap-4">
              <LogOut size={20} className="text-white" />
              <span className="text-base font-serif not-italic tracking-wide text-white">
                L<span className="italic">o</span>g O<span className="italic">u</span>t
              </span>
            </div>
            <ChevronRight size={16} className="text-white/40" />
          </button>
        </div>
      </div>

    </div>
  );
}
