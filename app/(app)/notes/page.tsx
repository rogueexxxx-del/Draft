'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Star } from 'lucide-react';
import { BentoCardGrid, GlobalSpotlight, ParticleCard } from '@/components/MagicBento';
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
        
        let { data: bundlesData } = await supabase.from('bundles').select('*');
        if (!bundlesData || bundlesData.length === 0) {
          await supabase.from('bundles').insert(defaultBundles);
          setBundles(defaultBundles);
        } else {
          setBundles(bundlesData);
        }

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
    <div className={`flex flex-col min-h-screen bg-transparent py-8 px-12 md:px-24 w-full relative select-none text-[var(--color-ink)]`}>
      {/* Soft Blurry Metaballs Shader Backdrop */}
      <ShaderCanvas panel={1} opacity={1.0} />
      
      {/* HEADER */}
      <div className="flex justify-between items-start z-40 w-full relative">
        {/* Left Filter Dropdown */}
        <details className="group relative">
          <summary className="list-none cursor-pointer font-degraded not-italic text-lg md:text-xl tracking-wider uppercase hover:opacity-75">
            filter
          </summary>
          <div className="absolute left-0 top-10 w-64 glass-panel p-5 animate-in fade-in slide-in-from-top-4 duration-200 z-50">
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
        <h1 className="text-6xl md:text-7xl font-degraded italic tracking-tight leading-none mt-[-8px]">
          notes
        </h1>

        {/* Right Menu Dropdown */}
        <details className="group relative">
          <summary className="list-none cursor-pointer font-degraded not-italic text-lg md:text-xl tracking-wider uppercase hover:opacity-75">
            menu
          </summary>
          <div className="absolute right-0 top-10 w-64 glass-panel p-5 animate-in fade-in slide-in-from-top-4 duration-200 z-50">
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
      <BentoCardGrid gridRef={gridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-16 flex-grow content-start w-full z-20">
        <GlobalSpotlight
          gridRef={gridRef}
          glowColor={selectedBundleId ? hexToRgbString(bundles.find(b => b.id === selectedBundleId)?.color || '#D9D9D9') : '132, 0, 255'}
          spotlightRadius={300}
        />
        {filteredNotes.map((note) => {
          const bundle = bundles.find(b => b.id === note.bundleId);
          const blockColor = bundle?.color || '#D9D9D9';
          
          const isDarkCard = blockColor === '#141414';
          const cardBg = isDarkCard ? 'rgba(28, 28, 30, 0.65)' : 'rgba(245, 245, 247, 0.65)';
          const rgbColorString = hexToRgbString(blockColor);

          // Reverse text color logic for clear bento grid display
          const isDarkBg = blockColor === '#141414' || blockColor === '#DD400A';
          const textColor = isDarkBg ? 'text-[var(--color-surface)]' : 'text-[var(--color-ink)]';
          const descColor = isDarkBg ? 'text-[var(--color-surface)]/70' : 'text-[var(--color-muted)]';

          const cleanTextPreview = note.content
            ? note.content.replace(/<[^>]*>/g, ' ').substring(0, 120)
            : 'empty note...';

          const getResponsiveSpan = (span?: string) => {
            if (!span) return 'col-span-1 row-span-1';
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

          return (
            <Link
              key={note.id}
              href={`/notes/editor/${note.id}`}
              className={`block transition-all duration-200 hover:scale-[1.01] ${getResponsiveSpan(note.gridSpan)}`}
            >
              <ParticleCard
                glowColor={rgbColorString}
                className="p-8 flex flex-col justify-between magic-bento-card magic-bento-card--border-glow rounded-[28px] overflow-hidden w-full h-full"
                style={{ backgroundColor: cardBg, '--glow-color': rgbColorString } as any}
                enableTilt={false}
                clickEffect={true}
                enableMagnetism={false}
                particleCount={6}
              >
                {/* Colored Glow Orb mimicking the Variant Aura visual style */}
                <div 
                  className="absolute top-[-30px] right-[-30px] w-32 h-32 rounded-full pointer-events-none opacity-45 z-0"
                  style={{ 
                    background: isDarkCard 
                      ? 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)' 
                      : `radial-gradient(circle, ${blockColor} 0%, transparent 70%)`,
                    filter: 'blur(20px)'
                  }}
                />
                <span className={`text-xs font-sans tracking-widest uppercase ${descColor} z-10`}>
                  {bundle?.name || 'unsorted'}
                </span>
                <div className="mt-6 flex-grow flex flex-col justify-end z-10">
                  <h3 className={`text-2xl font-serif not-italic font-normal ${textColor} truncate z-10`}>
                    {note.title}
                  </h3>
                  <p className={`text-sm mt-2 line-clamp-3 font-serif ${descColor} z-10`}>
                    {cleanTextPreview}
                  </p>
                </div>
              </ParticleCard>
            </Link>
          );
        })}
      </BentoCardGrid>

      {/* FLOATING ACTION: ADD NOTE */}
      <div className="flex justify-center pt-12 pb-6 z-30">
        <button
          onClick={handleAddNote}
          className="text-2xl font-serif not-italic hover:opacity-75 transition-all glass-panel px-8 py-4"
        >
          + <span className="italic">A</span>DD NOTE
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
