import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials missing. Returning mock client for guest mode.");
    
    // Automatically flag guest mode when credentials are not configured
    if (typeof window !== "undefined") {
      try {
        document.cookie = "draft_guest_mode=true; path=/";
        localStorage.setItem("draft_guest_mode", "true");
      } catch (e) {
        console.warn("Cookie / storage write failed in mock client:", e);
      }
    }

    return {
      auth: {
        signUp: async () => ({ data: { user: { id: 'guest-mock', email: 'guest@draft.co' } }, error: null }),
        signInWithPassword: async () => ({ data: { user: { id: 'guest-mock', email: 'guest@draft.co' } }, error: null }),
        signOut: async () => {},
        signInAnonymously: async () => ({ data: { user: { id: 'guest-mock', email: 'guest@draft.co' } }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
      })
    } as any;
  }
  return createBrowserClient(supabaseUrl, supabaseKey);
};
