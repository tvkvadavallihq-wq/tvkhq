import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { logError } from "@/lib/services/logger";

export type AuditEventInput = {
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details?: Record<string, unknown>;
  ip_address?: string | null;
  user_agent?: string | null;
};

export async function recordAuditEvent(input: AuditEventInput) {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const supabase = createSupabaseServiceClient() as any;
    await supabase.from("audit_logs").insert({
      actor_id: input.actor_id ?? null,
      action: input.action,
      entity_type: input.entity_type,
      entity_id: input.entity_id ?? null,
      details: input.details ?? {},
      ip_address: input.ip_address ?? null,
      user_agent: input.user_agent ?? null,
    });
  } catch (error) {
    logError("Audit event write failed", error, {
      action: input.action,
      entity_type: input.entity_type,
      entity_id: input.entity_id ?? null,
    });
  }
}
