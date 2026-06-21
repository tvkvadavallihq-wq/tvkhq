import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin-session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";
  const isAdminArea = pathname.startsWith("/admin/") && pathname !== "/admin/login";

  if (!isLogin && !isAdminArea) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? null;
  const userId = await verifyAdminSessionToken(token);

  if (!userId && isAdminArea) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
