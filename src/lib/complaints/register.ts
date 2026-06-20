import { randomUUID } from "node:crypto";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { ComplaintStatus } from "@/lib/enums";
import { sanitizePhone, sanitizeText } from "@/lib/security/sanitize";
import { recordAuditEvent } from "@/lib/services/audit";
import { notifyComplaintCreated } from "@/lib/services/notifications";
import { logError } from "@/lib/services/logger";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getAreaName, getWardNameTa, getWardNumber } from "@/lib/ward-utils";
import { complaintSchema, type ComplaintFormValues } from "@/lib/validators";

export type ComplaintRegistrationInput = ComplaintFormValues;

function complaintTitle(categoryNameTa: string, areaName: string) {
  return `${categoryNameTa} - ${areaName}`.slice(0, 160);
}

function fileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.trim().toLowerCase();
  if (fromName) {
    return fromName;
  }

  if (file.type.includes("/")) {
    return file.type.split("/").pop() ?? "bin";
  }

  return "bin";
}

function cleanSegment(value: string) {
  return value
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "file";
}

function buildStoragePath(trackingId: string, folder: "images" | "videos", file: File, index: number) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `complaints/${trackingId}/${folder}/${stamp}-${index + 1}-${cleanSegment(file.name)}.${fileExtension(file)}`;
}

function generateComplaintNumber(createdAt = new Date()) {
  const year = createdAt.getFullYear();
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `TVK-CBE-${year}-${suffix}`;
}

async function insertComplaintRow(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  payload: {
    id: string;
    complaint_number: string;
    ward_id: string;
    category_id: string;
    mobile: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    title: string;
    description: string;
    current_status: ComplaintStatus;
  },
) {
  return supabase.from("complaints").insert(payload).select("id,complaint_number").single();
}

export async function registerComplaintSubmission(rawInput: unknown) {
  const parsed = complaintSchema.parse(rawInput);
  const supabase = createSupabaseServiceClient();
  const complainantPhone = sanitizePhone(parsed.complainant_phone);
  const areaName = sanitizeText(parsed.area_name);
  const address = sanitizeText(parsed.address);
  const description = sanitizeText(parsed.description);

  const [
    { data: category, error: categoryError },
    { data: ward, error: wardError },
    { data: areaRows, error: areaError },
  ] = await Promise.all([
    supabase.from("complaint_categories").select("id,name_ta").eq("id", parsed.category_id).single(),
    supabase.from("wards").select("id,*").eq("id", parsed.ward_id).single(),
    supabase.from("areas").select("id,ward_id,name").eq("ward_id", parsed.ward_id).eq("name", areaName),
  ]);

  if (categoryError) {
    throw new Error("புகார் வகையைப் பெற முடியவில்லை.");
  }

  if (wardError) {
    throw new Error("வார்டு விவரத்தைப் பெற முடியவில்லை.");
  }

  if (areaError) {
    throw new Error("பகுதி விவரத்தைப் பெற முடியவில்லை.");
  }

  const matchingArea = (areaRows ?? [])[0] ?? null;

  if (!matchingArea) {
    throw new Error("தேர்ந்த பகுதி அந்த வார்டில் கிடைக்கவில்லை.");
  }

  const complaintPayload = {
    id: randomUUID(),
    complaint_number: generateComplaintNumber(),
    ward_id: parsed.ward_id,
    category_id: parsed.category_id,
    mobile: complainantPhone,
    address,
    latitude: parsed.gps_latitude,
    longitude: parsed.gps_longitude,
    title: complaintTitle(category.name_ta, getAreaName(matchingArea as any) ?? areaName),
    description,
    current_status: ComplaintStatus.NEW,
  } satisfies Parameters<typeof insertComplaintRow>[1];

  let created;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    created = await insertComplaintRow(supabase, { ...complaintPayload, complaint_number: generateComplaintNumber() });
    if (!created.error && created.data) {
      break;
    }

    const message = created.error?.message ?? "";
    const isDuplicateNumber = /duplicate key value violates unique constraint|unique constraint/i.test(message);
    if (!isDuplicateNumber || attempt === 4) {
      throw new Error(message || "புகார் பதிவை உருவாக்க முடியவில்லை.");
    }
  }

  const complaint = created!.data!;
  const uploadedPaths: string[] = [];
  const filesToStore = [
    ...parsed.image_files.map((file) => ({ file, folder: "images" as const })),
    ...parsed.video_files.map((file) => ({ file, folder: "videos" as const })),
  ];

  try {
    for (const [index, item] of filesToStore.entries()) {
      const path = buildStoragePath(complaint.complaint_number, item.folder, item.file, index);
      const uploadResult = await supabase.storage.from(STORAGE_BUCKETS.complaintMedia).upload(path, item.file, {
        contentType: item.file.type,
        upsert: false,
      });

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message);
      }

      uploadedPaths.push(path);
      const { data: publicUrlData } = supabase.storage.from(STORAGE_BUCKETS.complaintMedia).getPublicUrl(path);

      const mediaInsert = await supabase.from("complaint_media").insert({
        id: randomUUID(),
        complaint_id: complaint.id,
        media_type: item.file.type,
        file_url: publicUrlData.publicUrl,
        uploaded_by: null,
        created_at: new Date().toISOString(),
      });

      if (mediaInsert.error) {
        throw new Error(mediaInsert.error.message);
      }
    }
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(STORAGE_BUCKETS.complaintMedia).remove(uploadedPaths);
    }

    await supabase.from("complaints").delete().eq("id", complaint.id);
    logError("Complaint submission rollback", error, { trackingId: complaint.complaint_number });
    throw error instanceof Error ? error : new Error("கோப்புகளைப் பதிவேற்ற முடியவில்லை.");
  }

  await recordAuditEvent({
    actor_id: null,
    action: "complaint_created",
    entity_type: "complaint",
    entity_id: complaint.id,
    details: {
      tracking_id: complaint.complaint_number,
      ward_id: parsed.ward_id,
      category_id: parsed.category_id,
      file_count: filesToStore.length,
    },
  });

  void notifyComplaintCreated(
    { name: parsed.complainant_name, phone: complainantPhone },
    complaint.complaint_number,
    getWardNameTa(ward as any) ?? "வார்டு",
    category.name_ta,
  );

  return {
    complaintId: complaint.id,
    trackingId: complaint.complaint_number,
    categoryNameTa: category.name_ta,
    wardNameTa: getWardNameTa(ward as any),
    wardNumber: getWardNumber(ward as any),
    fileCount: filesToStore.length,
    imageCount: parsed.image_files.length,
    videoCount: parsed.video_files.length,
  };
}
