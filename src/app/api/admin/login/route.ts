import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sanitizeEmail } from "@/lib/security/sanitize";
import { adminLoginSchema } from "@/lib/validators";
import { UserRole } from "@/lib/enums";
import { logError } from "@/lib/services/logger";

function createRouteClient(request: Request, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return Array.from(request.headers.get("cookie")?.split(";").map((cookie) => {
            const [name, ...rest] = cookie.trim().split("=");
            return name ? { name, value: rest.join("=") } : null;
          }).filter(Boolean) ?? []) as Array<{ name: string; value: string }>;
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );
}

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie.name, cookie.value, cookie);
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = adminLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "சரியான தகவலை உள்ளிடவும்." }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true });
    const supabase = createRouteClient(request, response);
    const email = sanitizeEmail(parsed.data.email);
    const password = parsed.data.password;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return NextResponse.json({ ok: false, error: error?.message ?? "உள்நுழைவு முடியவில்லை." }, { status: 400 });
    }

    const service = createSupabaseServiceClient() as any;
    const { data: profile } = await service
      .from("users")
      .select("id,full_name,role,is_active")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.auth.signOut().catch(() => null);
      const errorResponse = NextResponse.json({ ok: false, error: "இந்த கணக்குக்கு admin access இல்லை. public.users row தேவை." }, { status: 403 });
      copyCookies(response, errorResponse);
      return errorResponse;
    }

    const allowedRoles = new Set<UserRole>([
      UserRole.SUPER_ADMIN,
      UserRole.WARD_SECRETARY,
      UserRole.AREA_COORDINATOR,
      UserRole.VOLUNTEER,
    ]);

    if (!profile.is_active) {
      await supabase.auth.signOut().catch(() => null);
      const errorResponse = NextResponse.json(
        { ok: false, error: "இந்த கணக்கின் admin profile முடக்கப்பட்டுள்ளது. public.users.is_active = true தேவை." },
        { status: 403 },
      );
      copyCookies(response, errorResponse);
      return errorResponse;
    }

    if (!allowedRoles.has(profile.role)) {
      await supabase.auth.signOut().catch(() => null);
      const errorResponse = NextResponse.json(
        { ok: false, error: "இந்த கணக்குக்கு சரியான admin role இல்லை. public.users.role சரிபார்க்கவும்." },
        { status: 403 },
      );
      copyCookies(response, errorResponse);
      return errorResponse;
    }

    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    logError("Admin login failed", error);
    const message = error instanceof Error ? error.message : "உள்நுழைவு முடியவில்லை.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
