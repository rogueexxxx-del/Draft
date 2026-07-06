import { createClient } from '@/utils/supabase/client';

// --- Types ---
export interface SupabaseBundle {
  id: string;
  name: string;
  description: string;
  color: string;
  user_id: string;
}

export interface SupabaseNote {
  id: string;
  title: string;
  content: string;
  description?: string;
  bundle_id: string;
  grid_span?: string;
  theme_settings?: Record<string, unknown>;
  user_id: string;
  updated_at?: string;
}

// --- Bundles ---
export async function getBundles(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bundles')
    .select('*')
    .eq('user_id', userId)
    .limit(200);
  return { data: data as SupabaseBundle[] | null, error };
}

export async function createBundle(bundle: SupabaseBundle) {
  const supabase = createClient();
  const { error } = await supabase.from('bundles').insert(bundle);
  return { error };
}

// --- Notes ---
export async function getNotes(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .limit(200);
  return { data: data as SupabaseNote[] | null, error };
}

export async function createNote(note: Omit<SupabaseNote, 'updated_at'>) {
  const supabase = createClient();
  const { error } = await supabase.from('notes').insert(note);
  return { error };
}

export async function updateNote(id: string, fields: Partial<SupabaseNote>) {
  const supabase = createClient();
  const { error } = await supabase
    .from('notes')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id);
  return { error };
}

export async function deleteNote(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('notes').delete().eq('id', id);
  return { error };
}
