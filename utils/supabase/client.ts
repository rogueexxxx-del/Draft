import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials missing. Returning mock client for guest mode.");
    return {
      auth: {
        signUp: async () => ({ data: { user: null }, error: new Error("Credentials missing. Configure environment variables in Vercel.") }),
        signInWithPassword: async () => ({ data: { user: null }, error: new Error("Credentials missing. Configure environment variables in Vercel.") }),
        signOut: async () => {},
        signInAnonymously: async () => ({ data: { user: null }, error: null }),
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
