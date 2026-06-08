import { isSupabaseConfigured } from "@/lib/env";
import { UserRole } from "@/lib/enums";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sanitizeSlug, sanitizeText } from "@/lib/security/sanitize";
import type { AdminProfile } from "@/lib/repositories/admin";
import { getWardNumber } from "@/lib/ward-utils";

type SupabaseClient = any;

export type AdminWardRow = {
  id: string;
  ward_number: number;
  name_ta: string;
  name_en: string | null;
  is_active: boolean;
  created_at: string;
};

export type AdminCategoryRow = {
  id: string;
  name_ta: string;
  name_en: string | null;
  slug: string;
  is_active: boolean;
  created_at: string;
};

export type AdminPocRow = {
  id: string;
  ward_id: string;
  ward_number: number | null;
  name: string;
  phone: string;
  area_name: string;
  is_active: boolean;
  created_at: string;
};

export type AdminAnnouncementRow = {
  id: string;
  title_ta: string;
  body_ta: string;
  is_active: boolean;
  published_at: string | null;
  created_at: string;
};

export type AdminBannerRow = {
  id: string;
  title_ta: string;
  image_path: string | null;
  link_url: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

export type AdminUserRow = {
  id: string;
  username: string | null;
  full_name: string;
  phone: string | null;
  role: UserRole;
  ward_id: string | null;
  ward_number: number | null;
  is_active: boolean;
  has_credentials: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminMasterData = {
  wards: AdminWardRow[];
  categories: AdminCategoryRow[];
  pocs: AdminPocRow[];
  announcements: AdminAnnouncementRow[];
  banners: AdminBannerRow[];
  users: AdminUserRow[];
};

function getClient() {
  return createSupabaseServiceClient() as SupabaseClient;
}

function isSuperAdmin(profile: AdminProfile) {
  return profile.role === UserRole.SUPER_ADMIN;
}

async function safeQuery<T>(fn: () => Promise<{ data: T[] | null; error: { message: string } | null }>) {
  try {
    const result = await fn();
    if (result.error) {
      return [];
    }
    return (result.data ?? []) as T[];
  } catch {
    return [];
  }
}

async function loadAdminUsers(client: SupabaseClient): Promise<AdminUserRow[]> {
  const profiles = await safeQuery<any>(() =>
    client
      .from("users")
      .select("*,wards(*)")
      .order("created_at", { ascending: false }),
  );

  return profiles
    .map((row: any) => {
      const wardRelation = Array.isArray(row.wards) ? row.wards[0] ?? null : row.wards ?? null;
      return {
        id: String(row.id),
        username: row.username ?? null,
        full_name: String(row.full_name ?? row.name ?? row.username ?? ""),
        phone: row.phone ?? null,
        role: row.role,
        ward_id: row.ward_id ?? null,
        ward_number: getWardNumber(wardRelation) ?? null,
        is_active: row.is_active,
        has_credentials: Boolean(row.password_hash),
        created_at: row.created_at ?? null,
        updated_at: row.updated_at ?? null,
      } satisfies AdminUserRow;
    })
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export async function getAdminMasterData(profile: AdminProfile): Promise<AdminMasterData> {
  if (!isSupabaseConfigured()) {
    return { wards: [], categories: [], pocs: [], announcements: [], banners: [], users: [] };
  }

  const client = getClient();
  const canManageGlobal = isSuperAdmin(profile);
  const wardFilter = profile.ward_id;

  const wards = await safeQuery<AdminWardRow>(() =>
    client.from("wards").select("id,*").order("created_at", { ascending: false }),
  );

  const categories = canManageGlobal
    ? await safeQuery<AdminCategoryRow>(() =>
        client.from("complaint_categories").select("id,name_ta,name_en,slug,is_active,created_at").order("name_ta"),
      )
    : [];

  const pocs = await safeQuery<AdminPocRow>(() =>
    client
      .from("area_pocs")
      .select("id,ward_id,name,phone,area_name,is_active,created_at,wards(*)")
      .order("created_at", { ascending: false }),
  ).then((rows) =>
    rows
      .map((row: any) => {
        const wardRelation = Array.isArray(row.wards) ? row.wards[0] ?? null : row.wards ?? null;
        return {
          id: row.id,
          ward_id: row.ward_id,
          ward_number: getWardNumber(wardRelation) ?? null,
          name: row.name,
          phone: row.phone,
          area_name: row.area_name,
          is_active: row.is_active,
          created_at: row.created_at,
        } satisfies AdminPocRow;
      })
      .filter((row) => (canManageGlobal ? true : row.ward_id === wardFilter)),
  );

  const announcements = canManageGlobal
    ? await safeQuery<AdminAnnouncementRow>(() =>
        client.from("announcements").select("id,title_ta,body_ta,is_active,published_at,created_at").order("created_at", { ascending: false }),
      )
    : [];

  const banners = canManageGlobal
    ? await safeQuery<AdminBannerRow>(() =>
        client.from("banners").select("id,title_ta,image_path,link_url,is_active,starts_at,ends_at,created_at").order("created_at", { ascending: false }),
      )
    : [];

  const users = canManageGlobal ? await loadAdminUsers(client) : [];

  return { wards, categories, pocs, announcements, banners, users };
}

export type MasterActionType =
  | "create-category"
  | "toggle-category"
  | "create-ward"
  | "toggle-ward"
  | "create-poc"
  | "toggle-poc"
  | "create-announcement"
  | "toggle-announcement"
  | "create-banner"
  | "toggle-banner"
  | "create-user"
  | "toggle-user";

export function normalizeMasterActionValue(action: MasterActionType, formData: FormData) {
  switch (action) {
    case "create-category":
      return {
        name_ta: sanitizeText(String(formData.get("name_ta") ?? "")),
        name_en: sanitizeText(String(formData.get("name_en") ?? "")) || null,
        slug: sanitizeSlug(String(formData.get("slug") ?? "")),
      };
    case "toggle-category":
    case "toggle-ward":
    case "toggle-poc":
    case "toggle-announcement":
    case "toggle-banner":
      return {
        id: String(formData.get("id") ?? ""),
        is_active: String(formData.get("is_active") ?? "true") !== "false",
      };
    case "create-ward":
      return {
        ward_number: Number(String(formData.get("ward_number") ?? "")),
        name_ta: sanitizeText(String(formData.get("name_ta") ?? "")),
        name_en: sanitizeText(String(formData.get("name_en") ?? "")) || null,
      };
    case "create-poc":
      return {
        ward_id: String(formData.get("ward_id") ?? ""),
        name: sanitizeText(String(formData.get("name") ?? "")),
        phone: sanitizeText(String(formData.get("phone") ?? "")),
        area_name: sanitizeText(String(formData.get("area_name") ?? "")),
      };
    case "create-announcement":
      return {
        title_ta: sanitizeText(String(formData.get("title_ta") ?? "")),
        body_ta: sanitizeText(String(formData.get("body_ta") ?? "")),
      };
    case "create-banner":
      return {
        title_ta: sanitizeText(String(formData.get("title_ta") ?? "")),
        image_path: sanitizeText(String(formData.get("image_path") ?? "")) || null,
        link_url: sanitizeText(String(formData.get("link_url") ?? "")) || null,
      };
    case "create-user":
      return {
        username: sanitizeText(String(formData.get("username") ?? "")) || null,
        password: sanitizeText(String(formData.get("password") ?? "")) || null,
        full_name: sanitizeText(String(formData.get("full_name") ?? "")),
        phone: sanitizeText(String(formData.get("phone") ?? "")) || null,
        role: String(formData.get("role") ?? "") as UserRole,
        ward_id: sanitizeText(String(formData.get("ward_id") ?? "")) || null,
        is_active: String(formData.get("is_active") ?? "true") !== "false",
      };
    case "toggle-user":
      return {
        id: String(formData.get("id") ?? ""),
        is_active: String(formData.get("is_active") ?? "true") !== "false",
      };
    default:
      return {};
  }
}
