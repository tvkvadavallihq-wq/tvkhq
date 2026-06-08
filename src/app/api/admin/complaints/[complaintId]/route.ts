import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { COMPLAINT_UPLOAD_LIMITS, STORAGE_BUCKETS } from "@/lib/constants";
import { ComplaintStatus, UserRole } from "@/lib/enums";
import { getAdminSession } from "@/lib/repositories/admin";
import { checkRateLimit, getClientRateLimitKey, RATE_LIMITS } from "@/lib/security/rate-limit";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getPublicTableColumns, pickInsertPayload } from "@/lib/supabase/table-columns";
import {
  adminComplaintAssignmentSchema,
  adminComplaintCommentSchema,
  adminComplaintMediaUploadSchema,
  adminComplaintStatusChangeSchema,
} from "@/lib/validators";
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

function nextAssignmentRole(role: UserRole | null | undefined) {
  if (role === UserRole.SUPER_ADMIN) return UserRole.WARD_SECRETARY;
  if (role === UserRole.WARD_SECRETARY) return UserRole.AREA_COORDINATOR;
  if (role === UserRole.AREA_COORDINATOR) return UserRole.VOLUNTEER;
  return null;
}

function isResolvedStatus(status: ComplaintStatus) {
  return status === ComplaintStatus.RESOLVED || status === ComplaintStatus.CLOSED;
}

function assertStatusTransition(actorRole: UserRole, fromStatus: ComplaintStatus, toStatus: ComplaintStatus) {
  if (fromStatus === toStatus) {
    throw new Error("Status is unchanged.");
  }

  if (actorRole === UserRole.SUPER_ADMIN) {
    return;
  }

  const allowedTransitions: Record<UserRole, Array<[ComplaintStatus, ComplaintStatus[]]>> = {
    [UserRole.SUPER_ADMIN]: [],
    [UserRole.WARD_SECRETARY]: [
      [ComplaintStatus.NEW, [ComplaintStatus.VERIFIED]],
      [ComplaintStatus.VERIFIED, [ComplaintStatus.ASSIGNED]],
      [ComplaintStatus.ASSIGNED, [ComplaintStatus.IN_PROGRESS]],
      [ComplaintStatus.IN_PROGRESS, [ComplaintStatus.WAITING_GOVT, ComplaintStatus.RESOLVED]],
      [ComplaintStatus.WAITING_GOVT, [ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED]],
      [ComplaintStatus.RESOLVED, [ComplaintStatus.CLOSED]],
    ],
    [UserRole.AREA_COORDINATOR]: [
      [ComplaintStatus.ASSIGNED, [ComplaintStatus.IN_PROGRESS]],
      [ComplaintStatus.IN_PROGRESS, [ComplaintStatus.WAITING_GOVT, ComplaintStatus.RESOLVED]],
      [ComplaintStatus.WAITING_GOVT, [ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED]],
    ],
    [UserRole.VOLUNTEER]: [
      [ComplaintStatus.ASSIGNED, [ComplaintStatus.IN_PROGRESS]],
      [ComplaintStatus.IN_PROGRESS, [ComplaintStatus.RESOLVED]],
    ],
  };

  const transitions = allowedTransitions[actorRole] ?? [];
  const allowed = transitions.find(([from]) => from === fromStatus)?.[1] ?? [];

  if (!allowed.includes(toStatus)) {
    throw new Error(`Role not allowed to move complaint from ${fromStatus} to ${toStatus}.`);
  }
}

