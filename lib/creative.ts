import { createClient } from '@/utils/supabase/client';

export type CreativeKind = 'scrapbook' | 'shot' | 'script';

export interface CreativeItem<T extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  kind: CreativeKind;
  title: string;
  data: T;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

const LOCAL_KEY = 'draft_creative_items';

function localMode() {
  return typeof window !== 'undefined' && (
    localStorage.getItem('draft_guest_mode') === 'true' ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

function readLocal(): CreativeItem[] {
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeLocal(items: CreativeItem[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

async function currentUserId() {
  const { data: { user }, error } = await createClient().auth.getUser();
  if (error || !user) throw new Error('Please log in to save your work.');
  return user.id;
}

export async function listCreativeItems<T extends Record<string, unknown>>(kind: CreativeKind): Promise<CreativeItem<T>[]> {
  if (localMode()) return readLocal().filter(item => item.kind === kind) as CreativeItem<T>[];
  const userId = await currentUserId();
  const { data, error } = await createClient()
    .from('creative_items')
    .select('*')
    .eq('user_id', userId)
    .eq('kind', kind)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as CreativeItem<T>[];
}

export async function createCreativeItem<T extends Record<string, unknown>>(
  kind: CreativeKind,
  title: string,
  data: T,
): Promise<CreativeItem<T>> {
  const now = new Date().toISOString();
  const item: CreativeItem<T> = {
    id: crypto.randomUUID(), kind, title, data, created_at: now, updated_at: now,
  };
  if (localMode()) {
    writeLocal([item, ...readLocal()]);
    return item;
  }
  item.user_id = await currentUserId();
  const { error } = await createClient().from('creative_items').insert(item);
  if (error) throw new Error(error.message);
  return item;
}

export async function saveCreativeItem<T extends Record<string, unknown>>(item: CreativeItem<T>): Promise<CreativeItem<T>> {
  const updated = { ...item, updated_at: new Date().toISOString() };
  if (localMode()) {
    writeLocal(readLocal().map(existing => existing.id === item.id ? updated : existing));
    return updated;
  }
  const userId = await currentUserId();
  const { error } = await createClient().from('creative_items')
    .update({ title: updated.title, data: updated.data, updated_at: updated.updated_at })
    .eq('id', item.id)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return updated;
}

export async function deleteCreativeItem(id: string) {
  if (localMode()) {
    writeLocal(readLocal().filter(item => item.id !== id));
    return;
  }
  const userId = await currentUserId();
  const { error } = await createClient().from('creative_items').delete().eq('id', id).eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function syncGuestCreativeItems(userId: string) {
  const items = readLocal();
  if (!items.length) return;
  const { error } = await createClient().from('creative_items').upsert(
    items.map(item => ({ ...item, user_id: userId })),
  );
  if (error) throw new Error(error.message);
  localStorage.removeItem(LOCAL_KEY);
}
