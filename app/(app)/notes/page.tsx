'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Star, MoreHorizontal, Filter, Menu } from 'lucide-react';
import ShaderCanvas from '@/components/ShaderCanvas';
import IconButton from '@/components/ui/IconButton';
import SkeletonCard from '@/components/ui/SkeletonCard';
import type { SupabaseNote } from '@/lib/api';

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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Form states for new bundle
  const [bundleName, setBundleName] = useState('');
  const [bundleDesc, setBundleDesc] = useState('');
  const [bundleColor, setBundleColor] = useState('#DD400A'); // default rust

  // State loaded from localStorage or Supabase
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const [starredBundles, setStarredBundles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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
        
        const { data: bundlesData } = await supabase.from('bundles').select('*');
        if (!bundlesData || bundlesData.length === 0) {
          await supabase.from('bundles').insert(defaultBundles);
          setBundles(defaultBundles);
        } else {
          setBundles(bundlesData);
        }

        const { data: notesData } = await supabase.from('notes').select('*');
        if (!notesData || notesData.length === 0) {
          setNotes([]);
        } else {
          const mappedNotes = notesData.map((n: SupabaseNote) => ({
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

    loadData().finally(() => setLoading(false));
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
      // ponytail: omit bundle_id — FK constraint fails if bundle row doesn't exist yet. DB allows null.
      const { error } = await supabase.from('notes').insert({
        id: newNote.id,
        title: newNote.title,
        content: newNote.content,
        grid_span: newNote.gridSpan,
      });
      if (error) {
        console.error("Failed to insert note:", error);
        return; // Don't navigate to editor for a note that doesn't exist
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
        const notesList: Note[] = JSON.parse(localNotes);
        const updated = notesList.filter(n => n.id !== id);
        setNotes(updated);
        localStorage.setItem('draft_notes', JSON.stringify(updated));
      }
    } else {
      const supabase = createClient();
      await supabase.from('notes').delete().eq('id', id);
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  const handleExportAllNotes = async () => {
    setIsMenuOpen(false);
    try {
      let exportedNotes: unknown[];
      let exportedBundles: unknown[];

      if (localStorage.getItem('draft_guest_mode') === 'true') {
        exportedNotes = JSON.parse(localStorage.getItem('draft_notes') || '[]');
        exportedBundles = JSON.parse(localStorage.getItem('draft_bundles') || '[]');
      } else {
        const supabase = createClient();
        const fetchAll = async (table: 'notes' | 'bundles') => {
          const rows: unknown[] = [];
          for (let start = 0; ; start += 1000) {
            const { data, error } = await supabase.from(table).select('*').range(start, start + 999);
            if (error) throw error;
            rows.push(...(data || []));
            if (!data || data.length < 1000) break;
          }
          return rows;
        };
        [exportedNotes, exportedBundles] = await Promise.all([fetchAll('notes'), fetchAll('bundles')]);
      }

      const blob = new Blob([JSON.stringify({
        format: 'draft-notes-v1',
        exported_at: new Date().toISOString(),
        bundles: exportedBundles,
        notes: exportedNotes,
      }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `draft-notes-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Failed to export notes:', error);
      alert('Could not export notes. Please try again.');
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
    <div className={`flex flex-col min-h-[100dvh] bg-transparent py-8 px-6 sm:px-12 md:px-24 w-full relative select-none text-[var(--color-ink)]`}>
      {/* Soft Blurry Metaballs Shader Backdrop */}
      <ShaderCanvas panel={1} opacity={1.0} />
      
      {/* HEADER */}
      <div className="flex justify-between items-center z-40 w-full relative">
        {/* Left Filter Dropdown */}
        <div className="relative">
          <IconButton
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            aria-label="Filter bundles"
            aria-expanded={isFilterOpen}
            data-testid="filter-button"
            className="text-[var(--color-ink)]"
          >
            <Filter size={20} strokeWidth={1.5} />
          </IconButton>
          {isFilterOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setIsFilterOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1 w-64 glass-panel glass-panel-light p-5 animate-in fade-in slide-in-from-top-4 duration-200 z-50 text-[var(--color-ink)]">
                <div className="flex flex-col space-y-2 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedBundleId(null);
                      setIsFilterOpen(false);
                    }}
                    className={`text-left px-3 py-2 font-degraded not-italic text-sm uppercase tracking-wider ${!selectedBundleId ? 'bg-black/10 font-bold rounded-[2px]' : 'hover:bg-black/5 rounded-[2px]'}`}
                  >
                    <span className="italic">A</span>LL N<span className="italic">O</span>TES
                  </button>
                  {sortedBundles.map(b => (
                    <div key={b.id} className={`flex items-center justify-between hover:bg-black/5 rounded-[2px] px-3 py-1 ${selectedBundleId === b.id ? 'bg-black/10 font-bold' : ''}`}>
                      <button
                        onClick={() => {
                          setSelectedBundleId(b.id);
                          setIsFilterOpen(false);
                        }}
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
            </>
          )}
        </div>

        {/* Center Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-degraded italic tracking-tight leading-none">
          notes
        </h1>

        {/* Right Menu Dropdown */}
        <div className="relative">
          <IconButton
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu options"
            aria-expanded={isMenuOpen}
            data-testid="menu-button"
            className="text-[var(--color-ink)]"
          >
            <Menu size={20} strokeWidth={1.5} />
          </IconButton>
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-64 glass-panel glass-panel-light p-5 animate-in fade-in slide-in-from-top-4 duration-200 z-50 text-[var(--color-ink)]">
                <div className="flex flex-col space-y-4">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="font-degraded not-italic text-sm tracking-wider hover:opacity-75 block"
                  >
                    B<span className="italic">A</span>CK TO D<span className="italic">A</span>SHBOARD
                  </Link>
                  <button
                    onClick={() => {
                      setIsCreateBundleOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left font-degraded not-italic text-sm tracking-wider hover:opacity-75 block"
                  >
                    CRE<span className="italic">A</span>TE NEW B<span className="italic">U</span>NDLE
                  </button>
                  <button
                    onClick={handleExportAllNotes}
                    className="w-full text-left font-degraded not-italic text-sm tracking-wider hover:opacity-75 block"
                  >
                    EXP<span className="italic">O</span>RT <span className="italic">A</span>LL N<span className="italic">O</span>TES
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* BENTO GRID OF NOTES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-16 flex-grow content-start w-full z-20">
        {/* Loading skeletons */}
        {loading && [0,1,2,3,4,5].map(i => (
          <SkeletonCard key={`skel-${i}`} className="h-[220px] sm:h-[280px] col-span-1" />
        ))}

        {/* Empty state */}
        {!loading && filteredNotes.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
            <p className="text-lg font-serif opacity-40">No notes yet</p>
            <p className="text-sm text-[var(--color-muted)] mt-2 opacity-60">Tap &quot;+ Add Note&quot; below to create your first note</p>
          </div>
        )}

        {!loading && filteredNotes.map((note, index) => {
          const bundle = bundles.find(b => b.id === note.bundleId);
          const blockColor = bundle?.color || '#D9D9D9';
          
          const isDarkColor = ['#141414', '#DD400A', '#1F4B4A', '#A9765A'].includes(blockColor);
          const cardTextColor = isDarkColor ? 'text-white' : 'text-[var(--color-ink)]';
          const cardBorderColor = isDarkColor ? 'border-white/10' : 'border-black/10';
          const cardDescColor = isDarkColor ? 'text-white/70' : 'text-[var(--color-muted)]';

          const cleanTextPreview = note.content
            ? note.content.replace(/<[^>]*>/g, ' ').substring(0, 120)
            : 'empty note...';

          const getResponsiveSpan = (span?: string) => {
            if (!span) return 'col-span-1';
            const classes = [];
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
              className={`animate-stagger-fade relative group rounded-[2px] overflow-hidden border transition-all duration-300 hover:translate-y-[-3px] ${getResponsiveSpan(note.gridSpan)} ${heightClass} ${cardTextColor} ${cardBorderColor}`}
              style={{ 
                animationDelay: `${index * 60}ms`,
                backgroundColor: blockColor 
              }}
              aria-label={`Open note: ${note.title || 'Untitled'}`}
              data-testid={`note-card-${note.id}`}
            >
              {/* Tiling photographic grain overlay inside the card */}
              <div 
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.06] mix-blend-overlay bg-cover bg-center"
                style={{ 
                  backgroundImage: `url(${isDarkColor ? '/assets/grain-ink.jpg' : '/assets/grain-rust.jpg'})`
                }}
              />

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
                  <span className={`text-[10px] font-sans font-semibold tracking-widest uppercase opacity-60 ${cardTextColor}`}>
                    {bundle?.name || 'unsorted'}
                  </span>
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-current/25" 
                    style={{ backgroundColor: blockColor }} 
                  />
                </div>

                {/* Bottom Title & Content */}
                <div className="mt-8 flex-grow flex flex-col justify-end z-10 w-full">
                  <h3 className={`text-xl md:text-2xl font-serif font-semibold tracking-wide leading-snug line-clamp-2 ${cardTextColor}`}>
                    {note.title || 'UNTITLED'}
                  </h3>
                  <p className={`text-xs md:text-sm mt-3 line-clamp-3 font-serif leading-relaxed ${cardDescColor}`}>
                    {cleanTextPreview}
                  </p>
                </div>
              </Link>

              {/* Note options menu (delete button) */}
              <CardMenu 
                noteId={note.id} 
                isDarkCard={isDarkColor} 
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
          aria-label="Create new note"
          data-testid="add-note-button"
          className="text-xs font-sans tracking-widest uppercase rounded-[2px] px-5 py-2.5 font-medium glass-btn"
        >
          + A<span className="italic">d</span>d N<span className="italic">o</span>te
        </button>
      </div>

      {/* BUNDLE CREATION MODAL */}
      {isCreateBundleOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-8 max-w-md w-full relative text-[var(--color-ink)] animate-in zoom-in-95 duration-200 rounded-[2px] border-none">
            <h3 className="font-degraded italic text-2xl mb-6">Create New Bundle</h3>
            <form onSubmit={handleCreateBundle} className="flex flex-col space-y-4">
              <input 
                type="text"
                placeholder="bundle name"
                value={bundleName}
                onChange={(e) => setBundleName(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-[2px] text-center text-xs font-normal bg-[#D9D9D9] text-[#141414] border-none outline-none placeholder:text-zinc-500 transition-all focus-visible:ring-2 focus-visible:ring-[#DD400A]"
              />
              <textarea 
                placeholder="description (optional)"
                value={bundleDesc}
                onChange={(e) => setBundleDesc(e.target.value)}
                className="w-full px-4 py-2 rounded-[2px] text-center text-xs font-normal bg-[#D9D9D9] text-[#141414] border-none outline-none placeholder:text-zinc-500 h-20 resize-none transition-all focus-visible:ring-2 focus-visible:ring-[#DD400A]"
              />
              <div className="flex flex-col space-y-2">
                <span className="text-xs uppercase tracking-widest opacity-80">Color Tag</span>
                <div className="flex space-x-3">
                  {['#DD400A', '#141414', '#A9765A', '#1F4B4A', '#A9812E'].map((color) => (
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
                  C<span className="italic">a</span>n<span className="italic">c</span>el
                </button>
                <button
                  type="submit"
                  className="font-degraded font-bold text-sm uppercase tracking-wider hover:opacity-75"
                >
                  C<span className="italic">r</span>e<span className="italic">a</span>te
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
        className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[2px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-40 hover:opacity-100 ${
          isDarkCard ? 'text-white' : 'text-[var(--color-ink)]'
        }`}
        aria-label="Note options"
        data-testid={`note-menu-${noteId}`}
      >
        <MoreHorizontal size={18} aria-hidden="true" />
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
          <div className={`absolute right-0 top-8 w-36 py-1.5 shadow-xl z-50 rounded-[2px] border animate-in fade-in slide-in-from-top-2 duration-150 ${
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
