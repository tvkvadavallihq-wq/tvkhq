import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { COMPLAINT_UPLOAD_LIMITS, STORAGE_BUCKETS } from "@/lib/constants";
import { ComplaintStatus, UserRole } from "@/lib/enums";
import { checkRateLimit, getClientRateLimitKey, RATE_LIMITS } from "@/lib/security/rate-limit";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { adminComplaintAssignmentSchema, adminComplaintCommentSchema, adminComplaintMediaUploadSchema, adminComplaintStatusChangeSchema } from "@/lib/validators";
import { getAdminSession } from "@/lib/repositories/admin";
import { recordAuditEvent } from "@/lib/services/audit";
import { logError } from "@/lib/services/logger";
import { notifyComplaintStatusChange } from "@/lib/services/notifications";

function firstErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "issues" in error && Array.isArray((error as { issues: Array<{ message?: string }> }).issues)) {
    return (error as { issues: Array<{ message?: string }> }).issues[0]?.message ?? null;
  }

  return error instanceof Error ? error.message : null;
}

function sanitizeFileName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 80) || "file";
}

async function loadComplaintAccess(service: ReturnType<typeof createSupabaseServiceClient>, complaintId: string, wardId: string | null, isSuperAdmin: boolean) {
  let query = service.from("complaints").select("id,complaint_number,ward_id,current_status,complainant_phone,complainant_name").eq("id", complaintId);

  if (!isSuperAdmin) {
    query = query.eq("ward_id", wardId ?? "00000000-0000-0000-0000-000000000000");
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

export async function POST(request: Request, { params }: { params: Promise<{ complaintId: string }> }) {
  try {
    const { complaintId } = await params;
    const rate = checkRateLimit(getClientRateLimitKey(request), RATE_LIMITS.adminWrite.limit, RATE_LIMITS.adminWrite.windowMs);
    if (!rate.allowed) {
      return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
    }

    const session = await getAdminSession();

    if (!session.user || !session.profile) {
      return NextResponse.json({ ok: false, error: "அணுகல் மறுக்கப்பட்டது." }, { status: 401 });
    }

    const service = createSupabaseServiceClient() as any;
    const complaint = await loadComplaintAccess(
      service,
      complaintId,
      session.profile.ward_id,
      session.profile.role === UserRole.SUPER_ADMIN,
    );

    if (!complaint) {
      return NextResponse.json({ ok: false, error: "புகார் கிடைக்கவில்லை." }, { status: 404 });
    }

    const formData = await request.formData();
    const action = String(formData.get("action") ?? "");

    if (action === "verify") {
      const parsed = adminComplaintStatusChangeSchema.safeParse({
        status: ComplaintStatus.VERIFIED,
        remarks: String(formData.get("remarks") ?? ""),
      });

      if (!parsed.success) {
        return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "சரியான தகவலை உள்ளிடவும்." }, { status: 400 });
      }

      const { error } = await service.rpc("admin_record_complaint_status_change", {
        p_complaint_id: complaintId,
        p_to_status: parsed.data.status,
        p_changed_by: session.user.id,
        p_remarks: parsed.data.remarks || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      await recordAuditEvent({
        actor_id: session.user.id,
        action: "verify_complaint",
        entity_type: "complaint",
        entity_id: complaintId,
        details: { remarks: parsed.data.remarks || null },
      });

      return NextResponse.json({ ok: true, message: "புகார் சரிபார்க்கப்பட்டது." });
    }

    if (action === "assign") {
      const parsed = adminComplaintAssignmentSchema.safeParse({
        assigned_to: String(formData.get("assigned_to") ?? ""),
        remarks: String(formData.get("remarks") ?? ""),
      });

      if (!parsed.success) {
        return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "சரியான தகவலை உள்ளிடவும்." }, { status: 400 });
      }

      const { error } = await service.rpc("admin_record_complaint_assignment", {
        p_complaint_id: complaintId,
        p_assigned_to: parsed.data.assigned_to,
        p_assigned_by: session.user.id,
        p_remarks: parsed.data.remarks || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      await recordAuditEvent({
        actor_id: session.user.id,
        action: "assign_complaint",
        entity_type: "complaint",
        entity_id: complaintId,
        details: { assigned_to: parsed.data.assigned_to, remarks: parsed.data.remarks || null },
      });

      return NextResponse.json({ ok: true, message: "ஒதுக்கீடு பதிவு செய்யப்பட்டது." });
    }

    if (action === "status") {
      const parsed = adminComplaintStatusChangeSchema.safeParse({
        status: String(formData.get("status") ?? ""),
        remarks: String(formData.get("remarks") ?? ""),
      });

      if (!parsed.success) {
        return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "சரியான தகவலை உள்ளிடவும்." }, { status: 400 });
      }

      const { error } = await service.rpc("admin_record_complaint_status_change", {
        p_complaint_id: complaintId,
        p_to_status: parsed.data.status,
        p_changed_by: session.user.id,
        p_remarks: parsed.data.remarks || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      await recordAuditEvent({
        actor_id: session.user.id,
        action: "change_complaint_status",
        entity_type: "complaint",
        entity_id: complaintId,
        details: { status: parsed.data.status, remarks: parsed.data.remarks || null },
      });

      void notifyComplaintStatusChange(
        {
          name: (complaint as any).complainant_name ?? "Citizen",
          phone: (complaint as any).complainant_phone ?? undefined,
        },
        (complaint as any).complaint_number ?? complaintId,
        parsed.data.status,
      );

      return NextResponse.json({ ok: true, message: "நிலை புதுப்பிக்கப்பட்டது." });
    }

    if (action === "comment") {
      const parsed = adminComplaintCommentSchema.safeParse({
        remarks: String(formData.get("remarks") ?? ""),
      });

      if (!parsed.success) {
        return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "சரியான தகவலை உள்ளிடவும்." }, { status: 400 });
      }

      const { error } = await service.rpc("admin_record_complaint_comment", {
        p_complaint_id: complaintId,
        p_changed_by: session.user.id,
        p_remarks: parsed.data.remarks,
      });

      if (error) {
        throw new Error(error.message);
      }

      await recordAuditEvent({
        actor_id: session.user.id,
        action: "comment_complaint",
        entity_type: "complaint",
        entity_id: complaintId,
        details: { remarks: parsed.data.remarks },
      });

      return NextResponse.json({ ok: true, message: "குறிப்பு சேர்க்கப்பட்டது." });
    }

    if (action === "media") {
      const files = formData.getAll("image_files").filter((value): value is File => value instanceof File);
      const parsed = adminComplaintMediaUploadSchema.safeParse({
        media_stage: String(formData.get("media_stage") ?? ""),
        caption: String(formData.get("caption") ?? ""),
        image_files: files,
      });

      if (!parsed.success) {
        return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "சரியான தகவலை உள்ளிடவும்." }, { status: 400 });
      }

      if (parsed.data.image_files.length === 0) {
        return NextResponse.json({ ok: false, error: "குறைந்தது ஒரு படம் பதிவேற்ற வேண்டும்." }, { status: 400 });
      }

      if (parsed.data.image_files.length > COMPLAINT_UPLOAD_LIMITS.maxImages) {
        return NextResponse.json({ ok: false, error: `அதிகபட்சம் ${COMPLAINT_UPLOAD_LIMITS.maxImages} படங்கள் மட்டுமே அனுமதி.` }, { status: 400 });
      }

      const bucket = STORAGE_BUCKETS.complaintMedia;
      const uploads = await Promise.all(
        parsed.data.image_files.map(async (file, index) => {
          const extension = file.name.includes(".") ? (file.name.split(".").pop() ?? "jpg") : "jpg";
          const baseName = sanitizeFileName(file.name).replace(/\.[^.]+$/, "");
          const complaintNumber = (complaint as any).complaint_number as string;
          const storagePath = `admin/${complaintNumber}/${parsed.data.media_stage.toLowerCase()}/${Date.now()}-${index}-${baseName}-${randomUUID()}.${extension}`;
          const { error: uploadError } = await service.storage.from(bucket).upload(storagePath, file, {
            contentType: file.type || "image/jpeg",
            upsert: false,
          });

          if (uploadError) {
            throw new Error(uploadError.message);
          }

          const { data: publicUrlData } = service.storage.from(bucket).getPublicUrl(storagePath);

          return {
            complaint_id: complaintId,
            bucket,
            storage_path: storagePath,
            file_url: publicUrlData.publicUrl,
            media_stage: parsed.data.media_stage,
            media_type: file.type || "image/jpeg",
            caption: parsed.data.caption || null,
            uploaded_by: session.user.id,
          };
        }),
      );

      const { error } = await service.from("complaint_media").insert(uploads);

      if (error) {
        throw new Error(error.message);
      }

      await recordAuditEvent({
        actor_id: session.user.id,
        action: "upload_complaint_media",
        entity_type: "complaint",
        entity_id: complaintId,
        details: {
          media_stage: parsed.data.media_stage,
          caption: parsed.data.caption || null,
          count: parsed.data.image_files.length,
        },
      });

      return NextResponse.json({ ok: true, message: "படங்கள் பதிவேற்றப்பட்டன." });
    }

    return NextResponse.json({ ok: false, error: "செயல் செல்லாது." }, { status: 400 });
  } catch (error) {
    logError("Admin complaint action failed", error, { complaintId: "unknown" });
    const message = firstErrorMessage(error) ?? "புகார் செயலை நிறைவேற்ற முடியவில்லை.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
