import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/admin-session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAdminSessionCookie(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
