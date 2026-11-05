import { createClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/config";

export function createSupabaseServerClient() {
  return createClient(
    getServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
