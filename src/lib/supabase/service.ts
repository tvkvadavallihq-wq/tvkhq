import { createClient } from "@supabase/supabase-js";
import { requireSupabaseConfig } from "@/lib/env";
import type { Database } from "@/lib/database.types";

export function createSupabaseServiceClient() {
  requireSupabaseConfig();

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for complaint registration.");
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
