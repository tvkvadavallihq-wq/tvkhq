import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getWardNumber } from "@/lib/ward-utils";
import { unstable_noStore as noStore } from "next/cache";

export type HomepageSearchParams = {
  area?: string;
  ward?: string;
};

export type HomepageBanner = {
  id: string;
  title: string;
  image_url: string | null;
  redirect_url: string | null;
  display_order: number | null;
};

export type HomepageAnnouncement = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
};

export type HomepageWardContact = {
  id: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  address: string | null;
  area_name: string | null;
  ward_id: string | null;
  ward_number: number | null;
  ward_name_ta: string | null;
};

export type HomepageStats = {
  total: number;
  resolved: number;
  pending: number;
  resolutionRate: number;
};

export type HomepageContent = {
  banners: HomepageBanner[];
  announcements: HomepageAnnouncement[];
  wardContacts: HomepageWardContact[];
  stats: HomepageStats;
};

type RawWardRow = { id: string; number?: number | string | null; ward_number?: number | string | null };
type RawWardContactRow = {
  id: string;
  name: string;
  mobile: string;
  whatsapp: string | null;
  area_name: string | null;
  ward_id: string | null;
  is_active?: boolean | null;
  wards?: RawWardRow | RawWardRow[] | null;
};

function resolutionRate(total: number, resolved: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((resolved / total) * 100);
}

export async function getPublicHomeContent(searchParams: HomepageSearchParams = {}) {
  if (!isSupabaseConfigured()) {
    return {
      banners: [],
      announcements: [],
      wardContacts: [],
      stats: { total: 0, resolved: 0, pending: 0, resolutionRate: 0 },
    } satisfies HomepageContent;
  }

  const supabase = createSupabaseServiceClient() as any;
  const normalizedArea = searchParams.area?.trim();
  const normalizedWard = searchParams.ward?.trim();

  const [bannersResult, announcementsResult, contactsResult, wardsResult, totalResult, resolvedResult, pendingResult] = await Promise.all([
    supabase.from("banners").select("id,title,image_url,redirect_url,display_order").order("display_order", { ascending: true }).limit(5),
    supabase
      .from("announcements")
      .select("id,title,content,image_url,created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("area_pocs").select("id,name,mobile,whatsapp,area_name,ward_id,is_active,wards(*)").eq("is_active", true).order("area_name", { ascending: true }),
    supabase.from("wards").select("id,*").eq("is_active", true),
    supabase.from("complaints").select("id", { count: "exact", head: true }),
    supabase.from("complaints").select("id", { count: "exact", head: true }).in("current_status", ["RESOLVED", "CLOSED"]),
    supabase.from("complaints").select("id", { count: "exact", head: true }).in("current_status", ["NEW", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "WAITING_GOVT"]),
  ]);

  const wardNumberById = new Map<string, number>();
  (wardsResult.data ?? []).forEach((ward: any) => {
    const wardNumber = getWardNumber(ward);
    if (wardNumber !== null) {
      wardNumberById.set(String(ward.id), wardNumber);
    }
  });

  const wardContacts = (contactsResult.data ?? [])
    .map((contact: RawWardContactRow) => {
      const wardRelation = Array.isArray(contact.wards) ? contact.wards[0] ?? null : contact.wards ?? null;
      const wardNumber = wardRelation ? getWardNumber(wardRelation) ?? null : contact.ward_id ? wardNumberById.get(String(contact.ward_id)) ?? null : null;

      return {
        id: contact.id,
        name: contact.name,
        phone: contact.mobile,
        whatsapp: contact.whatsapp ?? null,
        address: null,
        area_name: contact.area_name ?? null,
        ward_id: contact.ward_id ?? null,
        ward_number: wardNumber,
        ward_name_ta: null,
      } satisfies HomepageWardContact;
    })
    .filter((contact: HomepageWardContact) => {
      if (!normalizedArea && !normalizedWard) {
        return true;
      }

      const areaMatch = normalizedArea
        ? [contact.area_name, contact.name]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(normalizedArea.toLowerCase()))
        : true;

      const wardMatch = normalizedWard
        ? [contact.ward_number?.toString(), contact.ward_id]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(normalizedWard.toLowerCase()))
        : true;

      return areaMatch && wardMatch;
    });

  return {
    banners: (bannersResult.data ?? []) as HomepageBanner[],
    announcements: (announcementsResult.data ?? []) as HomepageAnnouncement[],
    wardContacts,
    stats: {
      total: totalResult.count ?? 0,
      resolved: resolvedResult.count ?? 0,
      pending: pendingResult.count ?? 0,
      resolutionRate: resolutionRate(totalResult.count ?? 0, resolvedResult.count ?? 0),
    },
  } satisfies HomepageContent;
}

export async function getComplaintFormOptions(): Promise<{
  wards: Array<{ id: string; ward_number: number }>;
  categories: Array<{ id: string; name_ta: string }>;
}> {
  noStore();
  if (!isSupabaseConfigured()) {
    return { wards: [], categories: [] };
  }

  const supabase = createSupabaseServiceClient() as any;
  const [{ data: wards }, { data: categories }] = await Promise.all([
    supabase.from("wards").select("id,*").order("id"),
    supabase.from("complaint_categories").select("id,name_ta").eq("is_active", true).order("name_ta"),
  ]);

  const wardOptions: Array<{ id: string; ward_number: number }> = (wards ?? [])
    .map((ward: RawWardRow) => ({ id: ward.id, ward_number: getWardNumber(ward) ?? 0 }))
    .sort((a: { id: string; ward_number: number }, b: { id: string; ward_number: number }) => a.ward_number - b.ward_number);

  return {
    wards: wardOptions,
    categories: (categories ?? []) as Array<{ id: string; name_ta: string }>,
  };
}

export async function getComplaintAreas(wardId: string) {
  noStore();
  if (!isSupabaseConfigured() || !wardId) {
    return [];
  }

  const supabase = createSupabaseServiceClient() as any;
  const { data } = await supabase
    .from("area_pocs")
    .select("id,ward_id,area_name,is_active")
    .eq("ward_id", wardId)
    .eq("is_active", true)
    .order("area_name");

  const seen = new Set<string>();
  return (data ?? [])
    .map((row: { id: string; ward_id: string | null; area_name: string }) => ({
      id: row.id,
      ward_id: row.ward_id ?? null,
      area_name: row.area_name,
    }))
    .filter((row: { id: string; ward_id: string | null; area_name: string }) => {
      const key = `${row.ward_id}:${row.area_name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export async function getPublicComplaints() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createSupabaseServiceClient() as any;
  const { data } = await supabase
    .from("complaints")
    .select("id,complaint_number,title,address,current_status,created_at,updated_at,wards(*),complaint_categories(name_ta)")
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}

export async function getHomepageFilters(): Promise<{ wards: Array<{ id: string; ward_number: number }> }> {
  if (!isSupabaseConfigured()) {
    return { wards: [] };
  }

  const supabase = createSupabaseServiceClient() as any;
  const { data } = await supabase.from("wards").select("id,*").order("id");

  const wards = (data ?? [])
    .map((ward: RawWardRow) => ({ id: ward.id, ward_number: getWardNumber(ward) ?? 0 }))
    .sort((a: { id: string; ward_number: number }, b: { id: string; ward_number: number }) => a.ward_number - b.ward_number);

  return { wards };
}
