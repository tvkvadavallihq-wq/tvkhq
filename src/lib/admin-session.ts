import type { NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "tvkhq_admin_session";
const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 12;

type AdminSessionPayload = {
  sub: string;
  iat: number;
  exp: number;
  v: 1;
};

function getAdminSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret) {
    throw new Error("Admin session secret is missing.");
  }

  return secret;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function importSessionKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAdminSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signPayload(payload: AdminSessionPayload) {
  const serialized = JSON.stringify(payload);
  const encodedPayload = toBase64Url(new TextEncoder().encode(serialized));
  const key = await importSessionKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encodedPayload));
  return `${encodedPayload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function createAdminSessionToken(userId: string) {
  const now = Date.now();
  return signPayload({
    sub: userId,
    iat: now,
    exp: now + ADMIN_SESSION_TTL_MS,
    v: 1,
  });
}

export async function verifyAdminSessionToken(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) {
    return null;
  }

  try {
    const key = await importSessionKey();
    const isValid = await crypto.subtle.verify("HMAC", key, fromBase64Url(encodedSignature), new TextEncoder().encode(encodedPayload));
    if (!isValid) {
      return null;
    }

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encodedPayload))) as AdminSessionPayload;
    if (!payload || payload.v !== 1 || typeof payload.sub !== "string" || typeof payload.exp !== "number") {
      return null;
    }

    if (payload.exp < Date.now()) {
      return null;
    }

    return payload.sub;
  } catch {
    return null;
  }
}

export function setAdminSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_MS / 1000,
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
