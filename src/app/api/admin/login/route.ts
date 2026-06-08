import { compare } from "bcryptjs";
import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createAdminSessionToken, clearAdminSessionCookie, setAdminSessionCookie } from "@/lib/admin-session";
import { sanitizeUsername } from "@/lib/security/sanitize";
import { adminLoginSchema } from "@/lib/validators";
import { UserRole } from "@/lib/enums";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { logError } from "@/lib/services/logger";

async function verifyPassword(password: string, passwordHash: string) {
  const normalizedHash = passwordHash.trim();

  if (normalizedHash.startsWith("$2")) {
    return compare(password, normalizedHash);
  }

  if (normalizedHash.startsWith("sha256$")) {
    const digest = normalizedHash.slice("sha256$".length);
    const computed = createHash("sha256").update(password).digest("hex");
    const left = Buffer.from(computed, "hex");
    const right = Buffer.from(digest, "hex");
    return left.length === right.length && timingSafeEqual(left, right);
  }

  return password === normalizedHash;
}

function failureResponse(message: string, status = 400) {
  const response = NextResponse.json({ ok: false, error: message }, { status });
  clearAdminSessionCookie(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = adminLoginSchema.safeParse(body);

    if (!parsed.success) {
      return failureResponse(parsed.error.issues[0]?.message ?? "சரியான தகவலை உள்ளிடவும்.");
    }

    const client = createSupabaseServiceClient() as any;
    const username = sanitizeUsername(parsed.data.username);
    const password = parsed.data.password;

    const { data: profile, error } = await client
      .from("users")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!profile) {
      return failureResponse("Username அல்லது கடவுச்சொல் தவறானது.", 401);
    }

    if (!profile.is_active) {
      return failureResponse("இந்த கணக்கு முடக்கப்பட்டுள்ளது.", 403);
    }

    const allowedRoles = new Set<UserRole>([
      UserRole.SUPER_ADMIN,
      UserRole.WARD_SECRETARY,
      UserRole.AREA_COORDINATOR,
      UserRole.VOLUNTEER,
    ]);

    if (!allowedRoles.has(profile.role)) {
      return failureResponse("இந்த கணக்குக்கு admin access இல்லை.", 403);
    }

    if (!profile.password_hash) {
      return failureResponse("இந்த கணக்கிற்கு password hash இல்லை.", 403);
    }

    const isValidPassword = await verifyPassword(password, profile.password_hash);
    if (!isValidPassword) {
      return failureResponse("Username அல்லது கடவுச்சொல் தவறானது.", 401);
    }

    const token = await createAdminSessionToken(profile.id);
    const response = NextResponse.json({ ok: true });
    setAdminSessionCookie(response, token);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    logError("Admin login failed", error);
    const message = error instanceof Error ? error.message : "உள்நுழைவு முடியவில்லை.";
    return failureResponse(message);
  }
}
