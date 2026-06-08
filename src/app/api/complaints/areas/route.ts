import { NextResponse } from "next/server";
import { getComplaintAreas } from "@/lib/repositories/public";
import { sanitizeText } from "@/lib/security/sanitize";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wardId = sanitizeText(searchParams.get("ward_id") ?? "");

  if (!wardId) {
    return NextResponse.json({ ok: true, areas: [] });
  }

  const areas = await getComplaintAreas(wardId);
  return NextResponse.json({ ok: true, areas });
}
