import { createBrowserClient } from "@supabase/ssr";

import { getServerEnv } from "@/lib/config";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    getServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getServerEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
