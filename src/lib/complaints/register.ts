import { STORAGE_BUCKETS } from "@/lib/constants";
import { ComplaintStatus } from "@/lib/enums";
import { sanitizePhone, sanitizeText } from "@/lib/security/sanitize";
import { recordAuditEvent } from "@/lib/services/audit";
import { notifyComplaintCreated } from "@/lib/services/notifications";
import { logError } from "@/lib/services/logger";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getAreaName, getAreaWardId, getAreaWardNumber, getWardNameTa, getWardNumber, matchesWardReference } from "@/lib/ward-utils";
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
    supabase.from("area_pocs").select("*,wards(*)").eq("area_name", areaName),
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

  const wardNumber = getWardNumber(ward as any);
  const matchingArea =
    (areaRows ?? []).find((item: unknown) => {
      const candidate = item as Record<string, unknown> & { wards?: unknown };
      const candidateWardId = getAreaWardId(candidate as any);
      const candidateWardNumber = getAreaWardNumber(candidate as any);
      return (
        matchesWardReference(candidateWardId, parsed.ward_id, wardNumber) ||
        (wardNumber !== null && candidateWardNumber === wardNumber)
      );
    }) ?? null;

  if (!matchingArea) {
    throw new Error("தேர்ந்த பகுதி அந்த வார்டில் கிடைக்கவில்லை.");
  }

  const created = await supabase
    .from("complaints")
    .insert({
      ward_id: parsed.ward_id,
      category_id: parsed.category_id,
      complainant_name: parsed.complainant_name,
      complainant_phone: complainantPhone,
      area_name: areaName,
      address,
      gps_latitude: parsed.gps_latitude,
      gps_longitude: parsed.gps_longitude,
      title: complaintTitle(category.name_ta, getAreaName(matchingArea as any) ?? areaName),
      description,
      status: ComplaintStatus.NEW,
    })
    .select("id,tracking_id")
    .single();

  if (created.error || !created.data) {
    throw new Error(created.error?.message ?? "புகார் பதிவை உருவாக்க முடியவில்லை.");
  }

  const complaint = created.data;
  const uploadedPaths: string[] = [];
  const filesToStore = [
    ...parsed.image_files.map((file) => ({ file, folder: "images" as const })),
    ...parsed.video_files.map((file) => ({ file, folder: "videos" as const })),
  ];

  try {
    for (const [index, item] of filesToStore.entries()) {
      const path = buildStoragePath(complaint.tracking_id, item.folder, item.file, index);
      const uploadResult = await supabase.storage.from(STORAGE_BUCKETS.complaintMedia).upload(path, item.file, {
        contentType: item.file.type,
        upsert: false,
      });

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message);
      }

      uploadedPaths.push(path);

      const mediaInsert = await supabase.from("complaint_media").insert({
        complaint_id: complaint.id,
        bucket: STORAGE_BUCKETS.complaintMedia,
        path,
        mime_type: item.file.type,
        size_bytes: item.file.size,
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
    logError("Complaint submission rollback", error, { trackingId: complaint.tracking_id });
    throw error instanceof Error ? error : new Error("கோப்புகளைப் பதிவேற்ற முடியவில்லை.");
  }

  await recordAuditEvent({
    actor_id: null,
    action: "complaint_created",
    entity_type: "complaint",
    entity_id: complaint.id,
    details: {
      tracking_id: complaint.tracking_id,
      ward_id: parsed.ward_id,
      category_id: parsed.category_id,
      file_count: filesToStore.length,
    },
  });

  void notifyComplaintCreated(
    { name: parsed.complainant_name, phone: complainantPhone },
    complaint.tracking_id,
    getWardNameTa(ward as any) ?? "வார்டு",
    category.name_ta,
  );

  return {
    complaintId: complaint.id,
    trackingId: complaint.tracking_id,
    categoryNameTa: category.name_ta,
    wardNameTa: getWardNameTa(ward as any),
    wardNumber: getWardNumber(ward as any),
    fileCount: filesToStore.length,
    imageCount: parsed.image_files.length,
    videoCount: parsed.video_files.length,
  };
}
