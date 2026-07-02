'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

interface Bundle {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  bundleId: string;
  updatedAt: string;
  gridSpan?: string;
}

export default function NotesBundlesPage() {
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateBundleOpen, setIsCreateBundleOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Form states for new bundle
  const [bundleName, setBundleName] = useState('');
  const [bundleDesc, setBundleDesc] = useState('');
  const [bundleColor, setBundleColor] = useState('#DD400A'); // default rust

  // State loaded from localStorage or Supabase
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);

  // Initialize data on mount
  useEffect(() => {
    const loadData = async () => {
      const isGuest = localStorage.getItem('draft_guest_mode') === 'true';

      const defaultBundles: Bundle[] = [
        { id: 'unsorted', name: 'unsorted', description: 'default capture pool', color: '#D9D9D9' },
        { id: 'feature-film', name: 'Feature Film', description: 'screenplay prep', color: '#DD400A' },
        { id: 'journal', name: 'Journal', description: 'daily thoughts', color: '#141414' },
      ];

      const defaultNotes: Note[] = [
        { id: 'note-1', title: 'Character Outline', content: 'Hero archetype definition...', bundleId: 'feature-film', updatedAt: '2026-07-02', gridSpan: 'col-span-2 row-span-1' },
        { id: 'note-2', title: 'Act I Beats', content: 'Inciting incident at minute 10...', bundleId: 'feature-film', updatedAt: '2026-07-02', gridSpan: 'col-span-1 row-span-2' },
        { id: 'note-3', title: 'Reflections', content: 'Writing early in the morning feels better...', bundleId: 'journal', updatedAt: '2026-07-01', gridSpan: 'col-span-2 row-span-1' },
        { id: 'note-4', title: 'Fast Capture Note', content: 'A quick unstructured brain dump...', bundleId: 'unsorted', updatedAt: '2026-07-02', gridSpan: 'col-span-1 row-span-1' },
      ];

      if (isGuest) {
        const localBundles = localStorage.getItem('draft_bundles');
        const localNotes = localStorage.getItem('draft_notes');

        if (localBundles) {
          setBundles(JSON.parse(localBundles));
        } else {
          setBundles(defaultBundles);
          localStorage.setItem('draft_bundles', JSON.stringify(defaultBundles));
        }

        if (localNotes) {
          setNotes(JSON.parse(localNotes));
        } else {
          setNotes(defaultNotes);
          localStorage.setItem('draft_notes', JSON.stringify(defaultNotes));
        }
      } else {
        const supabase = createClient();
        
        // Fetch Bundles
        let { data: bundlesData } = await supabase.from('bundles').select('*');
        if (!bundlesData || bundlesData.length === 0) {
          await supabase.from('bundles').insert(defaultBundles);
          setBundles(defaultBundles);
        } else {
          setBundles(bundlesData);
        }

        // Fetch Notes
        let { data: notesData } = await supabase.from('notes').select('*');
        if (!notesData || notesData.length === 0) {
          const formattedDefaults = defaultNotes.map(n => ({
            id: n.id,
            title: n.title,
            content: n.content,
            bundle_id: n.bundleId,
            grid_span: n.gridSpan,
          }));
          await supabase.from('notes').insert(formattedDefaults);
          setNotes(defaultNotes);
        } else {
          const mappedNotes = notesData.map((n: any) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            bundleId: n.bundle_id,
            updatedAt: n.updated_at?.split('T')[0] || '',
            gridSpan: n.grid_span,
          }));
          setNotes(mappedNotes);
        }
      }
    };

    loadData();
  }, []);

  const handleCreateBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bundleName.trim()) return;

    const newBundle: Bundle = {
      id: 'bundle-' + Date.now(),
      name: bundleName,
      description: bundleDesc,
      color: bundleColor,
    };

    const isGuest = localStorage.getItem('draft_guest_mode') === 'true';

    if (isGuest) {
      const updatedBundles = [...bundles, newBundle];
      setBundles(updatedBundles);
      localStorage.setItem('draft_bundles', JSON.stringify(updatedBundles));
    } else {
      const supabase = createClient();
      await supabase.from('bundles').insert({
        id: newBundle.id,
        name: newBundle.name,
        description: newBundle.description,
        color: newBundle.color,
      });
      setBundles([...bundles, newBundle]);
    }

    // Reset form
    setBundleName('');
    setBundleDesc('');
    setBundleColor('#DD400A');
    setIsCreateBundleOpen(false);
  };

  const handleAddNote = () => {
    setIsTransitioning(true);
    setTimeout(async () => {
      const newNoteId = 'note-' + Date.now();
      const newNote = {
        id: newNoteId,
        title: 'Untitled',
        content: '',
        bundleId: selectedBundleId || 'unsorted',
        updatedAt: new Date().toISOString().split('T')[0],
        gridSpan: Math.random() > 0.5 ? 'col-span-2 row-span-1' : 'col-span-1 row-span-1',
      };

      const isGuest = localStorage.getItem('draft_guest_mode') === 'true';

      if (isGuest) {
        const updatedNotes = [...notes, newNote];
        setNotes(updatedNotes);
        localStorage.setItem('draft_notes', JSON.stringify(updatedNotes));
      } else {
        const supabase = createClient();
        await supabase.from('notes').insert({
          id: newNote.id,
          title: newNote.title,
          content: newNote.content,
          bundle_id: newNote.bundleId,
          grid_span: newNote.gridSpan,
        });
      }

      router.push(`/notes/editor/${newNoteId}`);
    }, 350);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = "draft_guest_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    localStorage.removeItem("draft_guest_mode");
    router.push('/login');
  };

  // Filter notes by bundle selection
  const filteredNotes = selectedBundleId
    ? notes.filter(n => n.bundleId === selectedBundleId)
    : notes;

  return (
    <div className={`flex flex-col min-h-screen bg-[var(--color-surface)] py-8 px-12 md:px-24 w-full relative select-none transition-all duration-500 ease-in-out ${isTransitioning ? 'scale-[0.97] opacity-0 blur-sm' : 'scale-100 opacity-100'}`}>
      
      {/* HEADER */}
      <div className="flex justify-between items-center z-30 w-full">
        {/* Left Filter Text Button */}
        <button 
          onClick={() => {
            setIsFilterOpen(!isFilterOpen);
            setIsSettingsOpen(false);
          }}
          className={`font-degraded not-italic text-lg md:text-xl tracking-wider uppercase transition-colors duration-150 ${isFilterOpen ? 'text-[var(--color-rust)]' : 'text-[var(--color-ink)]'} hover:opacity-75`}
        >
          filter
        </button>

        {/* Center Title */}
        <h1 className="text-6xl md:text-7xl text-[var(--color-rust)] font-degraded italic tracking-tight">
          notes
        </h1>

        {/* Right Menu Text Button */}
        <button 
          onClick={() => {
            setIsSettingsOpen(!isSettingsOpen);
            setIsFilterOpen(false);
          }}
          className={`font-degraded not-italic text-lg md:text-xl tracking-wider uppercase transition-colors duration-150 ${isSettingsOpen ? 'text-[var(--color-rust)]' : 'text-[var(--color-ink)]'} hover:opacity-75`}
        >
          menu
        </button>
      </div>

      {/* DROPDOWN MENU: BUNDLE FILTER (Left Side) */}
      {isFilterOpen && (
        <div className="absolute left-12 top-24 w-64 bg-[var(--color-surface)] border border-[var(--color-ink)] shadow-md z-40 p-5 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col space-y-2 max-h-60 overflow-y-auto">
            <button
              onClick={() => { setSelectedBundleId(null); setIsFilterOpen(false); }}
              className={`text-left px-3 py-2 font-degraded not-italic text-sm uppercase tracking-wider ${!selectedBundleId ? 'bg-[var(--color-ink)] text-[var(--color-surface)]' : 'hover:bg-[var(--color-input-bg)] text-[var(--color-ink)]'}`}
            >
              <span className="italic">A</span>LL N<span className="italic">O</span>TES
            </button>
            {bundles.map(b => (
              <button
                key={b.id}
                onClick={() => { setSelectedBundleId(b.id); setIsFilterOpen(false); }}
                className={`text-left px-3 py-2 font-degraded not-italic text-sm uppercase tracking-wider flex items-center space-x-2 ${selectedBundleId === b.id ? 'bg-[var(--color-ink)] text-[var(--color-surface)]' : 'hover:bg-[var(--color-input-bg)] text-[var(--color-ink)]'}`}
              >
                <span className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: b.color }} />
                <span className="truncate">{b.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* DROPDOWN MENU: NOTES SETTINGS (Right Side) */}
      {isSettingsOpen && (
        <div className="absolute right-12 top-24 w-64 bg-[var(--color-surface)] border border-[var(--color-ink)] shadow-md z-40 p-5 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col space-y-4">
            <Link
              href="/dashboard"
              className="font-degraded not-italic text-sm tracking-wider text-[var(--color-ink)] hover:text-[var(--color-rust)] hover:underline block"
            >
              B<span className="italic">A</span>CK TO D<span className="italic">A</span>SHBOARD
            </Link>
            <button
              onClick={() => { setIsCreateBundleOpen(true); setIsSettingsOpen(false); }}
              className="w-full text-left font-degraded not-italic text-sm tracking-wider text-[var(--color-ink)] hover:text-[var(--color-rust)] hover:underline block"
            >
              CRE<span className="italic">A</span>TE NEW B<span className="italic">U</span>NDLE
            </button>
            <button
              className="w-full text-left font-degraded not-italic text-sm tracking-wider text-[var(--color-ink)] hover:text-[var(--color-rust)] hover:underline block"
            >
              EXP<span className="italic">O</span>RT <span className="italic">A</span>LL N<span className="italic">O</span>TES
            </button>
          </div>
        </div>
      )}

      {/* BENTO GRID OF NOTES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-16 flex-grow content-start w-full">
        {filteredNotes.map((note) => {
          const bundle = bundles.find(b => b.id === note.bundleId);
          const blockColor = bundle?.color || '#D9D9D9';
          
          // Reverse text color logic for clear bento grid display
          const isDarkBg = blockColor === '#141414' || blockColor === '#DD400A';
          const textColor = isDarkBg ? 'text-[var(--color-surface)]' : 'text-[var(--color-ink)]';
          const descColor = isDarkBg ? 'text-[var(--color-surface)]/70' : 'text-[var(--color-muted)]';

          // Render note body text preview, stripping html elements if synced from Editor
          const cleanTextPreview = note.content
            ? note.content.replace(/<[^>]*>/g, ' ').substring(0, 120)
            : 'empty note...';

          return (
            <Link
              key={note.id}
              href={`/notes/editor/${note.id}`}
              className={`p-8 flex flex-col justify-between transition-transform duration-200 hover:scale-[1.01] ${note.gridSpan || 'col-span-1 row-span-1'}`}
              style={{ backgroundColor: blockColor }}
            >
              <span className={`text-xs font-sans tracking-widest uppercase ${descColor}`}>
                {bundle?.name || 'unsorted'}
              </span>
              <div className="mt-6 flex-grow flex flex-col justify-end">
                {/* Bundle note titles should be regular (not italic) */}
                <h3 className={`text-2xl font-serif not-italic font-normal ${textColor} truncate`}>
                  {note.title}
                </h3>
                <p className={`text-sm mt-2 line-clamp-3 font-serif ${descColor}`}>
                  {cleanTextPreview}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* FLOATING ACTION: ADD NOTE */}
      <div className="flex justify-center pt-12 pb-6">
        <button
          onClick={handleAddNote}
          className="text-2xl font-serif not-italic text-[var(--color-ink)] hover:underline transition-all"
        >
          + <span className="italic">A</span>DD NOTE
        </button>
      </div>

      {/* BUNDLE CREATION MODAL */}
      {isCreateBundleOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-ink)] p-8 max-w-md w-full relative">
            <h3 className="font-degraded italic text-2xl mb-6">Create New Bundle</h3>
            <form onSubmit={handleCreateBundle} className="flex flex-col space-y-4">
              <input 
                type="text"
                placeholder="Bundle Name"
                value={bundleName}
                onChange={(e) => setBundleName(e.target.value)}
                required
                className="w-full p-3 bg-[var(--color-input-bg)] border-none text-[var(--color-ink)] focus:outline-none placeholder:text-[var(--color-muted)] placeholder:italic text-sm"
              />
              <textarea 
                placeholder="Description (Optional)"
                value={bundleDesc}
                onChange={(e) => setBundleDesc(e.target.value)}
                className="w-full p-3 bg-[var(--color-input-bg)] border-none text-[var(--color-ink)] focus:outline-none placeholder:text-[var(--color-muted)] placeholder:italic text-sm h-24 resize-none"
              />
              <div className="flex flex-col space-y-2">
                <span className="text-xs uppercase tracking-widest text-[var(--color-muted)]">Color Tag</span>
                <div className="flex space-x-3">
                  {['#DD400A', '#141414', '#D9D9D9', '#3B82F6', '#FBBF24'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBundleColor(color)}
                      className={`w-8 h-8 transition-transform ${bundleColor === color ? 'border-2 border-[var(--color-ink)] scale-110' : 'border border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateBundleOpen(false)}
                  className="font-degraded not-italic text-sm uppercase tracking-wider hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="font-degraded font-bold text-sm uppercase tracking-wider text-[var(--color-rust)] hover:underline"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
