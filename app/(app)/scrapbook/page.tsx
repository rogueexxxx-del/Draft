'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ExternalLink, ImagePlus, Pencil, Trash2 } from 'lucide-react';
import StudioShell from '@/components/StudioShell';
import { createCreativeItem, deleteCreativeItem, listCreativeItems, saveCreativeItem, type CreativeItem } from '@/lib/creative';

type ScrapData = Record<string, unknown> & {
  caption: string;
  imageUrl: string;
  sourceUrl: string;
  color: string;
};

const blank: ScrapData = { caption: '', imageUrl: '', sourceUrl: '', color: '#DD400A' };
const colors = ['#DD400A', '#141414', '#D9D9D9', '#A9765A', '#1F4B4A'];

export default function ScrapbookPage() {
  const [items, setItems] = useState<CreativeItem<ScrapData>[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CreativeItem<ScrapData> | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [data, setData] = useState<ScrapData>(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listCreativeItems<ScrapData>('scrapbook')
      .then(setItems)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function startNew() {
    setEditing(null);
    setTitle('');
    setData(blank);
    setError('');
    setOpen(true);
  }

  function startEdit(item: CreativeItem<ScrapData>) {
    setEditing(item);
    setTitle(item.title);
    setData({ ...blank, ...item.data });
    setError('');
    setOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    for (const value of [data.imageUrl, data.sourceUrl]) {
      if (value && !/^https?:\/\//i.test(value)) {
        setError('Use a full http:// or https:// URL.');
        return;
      }
    }
    setBusy(true);
    setError('');
    try {
      if (editing) {
        const saved = await saveCreativeItem({ ...editing, title: title.trim(), data });
        setItems(current => current.map(item => item.id === saved.id ? saved : item));
      } else {
        const created = await createCreativeItem('scrapbook', title.trim(), data);
        setItems(current => [created, ...current]);
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this piece.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: CreativeItem<ScrapData>) {
    if (!window.confirm(`Remove “${item.title}” from scrapbook?`)) return;
    try {
      await deleteCreativeItem(item.id);
      setItems(current => current.filter(piece => piece.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove this piece.');
    }
  }

  return (
    <StudioShell title="scrapbook" description="Keep images, fragments, and references in one place." active="/scrapbook"
      actions={<button className="studio-button" onClick={startNew}><ImagePlus size={17} /> add a piece</button>}>
      {error && !open && <p role="alert" className="studio-error">{error}</p>}

      {open && (
        <section className="studio-form-panel" aria-label={editing ? 'Edit scrapbook piece' : 'Add scrapbook piece'}>
          <div className="studio-section-heading"><span>{editing ? 'edit piece' : 'new piece'}</span><button className="studio-text-button" onClick={() => setOpen(false)}>close</button></div>
          <form onSubmit={submit} className="studio-form-grid">
            <label className="studio-field">title<input required maxLength={120} value={title} onChange={event => setTitle(event.target.value)} placeholder="A detail worth keeping" /></label>
            <label className="studio-field">image URL<input type="url" value={data.imageUrl} onChange={event => setData({ ...data, imageUrl: event.target.value })} placeholder="https://…" /></label>
            <label className="studio-field studio-field-wide">note<textarea rows={3} value={data.caption} onChange={event => setData({ ...data, caption: event.target.value })} placeholder="What does this make you think of?" /></label>
            <label className="studio-field">source URL<input type="url" value={data.sourceUrl} onChange={event => setData({ ...data, sourceUrl: event.target.value })} placeholder="https://…" /></label>
            <fieldset className="studio-field"><legend>card color</legend><div className="studio-swatches">{colors.map(color => <button key={color} type="button" aria-label={`Choose ${color}`} aria-pressed={data.color === color} style={{ background: color }} onClick={() => setData({ ...data, color })} />)}</div></fieldset>
            {error && <p role="alert" className="studio-error studio-field-wide">{error}</p>}
            <div className="studio-field-wide"><button type="submit" disabled={busy} className="studio-button">{busy ? 'saving…' : editing ? 'save changes' : 'add to scrapbook'}</button></div>
          </form>
        </section>
      )}

      <div className="studio-section-heading"><span>collected pieces</span><span>{items.length} {items.length === 1 ? 'piece' : 'pieces'}</span></div>
      {loading ? <p className="studio-empty">Loading scrapbook…</p> : items.length === 0 ? (
        <div className="studio-empty"><span className="studio-empty-mark">✳</span><h2>Start collecting.</h2><p>Save a visual, a thought, or a reference for later.</p><button className="studio-text-button" onClick={startNew}>Add your first piece</button></div>
      ) : (
        <div className="scrap-grid">
          {items.map((item, index) => <article className={`scrap-card ${index % 5 === 0 ? 'scrap-card-large' : ''} ${item.data.color === '#D9D9D9' ? 'scrap-card-light' : ''}`} key={item.id} style={{ backgroundColor: item.data.color || '#D9D9D9' }}>
            {item.data.imageUrl ? <div className="scrap-image" style={{ backgroundImage: `url("${item.data.imageUrl.replaceAll('"', '%22')}")` }} aria-hidden="true" /> : <div className="scrap-type" aria-hidden="true">{item.title.slice(0, 1).toLowerCase()}</div>}
            <div className="scrap-copy"><span className="scrap-index">{String(index + 1).padStart(2, '0')} / found</span><h2>{item.title}</h2>{item.data.caption && <p>{item.data.caption}</p>}</div>
            <div className="scrap-tools">
              {item.data.sourceUrl && <a href={item.data.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open source for ${item.title}`}><ExternalLink size={17} /></a>}
              <button onClick={() => startEdit(item)} aria-label={`Edit ${item.title}`}><Pencil size={17} /></button>
              <button onClick={() => remove(item)} aria-label={`Remove ${item.title}`}><Trash2 size={17} /></button>
            </div>
          </article>)}
        </div>
      )}
    </StudioShell>
  );
}
