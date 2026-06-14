import { isSupabaseConfigured } from "@/lib/env";
import { UserRole } from "@/lib/enums";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sanitizeText } from "@/lib/security/sanitize";
import type { AdminProfile } from "@/lib/repositories/admin";
import { getWardNumber } from "@/lib/ward-utils";

type SupabaseClient = any;

export type AdminWardRow = {
  id: string;
  ward_number: number;
  ward_name: string | null;
  assembly_constituency: string | null;
  city: string | null;
  district: string | null;
  secretary_name: string | null;
  secretary_mobile: string | null;
  secretary_whatsapp: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

export type AdminCategoryRow = {
  id: string;
  name_ta: string;
  name_en: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
};

export type AdminPocRow = {
  id: string;
  ward_id: string;
  ward_number: number | null;
  name: string;
  mobile: string;
  whatsapp: string | null;
  area_name: string;
  is_active: boolean;
  created_at: string;
};

export type AdminAreaRow = {
  id: string;
  ward_id: string;
  ward_number: number | null;
  name: string;
  pincode: string | null;
  created_at: string;
};

export type AdminAnnouncementRow = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
};

export type AdminBannerRow = {
  id: string;
  title: string;
  image_url: string | null;
  redirect_url: string | null;
  display_order: number | null;
  is_active: boolean;
  created_at: string;
};

export type AdminUserRow = {
  id: string;
  username: string | null;
  name: string;
  mobile: string | null;
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
  areas: AdminAreaRow[];
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
        name: String(row.name ?? row.full_name ?? row.username ?? ""),
        mobile: row.mobile ?? row.phone ?? null,
        role: row.role,
        ward_id: row.ward_id ?? null,
        ward_number: getWardNumber(wardRelation) ?? null,
        is_active: row.is_active,
        has_credentials: Boolean(row.password_hash),
        created_at: row.created_at ?? null,
        updated_at: row.updated_at ?? null,
      } satisfies AdminUserRow;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAdminMasterData(profile: AdminProfile): Promise<AdminMasterData> {
  if (!isSupabaseConfigured()) {
    return { wards: [], categories: [], pocs: [], areas: [], announcements: [], banners: [], users: [] };
  }

  const client = getClient();
  const canManageGlobal = isSuperAdmin(profile);
  const wardFilter = profile.ward_id;

  const wards = await safeQuery<any>(() =>
    client.from("wards").select("id,*").order("ward_number", { ascending: true }),
  ).then((rows) =>
    rows.map((row: any) => ({
      id: row.id,
      ward_number: Number(row.ward_number ?? row.number ?? 0),
      ward_name: row.ward_name ?? null,
      assembly_constituency: row.assembly_constituency ?? null,
      city: row.city ?? null,
      district: row.district ?? null,
      secretary_name: row.secretary_name ?? null,
      secretary_mobile: row.secretary_mobile ?? null,
      secretary_whatsapp: row.secretary_whatsapp ?? null,
      is_active: row.is_active ?? true,
      created_at: row.created_at ?? new Date().toISOString(),
      updated_at: row.updated_at ?? null,
    } satisfies AdminWardRow)),
  );

  const categories = canManageGlobal
    ? await safeQuery<AdminCategoryRow>(() =>
        client.from("complaint_categories").select("id,name_ta,name_en,icon,is_active,created_at").order("name_ta"),
      )
    : [];

  const pocs = await safeQuery<AdminPocRow>(() =>
    client
      .from("area_pocs")
      .select("id,ward_id,name,mobile,whatsapp,area_name,is_active,created_at,wards(*)")
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
          mobile: row.mobile,
          whatsapp: row.whatsapp ?? null,
          area_name: row.area_name,
          is_active: row.is_active,
          created_at: row.created_at,
        } satisfies AdminPocRow;
      })
      .filter((row) => (canManageGlobal ? true : row.ward_id === wardFilter)),
  );

  const areas = canManageGlobal
    ? await safeQuery<any>(() =>
        client
          .from("areas")
          .select("id,ward_id,name,pincode,created_at,wards(*)")
          .order("created_at", { ascending: false }),
      ).then((rows) =>
        rows.map((row: any) => {
          const wardRelation = Array.isArray(row.wards) ? row.wards[0] ?? null : row.wards ?? null;
          return {
            id: row.id,
            ward_id: row.ward_id,
            ward_number: getWardNumber(wardRelation) ?? null,
            name: row.name,
            pincode: row.pincode ?? null,
            created_at: row.created_at,
          } satisfies AdminAreaRow;
        }),
      )
    : [];

  const announcements = canManageGlobal
    ? await safeQuery<any>(() =>
        client.from("announcements").select("id,title,content,image_url,created_by,created_at").order("created_at", { ascending: false }),
      ).then((rows) =>
        rows.map((row: any) => ({
          id: row.id,
          title: row.title,
          content: row.content,
          image_url: row.image_url ?? null,
          created_by: row.created_by ?? null,
          created_at: row.created_at,
        } satisfies AdminAnnouncementRow)),
      )
    : [];

  const banners = canManageGlobal
    ? await safeQuery<AdminBannerRow>(() =>
        client.from("banners").select("id,title,image_url,redirect_url,display_order,is_active,created_at").order("display_order", { ascending: true }),
      )
    : [];

  const users = canManageGlobal ? await loadAdminUsers(client) : [];

  return { wards, categories, pocs, areas, announcements, banners, users };
}

