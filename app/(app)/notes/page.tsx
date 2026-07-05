'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Star, MoreHorizontal, Filter, Menu } from 'lucide-react';
import ShaderCanvas from '@/components/ShaderCanvas';

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
  const [isCreateBundleOpen, setIsCreateBundleOpen] = useState(false);
  const [userId, setUserId] = useState('guest-mock');

  // Form states for new bundle
  const [bundleName, setBundleName] = useState('');
  const [bundleDesc, setBundleDesc] = useState('');
  const [bundleColor, setBundleColor] = useState('#DD400A'); // default rust

  // State loaded from localStorage or Supabase
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const [starredBundles, setStarredBundles] = useState<string[]>([]);

  const gridRef = useRef<HTMLDivElement>(null);

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16) || 255;
    const g = parseInt(hex.slice(3, 5), 16) || 255;
    const b = parseInt(hex.slice(5, 7), 16) || 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const hexToRgbString = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) || 255;
    const g = parseInt(hex.slice(3, 5), 16) || 255;
    const b = parseInt(hex.slice(5, 7), 16) || 255;
    return `${r}, ${g}, ${b}`;
  };

  // Initialize data on mount
  useEffect(() => {
    const loadData = async () => {
      const isGuest = localStorage.getItem('draft_guest_mode') === 'true';

      const storedStars = localStorage.getItem('draft_starred_bundles');
      if (storedStars) setStarredBundles(JSON.parse(storedStars));

      let activeUserId = 'guest-mock';
      if (!isGuest) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          activeUserId = user.id;
          setUserId(user.id);
        }
      }

      const defaultBundles: Bundle[] = [
        { id: `${activeUserId}-unsorted`, name: 'unsorted', description: 'default capture pool', color: '#D9D9D9' },
        { id: `${activeUserId}-feature-film`, name: 'Feature Film', description: 'screenplay prep', color: '#DD400A' },
        { id: `${activeUserId}-journal`, name: 'Journal', description: 'daily thoughts', color: '#141414' },
      ];

      const defaultNotes: Note[] = [];

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
          setNotes([]);
          localStorage.setItem('draft_notes', JSON.stringify([]));
        }
      } else {
        const supabase = createClient();
        
        let { data: bundlesData } = await supabase.from('bundles').select('*');
        if (!bundlesData || bundlesData.length === 0) {
          await supabase.from('bundles').insert(defaultBundles);
          setBundles(defaultBundles);
        } else {
          setBundles(bundlesData);
        }

        let { data: notesData } = await supabase.from('notes').select('*');
        if (!notesData || notesData.length === 0) {
          setNotes([]);
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

    setBundleName('');
    setBundleDesc('');
    setBundleColor('#DD400A');
    setIsCreateBundleOpen(false);
  };

  const handleAddNote = async () => {
    const newNoteId = 'note-' + Date.now();
    const newNote = {
      id: newNoteId,
      title: 'Untitled',
      content: '',
      bundleId: selectedBundleId || `${userId}-unsorted`,
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
      const { error } = await supabase.from('notes').insert({
        id: newNote.id,
        title: newNote.title,
        content: newNote.content,
        bundle_id: newNote.bundleId,
        grid_span: newNote.gridSpan,
      });
      if (error) {
        console.error("Failed to insert note:", error);
      }
    }

    router.push(`/notes/editor/${newNoteId}`);
  };

  const handleDeleteNoteDirectly = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    const isGuest = localStorage.getItem('draft_guest_mode') === 'true';

    if (isGuest) {
      const localNotes = localStorage.getItem('draft_notes');
      if (localNotes) {
        const notesList = JSON.parse(localNotes);
        const updated = notesList.filter((n: any) => n.id !== id);
        setNotes(updated);
        localStorage.setItem('draft_notes', JSON.stringify(updated));
      }
    } else {
      const supabase = createClient();
      await supabase.from('notes').delete().eq('id', id);
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = starredBundles.includes(id)
      ? starredBundles.filter(bId => bId !== id)
      : [...starredBundles, id];
    setStarredBundles(updated);
    localStorage.setItem('draft_starred_bundles', JSON.stringify(updated));
  };

  const filteredNotes = selectedBundleId
    ? notes.filter(n => n.bundleId === selectedBundleId)
    : notes;

  // Sort bundles in filter dropdown (starred first)
  const sortedBundles = [...bundles].sort((a, b) => {
    const aStar = starredBundles.includes(a.id) ? 1 : 0;
    const bStar = starredBundles.includes(b.id) ? 1 : 0;
    return bStar - aStar;
  });

  return (
    <div className={`flex flex-col min-h-screen bg-transparent py-8 px-6 sm:px-12 md:px-24 w-full relative select-none text-[var(--color-ink)]`}>
      {/* Soft Blurry Metaballs Shader Backdrop */}
      <ShaderCanvas panel={1} opacity={1.0} />
      
      {/* HEADER */}
      <div className="flex justify-between items-center z-40 w-full relative">
        {/* Left Filter Dropdown */}
        <details className="group relative">
          <summary className="list-none cursor-pointer hover:opacity-75 flex items-center justify-center p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors [&::-webkit-details-marker]:hidden" title="Filter bundles">
            <Filter size={20} strokeWidth={1.5} />
          </summary>
          <div className="absolute left-0 top-11 w-64 glass-panel p-5 animate-in fade-in slide-in-from-top-4 duration-200 z-50">
            <div className="flex flex-col space-y-2 max-h-60 overflow-y-auto">
              <button
                onClick={() => setSelectedBundleId(null)}
                className={`text-left px-3 py-2 font-degraded not-italic text-sm uppercase tracking-wider ${!selectedBundleId ? 'bg-black/10 font-bold rounded-lg' : 'hover:bg-black/5 rounded-lg'}`}
              >
                <span className="italic">A</span>LL N<span className="italic">O</span>TES
              </button>
              {sortedBundles.map(b => (
                <div key={b.id} className={`flex items-center justify-between hover:bg-black/5 rounded-lg px-3 py-1 ${selectedBundleId === b.id ? 'bg-black/10 font-bold' : ''}`}>
                  <button
                    onClick={() => setSelectedBundleId(b.id)}
                    className="text-left py-1 font-degraded not-italic text-sm uppercase tracking-wider flex items-center space-x-2 flex-grow truncate"
                  >
                    <span className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ backgroundColor: b.color }} />
                    <span className="truncate">{b.name}</span>
                  </button>
                  <button onClick={(e) => toggleStar(b.id, e)} className="p-1 hover:scale-110 transition-transform">
                    <Star size={14} className={starredBundles.includes(b.id) ? 'fill-current text-[var(--color-rust)]' : 'opacity-30'} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </details>

        {/* Center Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-degraded italic tracking-tight leading-none">
          notes
        </h1>

        {/* Right Menu Dropdown */}
        <details className="group relative">
          <summary className="list-none cursor-pointer hover:opacity-75 flex items-center justify-center p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors [&::-webkit-details-marker]:hidden" title="Menu options">
            <Menu size={20} strokeWidth={1.5} />
          </summary>
          <div className="absolute right-0 top-11 w-64 glass-panel p-5 animate-in fade-in slide-in-from-top-4 duration-200 z-50">
            <div className="flex flex-col space-y-4">
              <Link
                href="/dashboard"
                className="font-degraded not-italic text-sm tracking-wider hover:opacity-75 block"
              >
                B<span className="italic">A</span>CK TO D<span className="italic">A</span>SHBOARD
              </Link>
              <button
                onClick={() => setIsCreateBundleOpen(true)}
                className="w-full text-left font-degraded not-italic text-sm tracking-wider hover:opacity-75 block"
              >
                CRE<span className="italic">A</span>TE NEW B<span className="italic">U</span>NDLE
              </button>
              <button
                className="w-full text-left font-degraded not-italic text-sm tracking-wider hover:opacity-75 block"
              >
                EXP<span className="italic">O</span>RT <span className="italic">A</span>LL N<span className="italic">O</span>TES
              </button>
            </div>
          </div>
        </details>
      </div>

      {/* BENTO GRID OF NOTES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-16 flex-grow content-start w-full z-20">
        {filteredNotes.map((note) => {
          const bundle = bundles.find(b => b.id === note.bundleId);
          const blockColor = bundle?.color || '#D9D9D9';
          
          const isDarkCard = blockColor === '#141414';
          const cardBgClass = isDarkCard 
            ? 'bg-[#18181b]/95 border-white/5 shadow-2xl text-white' 
            : 'bg-white/95 border-black/5 shadow-lg text-[var(--color-ink)]';

          const isDarkBg = blockColor === '#141414' || blockColor === '#DD400A';
          const textColor = isDarkBg ? 'text-white' : 'text-[var(--color-ink)]';
          const descColor = isDarkBg ? 'text-white/70' : 'text-[var(--color-muted)]';

          const cleanTextPreview = note.content
            ? note.content.replace(/<[^>]*>/g, ' ').substring(0, 120)
            : 'empty note...';

          const getResponsiveSpan = (span?: string) => {
            if (!span) return 'col-span-1';
            let classes = [];
            if (span.includes('col-span-2')) {
              classes.push('sm:col-span-2 col-span-1');
            } else {
              classes.push('col-span-1');
            }
            if (span.includes('row-span-2')) {
              classes.push('sm:row-span-2 row-span-1');
            } else {
              classes.push('row-span-1');
            }
            return classes.join(' ');
          };

          const heightClass = note.gridSpan?.includes('row-span-2') 
            ? 'h-[220px] sm:h-[588px]' 
            : 'h-[220px] sm:h-[280px]';

          return (
            <div
              key={note.id}
              className={`relative group rounded-[28px] overflow-hidden border transition-all duration-300 hover:translate-y-[-3px] ${getResponsiveSpan(note.gridSpan)} ${heightClass} ${cardBgClass}`}
            >
              {/* Card content linking to editor */}
              <Link
                href={`/notes/editor/${note.id}`}
                className="absolute inset-0 p-8 flex flex-col justify-between z-10"
              >
                {/* Colored Glow Orb mimicking the Variant Aura visual style */}
                <div 
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-[0.15] z-0 animate-pulse duration-3000"
                  style={{ 
                    background: `radial-gradient(circle, ${blockColor} 0%, transparent 70%)`,
                    filter: 'blur(12px)'
                  }}
                />
                
                {/* Top Info */}
                <div className="flex justify-between items-start z-10 w-full pr-8">
                  <span className={`text-[10px] font-sans font-semibold tracking-widest uppercase opacity-60 ${isDarkCard ? 'text-white' : 'text-[var(--color-ink)]'}`}>
                    {bundle?.name || 'unsorted'}
                  </span>
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: blockColor }} 
                  />
                </div>

                {/* Bottom Title & Content */}
                <div className="mt-8 flex-grow flex flex-col justify-end z-10 w-full">
                  <h3 className={`text-xl md:text-2xl font-serif font-semibold tracking-wide leading-snug line-clamp-2 ${isDarkCard ? 'text-white' : 'text-[var(--color-ink)]'}`}>
                    {note.title || 'UNTITLED'}
                  </h3>
                  <p className={`text-xs md:text-sm mt-3 line-clamp-3 font-serif opacity-75 leading-relaxed ${isDarkCard ? 'text-white/80' : 'text-[var(--color-muted)]'}`}>
                    {cleanTextPreview}
                  </p>
                </div>
              </Link>

              {/* Note options menu (delete button) */}
              <CardMenu 
                noteId={note.id} 
                isDarkCard={isDarkCard} 
                onDelete={() => handleDeleteNoteDirectly(note.id)} 
              />
            </div>
          );
        })}
      </div>

      {/* FLOATING ACTION: ADD NOTE */}
      <div className="flex justify-center pt-12 pb-6 z-30">
        <button
          onClick={handleAddNote}
          className="text-xs font-sans tracking-widest uppercase hover:opacity-75 transition-all border border-black/15 dark:border-white/15 rounded-full px-5 py-2.5 font-medium glass-panel"
        >
          + Add Note
        </button>
      </div>

      {/* BUNDLE CREATION MODAL */}
      {isCreateBundleOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-8 max-w-md w-full relative text-[var(--color-ink)] animate-in zoom-in-95 duration-200">
            <h3 className="font-degraded italic text-2xl mb-6">Create New Bundle</h3>
            <form onSubmit={handleCreateBundle} className="flex flex-col space-y-4">
              <input 
                type="text"
                placeholder="bundle name"
                value={bundleName}
                onChange={(e) => setBundleName(e.target.value)}
                required
                className="w-full h-[35px] px-4 rounded-full text-center text-xs font-normal glass-panel-dark text-white focus:outline-none placeholder:text-center placeholder:text-white/50 placeholder:text-xs outline-none"
              />
              <textarea 
                placeholder="description (optional)"
                value={bundleDesc}
                onChange={(e) => setBundleDesc(e.target.value)}
                className="w-full px-4 py-2 rounded-2xl text-center text-xs font-normal glass-panel-dark text-white focus:outline-none placeholder:text-center placeholder:text-white/50 placeholder:text-xs h-20 resize-none outline-none"
              />
              <div className="flex flex-col space-y-2">
                <span className="text-xs uppercase tracking-widest opacity-80">Color Tag</span>
                <div className="flex space-x-3">
                  {['#DD400A', '#141414', '#D9D9D9', '#3B82F6', '#FBBF24'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBundleColor(color)}
                      className={`w-8 h-8 transition-transform rounded-full ${bundleColor === color ? 'border-2 border-black scale-110' : 'border border-white/20'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateBundleOpen(false)}
                  className="font-degraded not-italic text-sm uppercase tracking-wider hover:opacity-75"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="font-degraded font-bold text-sm uppercase tracking-wider hover:opacity-75"
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

function CardMenu({ noteId, isDarkCard, onDelete }: { noteId: string; isDarkCard: boolean; onDelete: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute right-4 top-6 z-30 no-print">
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(!open);
        }}
        className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-60 hover:opacity-100 ${
          isDarkCard ? 'text-white' : 'text-[var(--color-ink)]'
        }`}
        title="Note options"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setOpen(false);
            }}
          />
          <div className={`absolute right-0 top-8 w-36 py-1.5 shadow-xl z-50 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-150 ${
            isDarkCard 
              ? 'bg-zinc-900 border-white/10 text-white' 
              : 'bg-white border-black/10 text-zinc-900'
          }`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setOpen(false);
                onDelete();
              }}
              className="w-full text-left px-4 py-2 text-xs font-sans font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              Delete Note
            </button>
          </div>
        </>
      )}
    </div>
  );
}
