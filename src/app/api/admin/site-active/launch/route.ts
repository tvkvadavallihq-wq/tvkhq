import { NextResponse } from "next/server";
import { launchSite } from "@/lib/repositories/site";
import { logError } from "@/lib/services/logger";

export async function POST() {
  try {
    const result = await launchSite();

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logError("Site launch failed", error);
    const message = error instanceof Error ? error.message : "Launch செய்ய முடியவில்லை.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