export type MasterActionType =
  | "create-category"
  | "toggle-category"
  | "create-ward"
  | "toggle-ward"
  | "create-area"
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
        icon: sanitizeText(String(formData.get("icon") ?? "")) || null,
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
        ward_name: sanitizeText(String(formData.get("ward_name") ?? "")) || null,
        assembly_constituency: sanitizeText(String(formData.get("assembly_constituency") ?? "")) || null,
        city: sanitizeText(String(formData.get("city") ?? "")) || null,
        district: sanitizeText(String(formData.get("district") ?? "")) || null,
        secretary_name: sanitizeText(String(formData.get("secretary_name") ?? "")) || null,
        secretary_mobile: sanitizeText(String(formData.get("secretary_mobile") ?? "")) || null,
        secretary_whatsapp: sanitizeText(String(formData.get("secretary_whatsapp") ?? "")) || null,
      };
    case "create-area":
      return {
        ward_id: sanitizeText(String(formData.get("ward_id") ?? "")),
        name: sanitizeText(String(formData.get("name") ?? "")),
        pincode: sanitizeText(String(formData.get("pincode") ?? "")) || null,
      };
    case "create-poc":
      return {
        ward_id: String(formData.get("ward_id") ?? ""),
        name: sanitizeText(String(formData.get("name") ?? "")),
        mobile: sanitizeText(String(formData.get("mobile") ?? "")),
        whatsapp: sanitizeText(String(formData.get("whatsapp") ?? "")) || null,
        area_name: sanitizeText(String(formData.get("area_name") ?? "")),
      };
    case "create-announcement":
      return {
        title: sanitizeText(String(formData.get("title") ?? "")),
        content: sanitizeText(String(formData.get("content") ?? "")),
        image_url: sanitizeText(String(formData.get("image_url") ?? "")) || null,
      };
    case "create-banner":
      return {
        title: sanitizeText(String(formData.get("title") ?? "")),
        image_url: sanitizeText(String(formData.get("image_url") ?? "")) || null,
        redirect_url: sanitizeText(String(formData.get("redirect_url") ?? "")) || null,
        display_order: Number(String(formData.get("display_order") ?? "0")) || 0,
      };
    case "create-user":
      return {
        username: sanitizeText(String(formData.get("username") ?? "")) || null,
        password: sanitizeText(String(formData.get("password") ?? "")) || null,
        name: sanitizeText(String(formData.get("name") ?? "")),
        mobile: sanitizeText(String(formData.get("mobile") ?? "")) || null,
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
