import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getAdminSession } from "@/lib/repositories/admin";
import { recordAuditEvent } from "@/lib/services/audit";
import { logError } from "@/lib/services/logger";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { checkRateLimit, getClientRateLimitKey, RATE_LIMITS } from "@/lib/security/rate-limit";
import { sanitizeUsername } from "@/lib/security/sanitize";
import { MasterActionType, normalizeMasterActionValue } from "@/lib/repositories/admin-master";
import { UserRole } from "@/lib/enums";
import { adminUserToggleSchema, adminUserUpsertSchema } from "@/lib/validators";

function notAllowed() {
  return NextResponse.json({ ok: false, error: "அணுகல் மறுக்கப்பட்டது." }, { status: 403 });
}

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function isMissingColumnError(error: { message?: string } | null | undefined, column: string) {
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes(`column "${column}" does not exist`) || message.includes(`column ${column} does not exist`);
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
        const payload = value as { name_ta: string; name_en: string | null; icon: string | null };
        if (!payload.name_ta) return badRequest("வகை பெயர் தேவை.");

        const { error } = await client.from("complaint_categories").insert({
          name_ta: payload.name_ta,
          name_en: payload.name_en,
          icon: payload.icon,
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
        const payload = value as {
          ward_number: number;
          ward_name: string | null;
          assembly_constituency: string | null;
          city: string | null;
          district: string | null;
          secretary_name: string | null;
          secretary_mobile: string | null;
          secretary_whatsapp: string | null;
        };
        if (!Number.isFinite(payload.ward_number)) return badRequest("சரியான ward விவரங்களை உள்ளிடவும்.");

        const { error } = await client.from("wards").insert({
          ward_number: payload.ward_number,
          ward_name: payload.ward_name,
          assembly_constituency: payload.assembly_constituency,
          city: payload.city,
          district: payload.district,
          secretary_name: payload.secretary_name,
          secretary_mobile: payload.secretary_mobile,
          secretary_whatsapp: payload.secretary_whatsapp,
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
        const payload = value as { ward_id: string; name: string; mobile: string; whatsapp: string | null; area_name: string };
        if (!payload.ward_id || !payload.name || !payload.mobile || !payload.area_name) return badRequest("POC விவரங்கள் தேவை.");

        const { error } = await client.from("area_pocs").insert({
          ward_id: payload.ward_id,
          name: payload.name,
          mobile: payload.mobile,
          whatsapp: payload.whatsapp,
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
        const payload = value as { title: string; content: string; image_url: string | null };
        if (!payload.title || !payload.content) return badRequest("அறிவிப்பு விவரங்கள் தேவை.");

        const { error } = await client.from("announcements").insert({
          title: payload.title,
          content: payload.content,
          image_url: payload.image_url,
          created_by: session.user.id,
        });
        if (error) throw new Error(error.message);
        resultMessage = "அறிவிப்பு சேர்க்கப்பட்டது.";
        break;
      }
      case "toggle-announcement": {
        return badRequest("அறிவிப்புகளுக்கு toggle ஆதரவு இல்லை.");
      }
      case "create-banner": {
        const payload = value as { title: string; image_url: string | null; redirect_url: string | null; display_order: number };
        if (!payload.title) return badRequest("Banner title தேவை.");

        const { error } = await client.from("banners").insert({
          title: payload.title,
          image_url: payload.image_url,
          redirect_url: payload.redirect_url,
          display_order: payload.display_order,
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
        const username = sanitizeUsername(payload.username);
        const password = payload.password?.trim() ?? "";
        const passwordHash = await hash(password, 10);

        const { data: existingUser, error: lookupError } = await client.from("users").select("id").eq("username", username).maybeSingle();
        if (lookupError) {
          throw new Error(lookupError.message);
        }

        const fullNameValues = {
          username,
          password_hash: passwordHash,
          name: payload.name,
          mobile: payload.mobile || null,
          role: payload.role,
          ward_id: payload.role === UserRole.SUPER_ADMIN ? null : payload.ward_id || null,
          is_active: payload.is_active,
        };

        const fallbackValues = {
          username,
          password_hash: passwordHash,
          full_name: payload.name,
          phone: payload.mobile || null,
          role: payload.role,
          ward_id: payload.role === UserRole.SUPER_ADMIN ? null : payload.ward_id || null,
          is_active: payload.is_active,
        };

        const attemptWrite = async (values: Record<string, unknown>) =>
          existingUser ? client.from("users").update(values).eq("id", existingUser.id) : client.from("users").insert(values);

        let profileWrite = await attemptWrite(fullNameValues);
        if (profileWrite.error && isMissingColumnError(profileWrite.error, "name")) {
          profileWrite = await attemptWrite(fallbackValues);
        }

        if (profileWrite.error) {
          throw new Error(profileWrite.error.message);
        }

        const { data: savedUser } = existingUser
          ? { data: existingUser }
          : await client.from("users").select("id").eq("username", username).maybeSingle();
        auditEntityId = savedUser?.id ?? null;
        resultMessage = "பயனர் உருவாக்கப்பட்டது.";
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
