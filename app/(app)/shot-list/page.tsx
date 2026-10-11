'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import StudioShell from '@/components/StudioShell';
import { createCreativeItem, deleteCreativeItem, listCreativeItems, saveCreativeItem, type CreativeItem } from '@/lib/creative';

type ShotData = Record<string, unknown> & {
  scene: string;
  shot: string;
  size: string;
  movement: string;
  description: string;
  complete: boolean;
};

const blank: ShotData = { scene: '01', shot: '01', size: 'wide', movement: 'static', description: '', complete: false };

export default function ShotListPage() {
  const [items, setItems] = useState<CreativeItem<ShotData>[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CreativeItem<ShotData> | null>(null);
  const [title, setTitle] = useState('');
  const [data, setData] = useState<ShotData>(blank);
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listCreativeItems<ShotData>('shot').then(setItems).catch(err => setError(err.message)).finally(() => setLoading(false));
  }, []);

  function startNew() {
    setEditing(null);
    setTitle('');
    setData({ ...blank, shot: String(items.length + 1).padStart(2, '0') });
    setError('');
    setOpen(true);
  }

  function startEdit(item: CreativeItem<ShotData>) {
    setEditing(item);
    setTitle(item.title);
    setData({ ...blank, ...item.data });
    setError('');
    setOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError('');
    try {
      if (editing) {
        const saved = await saveCreativeItem({ ...editing, title: title.trim(), data });
        setItems(current => current.map(item => item.id === saved.id ? saved : item));
      } else {
        const created = await createCreativeItem('shot', title.trim(), data);
        setItems(current => [created, ...current]);
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save shot.');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item: CreativeItem<ShotData>) {
    try {
      const saved = await saveCreativeItem({ ...item, data: { ...item.data, complete: !item.data.complete } });
      setItems(current => current.map(shot => shot.id === saved.id ? saved : shot));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update shot.');
    }
  }

  async function remove(item: CreativeItem<ShotData>) {
    if (!window.confirm(`Remove shot “${item.title}”?`)) return;
    try {
      await deleteCreativeItem(item.id);
      setItems(current => current.filter(shot => shot.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove shot.');
    }
  }

  const completed = items.filter(item => item.data.complete).length;
  const visible = items.filter(item => filter === 'all' || (filter === 'done' ? item.data.complete : !item.data.complete));

  return (
    <StudioShell title="shot list" description="Plan the frame. Keep the sequence moving." active="/shot-list"
      actions={<button className="studio-button" onClick={startNew}><Plus size={18} /> add shot</button>}>
      {error && !open && <p role="alert" className="studio-error">{error}</p>}

      {open && <section className="studio-form-panel" aria-label={editing ? 'Edit shot' : 'Add shot'}>
        <div className="studio-section-heading"><span>{editing ? 'edit shot' : 'new shot'}</span><button className="studio-text-button" onClick={() => setOpen(false)}>close</button></div>
        <form className="studio-form-grid" onSubmit={submit}>
          <label className="studio-field">shot title<input required maxLength={120} value={title} onChange={event => setTitle(event.target.value)} placeholder="The arrival" /></label>
          <label className="studio-field">scene<input maxLength={20} value={data.scene} onChange={event => setData({ ...data, scene: event.target.value })} placeholder="01" /></label>
          <label className="studio-field">shot #<input maxLength={20} value={data.shot} onChange={event => setData({ ...data, shot: event.target.value })} placeholder="01" /></label>
          <label className="studio-field">size<select value={data.size} onChange={event => setData({ ...data, size: event.target.value })}><option value="wide">wide</option><option value="medium">medium</option><option value="close-up">close-up</option><option value="detail">detail</option><option value="over shoulder">over shoulder</option></select></label>
          <label className="studio-field">movement<select value={data.movement} onChange={event => setData({ ...data, movement: event.target.value })}><option value="static">static</option><option value="pan">pan</option><option value="tilt">tilt</option><option value="dolly">dolly</option><option value="handheld">handheld</option><option value="tracking">tracking</option></select></label>
          <label className="studio-field studio-field-wide">description<textarea rows={3} value={data.description} onChange={event => setData({ ...data, description: event.target.value })} placeholder="What happens in this frame?" /></label>
          {error && <p role="alert" className="studio-error studio-field-wide">{error}</p>}
          <div className="studio-field-wide"><button type="submit" disabled={busy} className="studio-button">{busy ? 'saving…' : editing ? 'save changes' : 'add to list'}</button></div>
        </form>
      </section>}

      <section className="shot-overview" aria-label="Shot list progress">
        <div className="shot-progress-copy"><strong>{completed}<span> / {items.length}</span></strong><span>frames captured</span></div>
        <div className="shot-progress-track" role="progressbar" aria-label="Shots captured" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={items.length || 1}><span style={{ width: `${items.length ? (completed / items.length) * 100 : 0}%` }} /></div>
      </section>
      <div className="studio-section-heading"><span>the sequence</span><div className="shot-filters" role="group" aria-label="Filter shots">{(['all', 'open', 'done'] as const).map(value => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}</button>)}</div></div>
      {loading ? <p className="studio-empty">Loading shot list…</p> : items.length === 0 ? (
        <div className="studio-empty"><span className="studio-empty-mark">◫</span><h2>Picture the first frame.</h2><p>Give each shot a scene, size, and movement.</p><button className="studio-text-button" onClick={startNew}>Add your first shot</button></div>
      ) : visible.length === 0 ? <p className="studio-empty">No shots in this view.</p> : (
        <div className="shot-list">
          {visible.map(item => <article key={item.id} className={`shot-row ${item.data.complete ? 'shot-row-done' : ''}`}>
            <button className="shot-check" aria-label={item.data.complete ? `Mark ${item.title} incomplete` : `Mark ${item.title} complete`} aria-pressed={item.data.complete} onClick={() => toggle(item)}>{item.data.complete && <Check size={18} />}</button>
            <div className="shot-number"><span>SC {item.data.scene || '—'}</span><strong>{item.data.shot || '—'}</strong></div>
            <div className="shot-main"><h2>{item.title}</h2><p>{item.data.description || 'No description yet.'}</p></div>
            <div className="shot-spec"><span>{item.data.size}</span><span>{item.data.movement}</span></div>
            <div className="shot-tools"><button onClick={() => startEdit(item)} aria-label={`Edit ${item.title}`}><Pencil size={17} /></button><button onClick={() => remove(item)} aria-label={`Remove ${item.title}`}><Trash2 size={17} /></button></div>
          </article>)}
        </div>
      )}
    </StudioShell>
  );
}
