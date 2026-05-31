import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
  );
}

const globalForSupabase = globalThis as unknown as {
  __supabase?: SupabaseClient;
};

export const supabase: SupabaseClient =
  globalForSupabase.__supabase ??
  createClient(url, anonKey, {
    auth: { persistSession: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.__supabase = supabase;
}
