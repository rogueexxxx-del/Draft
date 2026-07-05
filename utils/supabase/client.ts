import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials missing. Returning full mock client for guest mode.");
    
    // Automatically flag guest mode when credentials are not configured
    if (typeof window !== "undefined") {
      try {
        document.cookie = "draft_guest_mode=true; path=/";
        localStorage.setItem("draft_guest_mode", "true");
      } catch (e) {
        console.warn("Cookie / storage write failed in mock client:", e);
      }
    }

    const getLocalNotes = () => {
      if (typeof window === "undefined") return [];
      try {
        const n = localStorage.getItem('draft_notes');
        return n ? JSON.parse(n) : [];
      } catch (e) { return []; }
    };

    const setLocalNotes = (notes: any[]) => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem('draft_notes', JSON.stringify(notes));
      } catch (e) {}
    };

    const getLocalBundles = () => {
      if (typeof window === "undefined") return [];
      try {
        const b = localStorage.getItem('draft_bundles');
        return b ? JSON.parse(b) : [];
      } catch (e) { return []; }
    };

    const setLocalBundles = (bundles: any[]) => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem('draft_bundles', JSON.stringify(bundles));
      } catch (e) {}
    };

    return {
      auth: {
        signUp: async ({ email }: { email: string }) => {
          if (typeof window !== "undefined") {
            localStorage.setItem("draft_user_email", email);
          }
          return { data: { user: { id: 'guest-mock', email } }, error: null };
        },
        signInWithPassword: async ({ email }: { email: string }) => {
          if (typeof window !== "undefined") {
            localStorage.setItem("draft_user_email", email);
          }
          return { data: { user: { id: 'guest-mock', email } }, error: null };
        },
        signOut: async () => {},
        signInAnonymously: async () => ({ data: { user: { id: 'guest-mock', email: 'guest@draft.co' } }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        getUser: async () => {
          const email = (typeof window !== "undefined" && localStorage.getItem("draft_user_email")) || "guest@draft.co";
          return { data: { user: { id: 'guest-mock', email } }, error: null };
        },
        getSession: async () => {
          const email = (typeof window !== "undefined" && localStorage.getItem("draft_user_email")) || "guest@draft.co";
          return { data: { session: { user: { id: 'guest-mock', email } } }, error: null };
        }
      },
      from: (table: string) => {
        if (table === 'notes') {
          return {
            select: () => {
              const selectResult = {
                then: (onfulfilled: any) => {
                  const notes = getLocalNotes();
                  const mapped = notes.map((note: any) => ({
                    id: note.id,
                    title: note.title,
                    content: note.content,
                    description: note.description,
                    bundle_id: note.bundleId,
                    grid_span: note.gridSpan,
                    theme_settings: note.theme_settings,
                    updated_at: note.updatedAt
                  }));
                  return Promise.resolve({ data: mapped, error: null }).then(onfulfilled);
                },
                eq: (col: string, val: any) => ({
                  single: () => {
                    const notes = getLocalNotes();
                    const note = notes.find((n: any) => n[col] === val || (col === 'id' && n.id === val));
                    if (note) {
                      return Promise.resolve({
                        data: {
                          id: note.id,
                          title: note.title,
                          content: note.content,
                          description: note.description,
                          bundle_id: note.bundleId,
                          grid_span: note.gridSpan,
                          theme_settings: note.theme_settings,
                          updated_at: note.updatedAt
                        },
                        error: null
                      });
                    }
                    return Promise.resolve({ data: null, error: new Error('Not found') });
                  }
                })
              };
              return selectResult as any;
            },
            insert: async (data: any) => {
              const notes = getLocalNotes();
              const items = Array.isArray(data) ? data : [data];
              items.forEach(item => {
                notes.push({
                  id: item.id,
                  title: item.title || 'Untitled',
                  content: item.content || '',
                  description: item.description || '',
                  bundleId: item.bundle_id || item.bundleId || 'unsorted',
                  gridSpan: item.grid_span || item.gridSpan || 'col-span-1 row-span-1',
                  theme_settings: item.theme_settings || {},
                  updatedAt: item.updated_at || item.updatedAt || new Date().toISOString()
                });
              });
              setLocalNotes(notes);
              return { data, error: null };
            },
            update: (updateData: any) => ({
              eq: async (col: string, val: any) => {
                const notes = getLocalNotes();
                const updated = notes.map((n: any) => {
                  if (n[col] === val || (col === 'id' && n.id === val)) {
                    return {
                      ...n,
                      title: updateData.title !== undefined ? updateData.title : n.title,
                      description: updateData.description !== undefined ? updateData.description : n.description,
                      content: updateData.content !== undefined ? updateData.content : n.content,
                      theme_settings: updateData.theme_settings !== undefined ? updateData.theme_settings : n.theme_settings,
                      updatedAt: new Date().toISOString()
                    };
                  }
                  return n;
                });
                setLocalNotes(updated);
                return { data: updateData, error: null };
              }
            }),
            delete: () => ({
              eq: async (col: string, val: any) => {
                const notes = getLocalNotes();
                const filtered = notes.filter((n: any) => n[col] !== val && !(col === 'id' && n.id === val));
                setLocalNotes(filtered);
                return { data: [], error: null };
              }
            })
          } as any;
        }

        if (table === 'bundles') {
          return {
            select: () => {
              const selectResult = {
                then: (onfulfilled: any) => {
                  const bundles = getLocalBundles();
                  return Promise.resolve({ data: bundles, error: null }).then(onfulfilled);
                },
                eq: (col: string, val: any) => ({
                  single: () => {
                    const bundles = getLocalBundles();
                    const bundle = bundles.find((b: any) => b[col] === val);
                    return Promise.resolve({ data: bundle || null, error: bundle ? null : new Error('Not found') });
                  }
                })
              };
              return selectResult as any;
            },
            insert: async (data: any) => {
              const bundles = getLocalBundles();
              const items = Array.isArray(data) ? data : [data];
              items.forEach(item => {
                bundles.push(item);
              });
              setLocalBundles(bundles);
              return { data, error: null };
            },
            update: (updateData: any) => ({
              eq: async (col: string, val: any) => {
                const bundles = getLocalBundles();
                const updated = bundles.map((b: any) => b[col] === val ? { ...b, ...updateData } : b);
                setLocalBundles(updated);
                return { data: updateData, error: null };
              }
            }),
            delete: () => ({
              eq: async (col: string, val: any) => {
                const bundles = getLocalBundles();
                const filtered = bundles.filter((b: any) => b[col] !== val);
                setLocalBundles(filtered);
                return { data: [], error: null };
              }
            })
          } as any;
        }

        return {
          select: () => Promise.resolve({ data: [], error: null }),
          insert: () => Promise.resolve({ data: [], error: null }),
          update: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
          delete: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
        } as any;
      }
    } as any;
  }
  return createBrowserClient(supabaseUrl, supabaseKey);
};
