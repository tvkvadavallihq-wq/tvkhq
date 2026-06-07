import { NextResponse } from "next/server";
import { checkRateLimit, getClientRateLimitKey, RATE_LIMITS } from "@/lib/security/rate-limit";
import { registerComplaintSubmission } from "@/lib/complaints/register";

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(getClientRateLimitKey(request), RATE_LIMITS.complaintSubmission.limit, RATE_LIMITS.complaintSubmission.windowMs);
    if (!rate.allowed) {
      return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
    }

    const formData = await request.formData();
    const input = {
      complainant_name: String(formData.get("complainant_name") ?? ""),
      complainant_phone: String(formData.get("complainant_phone") ?? ""),
      ward_id: String(formData.get("ward_id") ?? ""),
      area_name: String(formData.get("area_name") ?? ""),
      address: String(formData.get("address") ?? ""),
      gps_latitude: String(formData.get("gps_latitude") ?? ""),
      gps_longitude: String(formData.get("gps_longitude") ?? ""),
      category_id: String(formData.get("category_id") ?? ""),
      description: String(formData.get("description") ?? ""),
      image_files: formData.getAll("image_files").filter((value): value is File => value instanceof File),
      video_files: formData.getAll("video_files").filter((value): value is File => value instanceof File),
    };

    const result = await registerComplaintSubmission(input);

    return NextResponse.json({
      ok: true,
      complaintId: result.complaintId,
      trackingId: result.trackingId,
      wardNumber: result.wardNumber,
      wardNameTa: result.wardNameTa,
      categoryNameTa: result.categoryNameTa,
      fileCount: result.fileCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "புகார் பதிவை நிறைவேற்ற முடியவில்லை.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
