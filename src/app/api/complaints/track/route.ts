import { NextResponse } from "next/server";
import { getComplaintTrackingDetails } from "@/lib/repositories/complaints";
import { checkRateLimit, getClientRateLimitKey, RATE_LIMITS } from "@/lib/security/rate-limit";
import { trackingSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(getClientRateLimitKey(request), RATE_LIMITS.complaintLookup.limit, RATE_LIMITS.complaintLookup.windowMs);
    if (!rate.allowed) {
      return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = trackingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message ?? "சரியான தகவலை உள்ளிடவும்.",
        },
        { status: 400 },
      );
    }

    const complaint = await getComplaintTrackingDetails(parsed.data.tracking_id, parsed.data.phone);

    if (!complaint) {
      return NextResponse.json(
        {
          ok: false,
          error: "இந்த புகார் எண் அல்லது மொபைல் எண் பொருந்தவில்லை.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      complaint,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "புகார் நிலையை பெற முடியவில்லை.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
