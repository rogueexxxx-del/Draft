'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FilePlus2, Printer, Save, Trash2 } from 'lucide-react';
import StudioShell from '@/components/StudioShell';
import { createCreativeItem, deleteCreativeItem, listCreativeItems, saveCreativeItem, type CreativeItem } from '@/lib/creative';

type ScriptData = Record<string, unknown> & { body: string };

export default function ScriptPage() {
  const [items, setItems] = useState<CreativeItem<ScriptData>[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listCreativeItems<ScriptData>('script').then(found => {
      setItems(found);
      if (found[0]) {
        setActiveId(found[0].id);
        setTitle(found[0].title);
        setBody(found[0].data.body || '');
      }
    }).catch(err => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const active = items.find(item => item.id === activeId);
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  async function saveCurrent() {
    if (!active || !dirty) return true;
    if (!title.trim()) {
      setError('Give this script a title before saving.');
      return false;
    }
    setSaving(true);
    setError('');
    try {
      const saved = await saveCreativeItem({ ...active, title: title.trim(), data: { body } });
      setItems(current => current.map(item => item.id === saved.id ? saved : item));
      setDirty(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save script.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function selectScript(item: CreativeItem<ScriptData>) {
    if (item.id === activeId) return;
    if (!(await saveCurrent())) return;
    setActiveId(item.id);
    setTitle(item.title);
    setBody(item.data.body || '');
    setDirty(false);
  }

  async function newScript() {
    if (!(await saveCurrent())) return;
    setError('');
    try {
      const created = await createCreativeItem('script', 'Untitled script', { body: '' });
      setItems(current => [created, ...current]);
      setActiveId(created.id);
      setTitle(created.title);
      setBody('');
      setDirty(false);
      requestAnimationFrame(() => editorRef.current?.focus());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create script.');
    }
  }

  async function removeScript() {
    if (!active || !window.confirm(`Delete “${active.title}”? This cannot be undone.`)) return;
    try {
      await deleteCreativeItem(active.id);
      const remaining = items.filter(item => item.id !== active.id);
      setItems(remaining);
      setActiveId(remaining[0]?.id || null);
      setTitle(remaining[0]?.title || '');
      setBody(remaining[0]?.data.body || '');
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete script.');
    }
  }

  function insertText(text: string) {
    const editor = editorRef.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const prefix = start > 0 && body[start - 1] !== '\n' ? '\n\n' : '';
    const next = body.slice(0, start) + prefix + text + body.slice(end);
    setBody(next);
    setDirty(true);
    requestAnimationFrame(() => {
      editor.focus();
      editor.setSelectionRange(start + prefix.length + text.length, start + prefix.length + text.length);
    });
  }

  function download() {
    if (!active) return;
    const blob = new Blob([`${title.trim() || 'Untitled script'}\n\n${body}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(title.trim() || 'Untitled script').replace(/[\\/:*?"<>|]/g, '')}.fountain`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <StudioShell title="script" description="A quiet page for the story in your head." active="/script"
      actions={<button className="studio-button" onClick={newScript}><FilePlus2 size={17} /> new script</button>}>
      {error && <p role="alert" className="studio-error">{error}</p>}
      {loading ? <p className="studio-empty">Loading scripts…</p> : (
        <div className="script-workspace">
          <aside className="script-sidebar no-print" aria-label="Your scripts">
            <div className="studio-section-heading"><span>your scripts</span><span>{items.length}</span></div>
            {items.length === 0 ? <p className="script-sidebar-empty">Nothing on the page yet.</p> : items.map(item => (
              <button key={item.id} className={`script-file ${activeId === item.id ? 'script-file-active' : ''}`} onClick={() => selectScript(item)} aria-current={activeId === item.id ? 'page' : undefined}>
                <span>{item.title}</span><small>{new Date(item.updated_at).toLocaleDateString()}</small>
              </button>
            ))}
          </aside>

          {active ? <section className="script-editor" aria-label="Screenplay editor">
            <div className="script-toolbar no-print">
              <div className="script-inserts" aria-label="Insert screenplay element">
                <button onClick={() => insertText('INT. LOCATION - DAY\n\n')} title="Scene heading">scene</button>
                <button onClick={() => insertText('CHARACTER\n')} title="Character cue">character</button>
                <button onClick={() => insertText('(beat)\n')} title="Parenthetical">beat</button>
              </div>
              <div className="script-actions">
                <button onClick={download} title="Download Fountain file" aria-label="Download Fountain file"><Download size={18} /></button>
                <button onClick={() => window.print()} title="Print or save as PDF" aria-label="Print or save as PDF"><Printer size={18} /></button>
                <button onClick={removeScript} title="Delete script" aria-label="Delete script"><Trash2 size={18} /></button>
              </div>
            </div>
            <div className="script-paper">
              <input className="script-title-input" aria-label="Script title" maxLength={120} value={title} onChange={event => { setTitle(event.target.value); setDirty(true); }} />
              <p className="script-byline">written in draft</p>
              <textarea ref={editorRef} aria-label="Screenplay text" spellCheck rows={24} value={body} onChange={event => { setBody(event.target.value); setDirty(true); }} onKeyDown={event => {
                if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); void saveCurrent(); }
              }} placeholder={'INT. SOMEWHERE - DAY\n\nA story begins…'} />
              <div className="script-print-content" aria-hidden="true"><h2>{title}</h2><pre>{body}</pre></div>
            </div>
            <footer className="script-footer no-print"><span>{wordCount} words <span className="script-footer-sep">/</span> about {Math.max(1, Math.ceil(wordCount / 200))} pages</span><div><span aria-live="polite">{saving ? 'saving…' : dirty ? 'unsaved changes' : 'saved'}</span><button className="studio-button" onClick={saveCurrent} disabled={!dirty || saving || !title.trim()}><Save size={16} /> save script</button></div></footer>
          </section> : <div className="studio-empty script-blank"><span className="studio-empty-mark">✱</span><h2>Every story starts somewhere.</h2><p>Open a blank page and find your first scene.</p><button className="studio-text-button" onClick={newScript}>Create a script</button></div>}
        </div>
      )}
    </StudioShell>
  );
}
