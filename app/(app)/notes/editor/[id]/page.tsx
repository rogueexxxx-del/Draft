'use client';

import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import tippy from 'tippy.js';
import { useState, useEffect, useRef, forwardRef, useImperativeHandle, use } from 'react';
import { MoreHorizontal, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toJpeg } from 'html-to-image';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import IconButton from '@/components/ui/IconButton';
import ShaderCanvas from '@/components/ShaderCanvas';

// --- SLASH COMMAND EXTENSION ---
const CommandList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  const downHandler = () => setSelectedIndex((selectedIndex + 1) % props.items.length);
  const enterHandler = () => selectItem(selectedIndex);

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="glass-panel p-2 flex flex-col shadow-lg z-50 min-w-[200px] select-none no-print">
      {props.items.length ? (
        props.items.map((item: any, index: number) => (
          <button
            className={`text-left px-3 py-2 font-degraded not-italic text-sm uppercase tracking-wider ${
              index === selectedIndex ? 'bg-white/20' : 'bg-transparent hover:bg-white/10'
            }`}
            key={index}
            onClick={() => selectItem(index)}
          >
            {item.title}
          </button>
        ))
      ) : (
        <div className="text-[var(--color-muted)] px-3 py-2 font-degraded not-italic text-sm">No result</div>
      )}
    </div>
  );
});

CommandList.displayName = 'CommandList';

const getSuggestionItems = ({ query }: { query: string }) => {
  return [
    { title: 'Paragraph', command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setParagraph().run(); } },
    { title: 'Heading 1', command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run(); } },
    { title: 'Heading 2', command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(); } },
    { title: 'Bold', command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setMark('bold').run(); } },
    { title: 'Italic', command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setMark('italic').run(); } },
    { title: 'Bullet List', command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleBulletList().run(); } },
    { title: 'Highlight', command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleHighlight().run(); } },
    { 
      title: 'Insert Image', 
      command: ({ editor, range }: any) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              editor.chain().focus().deleteRange(range).setImage({ src: base64 }).run();
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      }
    },
  ].filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 8);
};

