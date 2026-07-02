'use client';

import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import tippy from 'tippy.js';
import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { MoreHorizontal, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toJpeg } from 'html-to-image';

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
    <div className="bg-[var(--color-surface)] border border-[var(--color-ink)] p-2 flex flex-col shadow-lg z-50 min-w-[200px] select-none no-print">
      {props.items.length ? (
        props.items.map((item: any, index: number) => (
          <button
            className={`text-left px-3 py-2 font-degraded not-italic text-sm uppercase tracking-wider ${
              index === selectedIndex ? 'bg-[var(--color-ink)] text-[var(--color-surface)]' : 'text-[var(--color-ink)] bg-transparent'
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
export default function EditorPage({ params }: { params: { id: string } }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

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

  const handleSave = () => {
    alert('Note saved explicitly!');
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
    try {
      // Temporarily hide elements to prevent them from showing up in the screenshot
      const noPrintElements = document.querySelectorAll('.no-print');
      noPrintElements.forEach((el: any) => {
        el.style.visibility = 'hidden';
      });

      const dataUrl = await toJpeg(pageRef.current, {
        quality: 0.98,
        skipFonts: true, // Prevents custom relative stylesheet font loading failures
        styleSheetFilter: () => false, // Skips stylesheet fetching to avoid relative font path crashes
        style: {
          backgroundAttachment: 'scroll', // fixes background fixed rendering bugs in html-to-image
          backgroundBlendMode: themeBgImage ? themeBlendMode : 'normal',
          filter: themeBgImage ? getFilterStyle() : 'none',
        }
      });

      // Restore elements visibility after capture
      noPrintElements.forEach((el: any) => {
        el.style.visibility = 'visible';
      });

      const link = document.createElement('a');
      link.download = `${title || 'Untitled Note'}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Oops, something went wrong with JPG export!', error);
    }
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
      className={`relative min-h-screen w-full flex flex-col font-degraded not-italic select-none transition-all duration-300 ${textColor}`}
    >
      
      {/* BACKGROUND LAYER (Enables applying grayscale/saturate filter without affecting text inside) */}
      <div 
        className="absolute inset-0 z-0 transition-all duration-300 pointer-events-none"
        style={{
          backgroundColor: themeBgColor,
          backgroundImage: themeBgImage ? `url(${themeBgImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundBlendMode: themeBgImage ? (themeBlendMode as any) : 'normal',
          filter: themeBgImage ? getFilterStyle() : 'none',
        }}
      />

      {/* CONTENT LAYER */}
      <div className="relative z-10 w-full flex-grow flex flex-col py-12 px-12 md:px-24">
        
        {/* Top Bar / Heading block */}
        <div className="flex flex-col items-center w-full mb-12 relative">
          {/* Back Arrow link on Left */}
          <Link 
            href="/notes" 
            className={`absolute left-0 top-3 hover:opacity-75 transition-opacity no-print ${textColor}`}
          >
            <ArrowLeft size={28} strokeWidth={1.5} />
          </Link>

          {/* Bigger Title input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="UNTITLED"
            className={`w-full text-center bg-transparent border-none outline-none text-5xl md:text-6xl font-bold uppercase tracking-wider bg-none focus:ring-0 ${textColor} ${placeholderColor}`}
          />

          {/* Description input */}
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description..."
            className={`w-full text-center bg-transparent border-none outline-none text-lg md:text-xl mt-4 bg-none focus:ring-0 ${mutedTextColor} ${isDarkTheme ? 'placeholder:text-white/30' : 'placeholder:text-black/20'}`}
          />
          
          {/* Three dots settings menu on right */}
          <div className="absolute right-0 top-3 no-print">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className={`p-1 hover:opacity-75 transition-opacity ${textColor}`}
            >
              <MoreHorizontal size={28} strokeWidth={1.5} />
            </button>
            
            {showMenu && (
              <div className={`absolute right-0 mt-2 w-64 shadow-md z-50 flex flex-col p-5 space-y-4 border ${dropdownBg}`}>
                
                {/* THEME SETTINGS (FIRST) */}
                <div className="flex flex-col space-y-3">
                  <span className="font-degraded italic text-sm tracking-wider uppercase">THEME SETTINGS</span>
                  
                  {/* Bg Colors selection */}
                  <div className="flex flex-col space-y-1.5">
                    <span className={`text-[10px] uppercase tracking-widest ${mutedTextColor}`}>bg color</span>
                    <div className="flex space-x-2 pt-1">
                      {[
                        { name: 'white', hex: '#FFFFFF' },
                        { name: 'rust', hex: '#DD400A' },
                        { name: 'ink', hex: '#141414' },
                        { name: 'grey', hex: '#D9D9D9' }
                      ].map((c) => (
                        <button
                          key={c.hex}
                          onClick={() => { setThemeBgColor(c.hex); }}
                          className={`w-7 h-7 border transition-all ${themeBgColor === c.hex ? (isDarkTheme ? 'border-white scale-110' : 'border-black scale-110') : 'border-transparent'}`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Upload Background Image */}
                  <div className="flex flex-col space-y-1.5">
                    <span className={`text-[10px] uppercase tracking-widest ${mutedTextColor}`}>bg image</span>
                    <div className="flex items-center space-x-3 pt-1">
                      <label className="cursor-pointer font-degraded not-italic text-xs underline hover:text-[var(--color-rust)] block">
                        {themeBgImage ? 'CHANGE IMAGE' : 'UPLOAD IMAGE'}
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
                    onClick={() => alert('Exporting MD...')}
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
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Editor Content wrapper (Full width, no squeeze) */}
        <div className="flex-grow w-full relative pt-4">
          <EditorContent editor={editor} />
        </div>

        {/* Save Button */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 no-print">
          <button
            onClick={handleSave}
            className={`flex items-center space-x-2 text-xl font-degraded not-italic hover:underline border px-6 py-3 transition-colors ${btnBg}`}
          >
            <span>+ SAVE NOTE</span>
          </button>
        </div>

      </div>
    </div>
  );
}
