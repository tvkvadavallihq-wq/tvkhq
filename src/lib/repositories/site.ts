import { unstable_noStore as noStore } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { UserRole } from "@/lib/enums";
import { getAdminSession } from "@/lib/repositories/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function getSiteActive() {
  noStore();

  if (!isSupabaseConfigured()) {
    return true;
  }

  const client = createSupabaseServiceClient() as any;
  const { data, error } = await client.from("site_active").select("is_active").eq("id", 1).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.is_active ?? true;
}

export async function launchSite() {
  const session = await getAdminSession();
  if (!session.user || !session.profile) {
    return { ok: false as const, status: 401, error: "உள்நுழைவு தேவை." };
  }

  if (session.profile.role !== UserRole.SUPER_ADMIN) {
    return { ok: false as const, status: 403, error: "Super admin மட்டும் launch செய்யலாம்." };
  }

  const client = createSupabaseServiceClient() as any;
  const payload = { is_active: true, updated_at: new Date().toISOString() };
  const { data: updated, error: updateError } = await client
    .from("site_active")
    .update(payload)
    .eq("id", 1)
    .select("id")
    .maybeSingle();

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (!updated) {
    const { error: insertError } = await client.from("site_active").insert({ id: 1, ...payload });
    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  return { ok: true as const };
}