const SlashCommands = Extension.create({
  name: 'slashCommands',
  addOptions() { 
    return { 
      suggestion: { 
        char: '/', 
        startOfLine: false, 
        allowedPrefixes: null, 
        command: ({ editor, range, props }: any) => { props.command({ editor, range }); } 
      } 
    }; 
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

// --- EDITOR COMPONENT ---
export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: noteId } = use(params);
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isExporting, setIsExporting] = useState(false);

  // Reference for capturing screenshot / JPG
  const pageRef = useRef<HTMLDivElement>(null);

  // Theme settings states
  const [themeBgColor, setThemeBgColor] = useState('#FFFFFF'); // default surface/white
  const [themeBgImage, setThemeBgImage] = useState<string | null>(null);
  const [themeBlendMode, setThemeBlendMode] = useState<string>('multiply'); // default overlay blend
  const [themeBgSaturation, setThemeBgSaturation] = useState<string>('muted'); // default muted desaturated

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Image,
      Placeholder.configure({
        placeholder: 'start writing........... use / for commands',
        emptyNodeClass: 'is-empty',
      }),
      SlashCommands.configure({
        suggestion: {
          items: getSuggestionItems,
          render: () => {
            let component: any;
            let popup: any;

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(CommandList, { props, editor: props.editor });
                if (!props.clientRect) return;
                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                });
              },
              onUpdate: (props: any) => {
                component?.updateProps(props);
                if (!props.clientRect) return;
                popup?.[0].setProps({ getReferenceClientRect: props.clientRect });
              },
              onKeyDown: (props: any) => {
                if (props.event.key === 'Escape') {
                  popup?.[0].hide();
                  return true;
                }
                return component?.ref?.onKeyDown(props);
              },
              onExit: () => {
                popup?.[0].destroy();
                component?.destroy();
              },
            };
          },
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[50vh] font-degraded not-italic text-lg md:text-xl w-full max-w-none text-current prose prose-truegray dark:prose-invert',
      },
    },
  });

  // Load Note data on mount / editor initialization
  useEffect(() => {
    const loadNote = async () => {
      if (!editor) return;

      const isGuest = localStorage.getItem('draft_guest_mode') === 'true';

      if (isGuest) {
        const localNotes = localStorage.getItem('draft_notes');
        if (localNotes) {
          const notesList = JSON.parse(localNotes);
          const currentNote = notesList.find((n: any) => n.id === noteId);
          if (currentNote) {
            setTitle(currentNote.title || '');
            setDescription(currentNote.description || '');
            editor.commands.setContent(currentNote.content || '');
            
            // Populate theme if present
            if (currentNote.theme_settings) {
              setThemeBgColor(currentNote.theme_settings.themeBgColor || '#FFFFFF');
              setThemeBgImage(currentNote.theme_settings.themeBgImage || null);
              setThemeBlendMode(currentNote.theme_settings.themeBlendMode || 'multiply');
              setThemeBgSaturation(currentNote.theme_settings.themeBgSaturation || 'muted');
            }
          }
        }
      } else {
        const supabase = createClient();
        const { data: note, error } = await supabase
          .from('notes')
          .select('*')
          .eq('id', noteId)
          .single();

        if (note && !error) {
          setTitle(note.title || '');
          setDescription(note.description || '');
          editor.commands.setContent(note.content || '');
          
          if (note.theme_settings) {
            setThemeBgColor(note.theme_settings.themeBgColor || '#FFFFFF');
            setThemeBgImage(note.theme_settings.themeBgImage || null);
            setThemeBlendMode(note.theme_settings.themeBlendMode || 'multiply');
            setThemeBgSaturation(note.theme_settings.themeBgSaturation || 'muted');
          }
        }
      }
    };

    loadNote();
  }, [noteId, editor]);

  const handleSave = async () => {
    setSaveStatus('saving');
    const isGuest = localStorage.getItem('draft_guest_mode') === 'true';
    const contentHtml = editor?.getHTML() || '';
    const themeSettings = {
      themeBgColor,
      themeBgImage,
      themeBlendMode,
      themeBgSaturation,
    };

    if (isGuest) {
      const localNotes = localStorage.getItem('draft_notes');
      const notesList: any[] = localNotes ? JSON.parse(localNotes) : [];
      const noteExists = notesList.some((n: any) => n.id === noteId);
      let updated;
      if (noteExists) {
        updated = notesList.map((n: any) => 
          n.id === noteId 
            ? { 
                ...n, 
                title, 
                description, 
                content: contentHtml, 
                theme_settings: themeSettings,
                updatedAt: new Date().toISOString().split('T')[0] 
              } 
            : n
        );
      } else {
        // Note wasn't in localStorage yet — add it
        updated = [...notesList, {
          id: noteId,
          title,
          description,
          content: contentHtml,
          theme_settings: themeSettings,
          bundleId: 'guest-mock-unsorted',
          updatedAt: new Date().toISOString().split('T')[0],
          gridSpan: 'col-span-1 row-span-1',
        }];
      }
      localStorage.setItem('draft_notes', JSON.stringify(updated));
    } else {
      const supabase = createClient();
      const { error } = await supabase
        .from('notes')
        .update({
          title,
          description,
          content: contentHtml,
          theme_settings: themeSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId);
      if (error) {
        console.error("Failed to save note:", error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
        return;
      }
    }
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    const isGuest = localStorage.getItem('draft_guest_mode') === 'true';
    if (isGuest) {
      const localNotes = localStorage.getItem('draft_notes');
      if (localNotes) {
        const notesList = JSON.parse(localNotes);
        const updated = notesList.filter((n: any) => n.id !== noteId);
        localStorage.setItem('draft_notes', JSON.stringify(updated));
      }
    } else {
      const supabase = createClient();
      const { error } = await supabase.from('notes').delete().eq('id', noteId);
      if (error) {
        console.error("Failed to delete note:", error);
        alert(`Failed to delete note: ${error.message}`);
        return;
      }
    }
    router.push('/notes');
  };

  // Convert uploaded image file to Base64 to prevent canvas taints and HTML-to-Image crashes
  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setThemeBgImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportPDF = () => {
    setShowMenu(false);
    const originalTitle = document.title;
    document.title = title || 'Untitled Note';
    window.print();
    // Restore original document title after print dialog triggers
    document.title = originalTitle;
  };

  const handleExportJPG = async () => {
    setShowMenu(false);
    if (!pageRef.current) return;
    setIsExporting(true);
    // Let state changes render (background attachment changed to scroll so html-to-image captures it)
    await new Promise((resolve) => setTimeout(resolve, 150));
    try {
      const dataUrl = await toJpeg(pageRef.current, {
        quality: 0.98,
        filter: (node) => !node.classList?.contains('no-print'),
      });

      const link = document.createElement('a');
      link.download = `${title || 'Untitled Note'}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Oops, something went wrong with JPG export!', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMD = () => {
    setShowMenu(false);
    const contentHtml = editor?.getHTML() || '';
    
    // Convert basic HTML to standard Markdown format
    const cleanMarkdown = contentHtml
      .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<li>(.*?)<\/li>/g, '- $1\n')
      .replace(/<ul>/g, '')
      .replace(/<\/ul>/g, '\n')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, ''); // strip remaining tags
    
    const fullMD = `# ${title || 'Untitled Note'}\n${description ? `> ${description}\n\n` : ''}${cleanMarkdown}`;
    const blob = new Blob([fullMD], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title || 'Untitled Note'}.md`;
    link.click();
  };

  // Derive dynamic styles based on theme background color to ensure full adaptation
  const isDarkTheme = themeBgColor === '#141414' || themeBgColor === '#DD400A';
  
  const textColor = isDarkTheme ? 'text-[var(--color-surface)]' : 'text-[var(--color-ink)]';
  const mutedTextColor = isDarkTheme ? 'text-white/60' : 'text-[var(--color-muted)]';
  const placeholderColor = isDarkTheme ? 'placeholder:text-white/40' : 'placeholder:text-black/25';
  
  const btnBg = themeBgColor === '#141414' 
    ? 'bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-surface)]' 
    : 'bg-[var(--color-ink)] text-[var(--color-surface)] border-[var(--color-ink)]';

  const dropdownBg = isDarkTheme 
    ? 'bg-[var(--color-ink)] border-[var(--color-surface)] text-[var(--color-surface)]' 
    : 'bg-[var(--color-surface)] border-[var(--color-ink)] text-[var(--color-ink)]';

  const dividerStyle = isDarkTheme ? 'border-white/20' : 'border-[var(--color-input-bg)]';

  // Get CSS filter styling for background image saturation
  const getFilterStyle = () => {
    if (themeBgSaturation === 'bw') return 'grayscale(100%)';
    if (themeBgSaturation === 'muted') return 'saturate(0.3) contrast(1.05)';
    return 'none';
  };

  // Bind theme custom properties to document root so they cascade to body during browser printing
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-bg-color', themeBgColor);
    root.style.setProperty('--theme-bg-image', themeBgImage ? `url(${themeBgImage})` : 'none');
    root.style.setProperty('--theme-blend-mode', themeBgImage ? themeBlendMode : 'normal');
    root.style.setProperty('--theme-filter', themeBgImage ? getFilterStyle() : 'none');

    return () => {
      root.style.removeProperty('--theme-bg-color');
      root.style.removeProperty('--theme-bg-image');
      root.style.removeProperty('--theme-blend-mode');
      root.style.removeProperty('--theme-filter');
    };
  }, [themeBgColor, themeBgImage, themeBlendMode, themeBgSaturation]);

  return (
    <div 
      ref={pageRef}
      className={`relative min-h-[100dvh] w-full flex flex-col font-degraded not-italic transition-all duration-300 ${textColor}`}
    >
      
      {/* Generative background shader adaptively colored by note theme when no custom image is selected */}
      {!themeBgImage && (
        <ShaderCanvas 
          panel={1} 
          theme={themeBgColor === '#141414' ? 'dark' : themeBgColor === '#DD400A' ? 'rust' : 'light'} 
          opacity={0.7} 
        />
      )}
      
      {/* BACKGROUND LAYER (Enables applying grayscale/saturate filter without affecting text inside) */}
      <div 
        className="absolute inset-0 z-0 transition-all duration-300 pointer-events-none"
        style={{
          backgroundColor: themeBgColor,
          backgroundImage: themeBgImage ? `url(${themeBgImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: isExporting ? 'scroll' : 'fixed',
          backgroundBlendMode: themeBgImage ? (themeBlendMode as any) : 'normal',
          filter: themeBgImage ? getFilterStyle() : 'none',
        }}
      />

      {/* CONTENT LAYER */}
      <div className="relative z-10 w-full flex-grow flex flex-col py-12 px-6 sm:px-12 md:px-24">
        
        {/* Top Bar / Heading block */}
        <div className="flex justify-between items-center w-full mb-12 gap-4 relative z-40">
          {/* Back Arrow link on Left */}
          <Link href="/notes" className="no-print shrink-0">
            <IconButton
              onClick={() => {}}
              aria-label="Back to notes"
              data-testid="editor-back"
              className={textColor}
            >
              <ArrowLeft size={20} strokeWidth={1.5} />
            </IconButton>
          </Link>

          {/* Centered Title input & Description info */}
          <div className="flex-grow flex flex-col items-center justify-center min-w-0 text-center">
            {/* Title input */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="UNTITLED"
              aria-label="Note title"
              data-testid="editor-title"
              className={`w-full text-center bg-transparent border-none outline-none text-2xl sm:text-4xl md:text-5xl font-bold uppercase tracking-wider bg-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-[var(--color-rust)] rounded-lg ${textColor} ${placeholderColor} min-w-0`}
            />

            {/* Description input */}
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ADD DESCRIPTION"
              aria-label="Note description"
              data-testid="editor-description"
              className={`w-full text-center bg-transparent border-none outline-none text-xs sm:text-sm mt-1.5 uppercase tracking-wide focus:ring-0 focus-visible:ring-2 focus-visible:ring-[var(--color-rust)] rounded-lg font-serif ${mutedTextColor} ${placeholderColor} min-w-0`}
            />
          </div>

          {/* Settings Hamburger Button on Right */}
          <div className="relative shrink-0 no-print">
            <IconButton
              onClick={() => setShowMenu(!showMenu)} 
              aria-label="Note settings"
              aria-expanded={showMenu}
              data-testid="editor-settings"
              className={textColor}
            >
              <MoreHorizontal size={20} strokeWidth={1.5} />
            </IconButton>

            {/* SETTINGS PANEL DROPDOWN */}
            {showMenu && (
              <>
                {/* Click-away backdrop */}
                <div 
                  className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1.5px] no-print" 
                  onClick={() => setShowMenu(false)}
                />
                <div className={`absolute right-0 top-10 w-72 max-w-[calc(100vw-32px)] p-6 shadow-2xl z-50 flex flex-col space-y-5 animate-in fade-in slide-in-from-top-3 duration-150 rounded-[24px] border ${
                  isDarkTheme 
                    ? 'bg-[#18181b] border-white/10 text-white' 
                    : 'bg-white border-black/10 text-[var(--color-ink)]'
                }`}>
                  
                  {/* THEME CONFIGURATORS (FIRST) */}
                  <div className="flex flex-col space-y-4">
                    <span className="font-degraded italic text-sm tracking-wider uppercase">NOTE THEME</span>
                    
                    {/* Color presets selection */}
                    <div className="flex flex-col space-y-2">
                      <span className={`text-[10px] uppercase tracking-widest ${mutedTextColor}`}>background fill</span>
                      <div className="flex space-x-3">
                        {['#FFFFFF', '#141414', '#DD400A'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setThemeBgColor(color)}
                            className={`w-8 h-8 transition-transform border ${
                              themeBgColor === color 
                                ? isDarkTheme ? 'border-white scale-110' : 'border-black scale-110' 
                                : 'border-transparent hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Local Background image upload */}
                    <div className="flex flex-col space-y-2">
                      <span className={`text-[10px] uppercase tracking-widest ${mutedTextColor}`}>background image</span>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center justify-center p-2.5 border border-dashed border-current hover:opacity-75 transition-opacity cursor-pointer">
                          <Plus size={16} className="mr-1" />
                          <span className="font-degraded not-italic text-[10px] uppercase tracking-wider">UPLOAD</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleBgImageUpload} 
                            className="hidden" 
                          />
                        </label>
                        {themeBgImage && (
                          <button
                            type="button"
                            onClick={() => setThemeBgImage(null)}
                            className="font-degraded not-italic text-xs text-red-500 underline hover:opacity-75"
                          >
                            REMOVE
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Image Adjustments (Only shown if bg image is uploaded) */}
                    {themeBgImage && (
                      <div className="flex flex-col space-y-3 pt-2.5 border-t border-current/10">
                        {/* Blend mode settings */}
                        <div className="flex flex-col space-y-1.5">
                          <span className={`text-[10px] uppercase tracking-widest ${mutedTextColor}`}>overlay blend</span>
                          <div className="flex space-x-2 text-xs">
                            {['multiply', 'overlay', 'normal'].map((mode) => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => setThemeBlendMode(mode)}
                                className={`font-degraded uppercase tracking-wide underline ${themeBlendMode === mode ? 'font-bold opacity-100' : 'opacity-50 hover:opacity-80'}`}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Grayscale / Saturation settings */}
                        <div className="flex flex-col space-y-1.5">
                          <span className={`text-[10px] uppercase tracking-widest ${mutedTextColor}`}>saturation</span>
                          <div className="flex space-x-3 text-xs">
                            {[
                              { name: 'color', label: 'COLOR' },
                              { name: 'muted', label: 'MUTED' },
                              { name: 'bw', label: 'B&W' }
                            ].map((sat) => (
                              <button
                                key={sat.name}
                                type="button"
                                onClick={() => setThemeBgSaturation(sat.name)}
                                className={`font-degraded uppercase tracking-wide underline ${themeBgSaturation === sat.name ? 'font-bold opacity-100' : 'opacity-50 hover:opacity-80'}`}
                              >
                                {sat.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DIVIDER */}
                  <hr className={`border ${dividerStyle}`} />

                  {/* EXPORT SETTINGS (SECOND) */}
                  <div className="flex flex-col space-y-3">
                    <span className="font-degraded italic text-sm tracking-wider uppercase">EXPORT SETTINGS</span>
                    <button 
                      onClick={handleExportMD}
                      className="text-left font-degraded not-italic text-xs tracking-wider hover:underline block"
                    >
                      EXP<span className="italic">O</span>RT .MD
                    </button>
                    <button 
                      onClick={handleExportPDF}
                      className="text-left font-degraded not-italic text-xs tracking-wider hover:underline block"
                    >
                      EXP<span className="italic">O</span>RT .PDF
                    </button>
                    <button 
                      onClick={handleExportJPG}
                      className="text-left font-degraded not-italic text-xs tracking-wider hover:underline block"
                    >
                      EXP<span className="italic">O</span>RT .JPG
                    </button>
                    <hr className={`border ${dividerStyle}`} />
                    <button 
                      onClick={handleDelete}
                      className="text-left font-degraded not-italic text-xs tracking-wider text-red-500 hover:underline block"
                    >
                      DELETE NOTE
                    </button>
                  </div>

                </div>
              </>
            )}
          </div>
        </div>

        {/* Editor Content wrapper (Full width, no squeeze) */}
        <div className="flex-grow w-full relative pt-4 pb-20">
          <div className="p-6 sm:p-10 min-h-[60vh]">
            <EditorContent editor={editor} />
          </div>
        </div>

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 no-print flex items-center gap-3">
          <button
            onClick={handleSave}
            aria-label="Save note"
            data-testid="save-note-button"
            className="text-xs font-sans tracking-widest uppercase rounded-full px-5 py-2.5 font-medium glass-btn"
          >
            {saveStatus === 'saving' ? (
              <>S<span className="italic">a</span>v<span className="italic">i</span>ng...</>
            ) : saveStatus === 'saved' ? (
              <>S<span className="italic">a</span>v<span className="italic">e</span>d</>
            ) : saveStatus === 'error' ? (
              <>E<span className="italic">r</span>r<span className="italic">o</span>r</>
            ) : (
              <>+ S<span className="italic">a</span>v<span className="italic">e</span> N<span className="italic">o</span>te</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