async function loadComplaintAccess(service: ReturnType<typeof createSupabaseServiceClient>, complaintId: string, wardId: string | null, isSuperAdmin: boolean) {
  const complaintColumns = await getPublicTableColumns(service as any, "complaints");
  const selectColumns = [
    "id",
    "complaint_number",
    "ward_id",
    "current_status",
    "mobile",
    "updated_at",
  ]
    .filter((column) => complaintColumns.has(column))
    .join(",");

  let query = service.from("complaints").select(selectColumns).eq("id", complaintId);

  if (!isSuperAdmin) {
    query = query.eq("ward_id", wardId ?? "00000000-0000-0000-0000-000000000000");
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

async function insertComplaintStatusHistory(
  service: ReturnType<typeof createSupabaseServiceClient>,
  args: {
    complaintId: string;
    oldStatus: ComplaintStatus | null;
    newStatus: ComplaintStatus;
    remarks: string | null;
    updatedBy: string;
  },
) {
  const columns = await getPublicTableColumns(service as any, "complaint_status_history");
  const payload = pickInsertPayload(columns, {
    id: randomUUID(),
    complaint_id: args.complaintId,
    old_status: args.oldStatus,
    new_status: args.newStatus,
    remarks: args.remarks,
    updated_by: args.updatedBy,
    created_at: new Date().toISOString(),
  });

  const { data, error } = await service.from("complaint_status_history").insert(payload as any).select("id").single();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ?? null;
}

async function removeComplaintStatusHistory(service: ReturnType<typeof createSupabaseServiceClient>, id: string | null) {
  if (!id) return;
  await service.from("complaint_status_history").delete().eq("id", id);
}

async function updateComplaintStatus(
  service: ReturnType<typeof createSupabaseServiceClient>,
  args: {
    complaintId: string;
    toStatus: ComplaintStatus;
    assignedUserId?: string | null;
  },
) {
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    current_status: args.toStatus,
    updated_at: now,
  };

  if (args.assignedUserId !== undefined) {
    payload.assigned_user_id = args.assignedUserId;
  }

  const { error } = await service.from("complaints").update(payload as any).eq("id", args.complaintId);
  if (error) {
    throw new Error(error.message);
  }
}

async function insertComplaintAssignment(
  service: ReturnType<typeof createSupabaseServiceClient>,
  args: {
    complaintId: string;
    assignedTo: string;
    assignedBy: string;
    remarks: string | null;
  },
) {
  const columns = await getPublicTableColumns(service as any, "complaint_assignments");
  const now = new Date().toISOString();
  const payload = pickInsertPayload(columns, {
    id: randomUUID(),
    complaint_id: args.complaintId,
    assigned_to: args.assignedTo,
    assigned_by: args.assignedBy,
    remarks: args.remarks,
    created_at: now,
  });

  const { data, error } = await service.from("complaint_assignments").insert(payload as any).select("id").single();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ?? null;
}

async function removeComplaintAssignment(service: ReturnType<typeof createSupabaseServiceClient>, id: string | null) {
  if (!id) return;
  await service.from("complaint_assignments").delete().eq("id", id);
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
    const complaint: any = await loadComplaintAccess(
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

    if (action === "verify" || action === "status") {
      const parsed = adminComplaintStatusChangeSchema.safeParse({
        status: action === "verify" ? ComplaintStatus.VERIFIED : String(formData.get("status") ?? ""),
        remarks: String(formData.get("remarks") ?? ""),
      });

      if (!parsed.success) {
        return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "சரியான தகவலை உள்ளிடவும்." }, { status: 400 });
      }

      const currentStatus = complaint.current_status as ComplaintStatus;
      assertStatusTransition(session.profile.role, currentStatus, parsed.data.status);

      const historyId = await insertComplaintStatusHistory(service, {
        complaintId,
        oldStatus: currentStatus,
        newStatus: parsed.data.status,
        remarks: parsed.data.remarks || null,
        updatedBy: session.user.id,
      });

      try {
        await updateComplaintStatus(service, {
          complaintId,
          toStatus: parsed.data.status,
        });
      } catch (error) {
        await removeComplaintStatusHistory(service, historyId);
        throw error;
      }

      await recordAuditEvent({
        actor_id: session.user.id,
        action: action === "verify" ? "verify_complaint" : "change_complaint_status",
        entity_type: "complaint",
        entity_id: complaintId,
        details: { status: parsed.data.status, remarks: parsed.data.remarks || null },
      });

      void notifyComplaintStatusChange(
        {
          name: "Citizen",
          phone: (complaint as any).mobile ?? undefined,
        },
        (complaint as any).complaint_number ?? complaintId,
        parsed.data.status,
      );

      return NextResponse.json({ ok: true, message: action === "verify" ? "புகார் சரிபார்க்கப்பட்டது." : "நிலை புதுப்பிக்கப்பட்டது." });
    }

    if (action === "assign") {
      const parsed = adminComplaintAssignmentSchema.safeParse({
        assigned_to: String(formData.get("assigned_to") ?? ""),
        remarks: String(formData.get("remarks") ?? ""),
      });

      if (!parsed.success) {
        return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "சரியான தகவலை உள்ளிடவும்." }, { status: 400 });
      }

      const targetUserResult = await service.from("users").select("id,role,is_active").eq("id", parsed.data.assigned_to).maybeSingle();
      if (targetUserResult.error) {
        throw new Error(targetUserResult.error.message);
      }
      if (!targetUserResult.data || !targetUserResult.data.is_active) {
        return NextResponse.json({ ok: false, error: "ஒதுக்க வேண்டிய பயனர் கிடைக்கவில்லை." }, { status: 400 });
      }

      const targetRole = targetUserResult.data.role as UserRole;
      const expectedRole = nextAssignmentRole(session.profile.role);
      if (!expectedRole || targetRole !== expectedRole) {
        return NextResponse.json({ ok: false, error: `Role ${session.profile.role} can assign only to ${expectedRole ?? "-"}.` }, { status: 400 });
      }

      const currentStatus = complaint.current_status as ComplaintStatus;
      const assignmentId = await insertComplaintAssignment(service, {
        complaintId,
        assignedTo: parsed.data.assigned_to,
        assignedBy: session.user.id,
        remarks: parsed.data.remarks || null,
      });

      const historyId = await insertComplaintStatusHistory(service, {
        complaintId,
        oldStatus: currentStatus,
        newStatus: ComplaintStatus.ASSIGNED,
        remarks: parsed.data.remarks || null,
        updatedBy: session.user.id,
      });

      try {
        await updateComplaintStatus(service, {
          complaintId,
          toStatus: ComplaintStatus.ASSIGNED,
          assignedUserId: parsed.data.assigned_to,
        });
      } catch (error) {
        await removeComplaintStatusHistory(service, historyId);
        await removeComplaintAssignment(service, assignmentId);
        throw error;
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

    if (action === "comment") {
      const parsed = adminComplaintCommentSchema.safeParse({
        remarks: String(formData.get("remarks") ?? ""),
      });

      if (!parsed.success) {
        return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "சரியான தகவலை உள்ளிடவும்." }, { status: 400 });
      }

      await insertComplaintStatusHistory(service, {
        complaintId,
        oldStatus: complaint.current_status as ComplaintStatus,
        newStatus: complaint.current_status as ComplaintStatus,
        remarks: parsed.data.remarks,
        updatedBy: session.user.id,
      });

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
            id: randomUUID(),
            complaint_id: complaintId,
            file_url: publicUrlData.publicUrl,
            media_type: file.type || "image/jpeg",
            uploaded_by: session.user.id,
            created_at: new Date().toISOString(),
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
