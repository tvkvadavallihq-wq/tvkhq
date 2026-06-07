import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/repositories/admin";
import { recordAuditEvent } from "@/lib/services/audit";
import { logError } from "@/lib/services/logger";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { checkRateLimit, getClientRateLimitKey, RATE_LIMITS } from "@/lib/security/rate-limit";
import { sanitizeEmail } from "@/lib/security/sanitize";
import { MasterActionType, normalizeMasterActionValue } from "@/lib/repositories/admin-master";
import { UserRole } from "@/lib/enums";
import { adminUserToggleSchema, adminUserUpsertSchema } from "@/lib/validators";

function notAllowed() {
  return NextResponse.json({ ok: false, error: "அணுகல் மறுக்கப்பட்டது." }, { status: 403 });
}

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function parseAction(action: string): MasterActionType | null {
  const actions: MasterActionType[] = [
    "create-category",
    "toggle-category",
    "create-ward",
    "toggle-ward",
    "create-poc",
    "toggle-poc",
    "create-announcement",
    "toggle-announcement",
    "create-banner",
    "toggle-banner",
    "create-user",
    "toggle-user",
  ];
  return actions.includes(action as MasterActionType) ? (action as MasterActionType) : null;
}

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(getClientRateLimitKey(request), RATE_LIMITS.adminWrite.limit, RATE_LIMITS.adminWrite.windowMs);
    if (!rate.allowed) {
      return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
    }

    const session = await getAdminSession();
    if (!session.user || !session.profile) {
      return notAllowed();
    }

    const formData = await request.formData();
    const action = parseAction(String(formData.get("action") ?? ""));
    if (!action) {
      return badRequest("செயல் செல்லாது.");
    }

    if (!["create-poc", "toggle-poc"].includes(action) && session.profile.role !== UserRole.SUPER_ADMIN) {
      return notAllowed();
    }

    const client = createSupabaseServiceClient() as any;
    const value = normalizeMasterActionValue(action, formData);

    let resultMessage = "செயல் நிறைவேற்றப்பட்டது.";
    let auditEntityId: string | null = "id" in value ? String((value as { id?: string }).id ?? "") : null;
    const auditValue =
      action === "create-user"
        ? {
            ...(value as Record<string, unknown>),
            password: undefined,
          }
        : value;
    const commonAudit = {
      actor_id: session.user.id,
      entity_type: action.replace(/^(create|toggle)-/, ""),
      entity_id: auditEntityId,
      ip_address: request.headers.get("x-forwarded-for"),
      user_agent: request.headers.get("user-agent"),
    };

    switch (action) {
      case "create-category": {
        const payload = value as { name_ta: string; name_en: string | null; slug: string };
        if (!payload.name_ta || !payload.slug) return badRequest("வகை பெயர் மற்றும் slug தேவை.");

        const { error } = await client.from("complaint_categories").insert({
          name_ta: payload.name_ta,
          name_en: payload.name_en,
          slug: payload.slug,
          is_active: true,
        });
        if (error) throw new Error(error.message);
        resultMessage = "வகை சேர்க்கப்பட்டது.";
        break;
      }
      case "toggle-category": {
        const payload = value as { id: string; is_active: boolean };
        const { error } = await client.from("complaint_categories").update({ is_active: payload.is_active }).eq("id", payload.id);
        if (error) throw new Error(error.message);
        resultMessage = "வகை புதுப்பிக்கப்பட்டது.";
        break;
      }
      case "create-ward": {
        const payload = value as { ward_number: number; name_ta: string; name_en: string | null };
        if (!Number.isFinite(payload.ward_number) || !payload.name_ta) return badRequest("சரியான ward விவரங்களை உள்ளிடவும்.");

        const { error } = await client.from("wards").insert({
          number: payload.ward_number,
          name_ta: payload.name_ta,
          name_en: payload.name_en,
          is_active: true,
        });
        if (error) throw new Error(error.message);
        resultMessage = "வார்டு சேர்க்கப்பட்டது.";
        break;
      }
      case "toggle-ward": {
        const payload = value as { id: string; is_active: boolean };
        const { error } = await client.from("wards").update({ is_active: payload.is_active }).eq("id", payload.id);
        if (error) throw new Error(error.message);
        resultMessage = "வார்டு புதுப்பிக்கப்பட்டது.";
        break;
      }
      case "create-poc": {
        const payload = value as { ward_id: string; name: string; phone: string; area_name: string };
        if (!payload.ward_id || !payload.name || !payload.phone || !payload.area_name) return badRequest("POC விவரங்கள் தேவை.");

        const { error } = await client.from("area_pocs").insert({
          ward_id: payload.ward_id,
          name: payload.name,
          phone: payload.phone,
          area_name: payload.area_name,
          is_active: true,
        });
        if (error) throw new Error(error.message);
        resultMessage = "POC சேர்க்கப்பட்டது.";
        break;
      }
      case "toggle-poc": {
        const payload = value as { id: string; is_active: boolean };
        const { error } = await client.from("area_pocs").update({ is_active: payload.is_active }).eq("id", payload.id);
        if (error) throw new Error(error.message);
        resultMessage = "POC புதுப்பிக்கப்பட்டது.";
        break;
      }
      case "create-announcement": {
        const payload = value as { title_ta: string; body_ta: string };
        if (!payload.title_ta || !payload.body_ta) return badRequest("அறிவிப்பு விவரங்கள் தேவை.");

        const { error } = await client.from("announcements").insert({
          title_ta: payload.title_ta,
          body_ta: payload.body_ta,
          is_active: true,
          published_at: new Date().toISOString(),
        });
        if (error) throw new Error(error.message);
        resultMessage = "அறிவிப்பு சேர்க்கப்பட்டது.";
        break;
      }
      case "toggle-announcement": {
        const payload = value as { id: string; is_active: boolean };
        const { error } = await client.from("announcements").update({ is_active: payload.is_active }).eq("id", payload.id);
        if (error) throw new Error(error.message);
        resultMessage = "அறிவிப்பு புதுப்பிக்கப்பட்டது.";
        break;
      }
      case "create-banner": {
        const payload = value as { title_ta: string; image_path: string | null; link_url: string | null };
        if (!payload.title_ta) return badRequest("Banner title தேவை.");

        const { error } = await client.from("banners").insert({
          title_ta: payload.title_ta,
          image_path: payload.image_path,
          link_url: payload.link_url,
          is_active: true,
        });
        if (error) throw new Error(error.message);
        resultMessage = "Banner சேர்க்கப்பட்டது.";
        break;
      }
      case "toggle-banner": {
        const payload = value as { id: string; is_active: boolean };
        const { error } = await client.from("banners").update({ is_active: payload.is_active }).eq("id", payload.id);
        if (error) throw new Error(error.message);
        resultMessage = "Banner புதுப்பிக்கப்பட்டது.";
        break;
      }
      case "create-user": {
        const parsed = adminUserUpsertSchema.safeParse(value);
        if (!parsed.success) {
          return badRequest(parsed.error.issues[0]?.message ?? "பயனர் விவரங்கள் செல்லாது.");
        }

        const payload = parsed.data;
        const authUserId = payload.auth_user_id?.trim() || null;
        let userId = authUserId;

        if (!userId) {
          const email = sanitizeEmail(payload.email);
          const password = payload.password?.trim() ?? "";

          const { data: createdUser, error: createError } = await client.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              full_name: payload.full_name,
              phone: payload.phone || null,
              role: payload.role,
            },
          });

          if (createError || !createdUser.user) {
            throw new Error(createError?.message ?? "Auth user உருவாக்க முடியவில்லை.");
          }

          userId = createdUser.user.id;
        }

        const { error: profileError } = await client.from("users").upsert(
          {
            id: userId,
            full_name: payload.full_name,
            phone: payload.phone || null,
            role: payload.role,
            ward_id: payload.role === UserRole.SUPER_ADMIN ? null : payload.ward_id || null,
            is_active: payload.is_active,
          },
          { onConflict: "id" },
        );

        if (profileError) {
          if (!authUserId && userId) {
            await client.auth.admin.deleteUser(userId).catch(() => null);
          }
          throw new Error(profileError.message);
        }

        auditEntityId = userId;
        resultMessage = authUserId ? "Auth user profile இணைக்கப்பட்டது." : "பயனர் உருவாக்கப்பட்டது.";
        break;
      }
      case "toggle-user": {
        const parsed = adminUserToggleSchema.safeParse(value);
        if (!parsed.success) {
          return badRequest(parsed.error.issues[0]?.message ?? "பயனர் நிலை செல்லாது.");
        }

        const { error } = await client.from("users").update({ is_active: parsed.data.is_active }).eq("id", parsed.data.id);
        if (error) throw new Error(error.message);
        resultMessage = parsed.data.is_active ? "பயனர் செயல்படுத்தப்பட்டது." : "பயனர் முடக்கப்பட்டது.";
        break;
      }
      default:
        return badRequest("செயல் செல்லாது.");
    }

    await recordAuditEvent({
      actor_id: commonAudit.actor_id,
      action,
      entity_type: commonAudit.entity_type,
      entity_id: auditEntityId,
      details: { action, value: auditValue },
      ip_address: commonAudit.ip_address,
      user_agent: commonAudit.user_agent,
    });

    return NextResponse.json({ ok: true, message: resultMessage });
  } catch (error) {
    logError("Admin master action failed", error);
    const message = error instanceof Error ? error.message : "செயல் நிறைவேற்ற முடியவில்லை.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
