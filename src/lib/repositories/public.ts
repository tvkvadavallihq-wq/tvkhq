import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type HomepageSearchParams = {
  area?: string;
  ward?: string;
};

export type HomepageBanner = {
  id: string;
  title_ta: string;
  image_path: string | null;
  link_url: string | null;
};

export type HomepageAnnouncement = {
  id: string;
  title_ta: string;
  body_ta: string;
  published_at: string | null;
};

export type HomepageWardContact = {
  id: string;
  name: string;
  designation_ta: string;
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

  const supabase = await createSupabaseServerClient();
  const normalizedArea = searchParams.area?.trim();
  const normalizedWard = searchParams.ward?.trim();

  const [bannersResult, announcementsResult, contactsResult, totalResult, resolvedResult, pendingResult] = await Promise.all([
    supabase.from("banners").select("id,title_ta,image_path,link_url").order("created_at", { ascending: false }).limit(5),
    supabase
      .from("announcements")
      .select("id,title_ta,body_ta,published_at")
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("ward_contacts")
      .select("id,name,designation_ta,phone,whatsapp,address,ward_id,wards!ward_contacts_ward_id_fkey(number)")
      .order("created_at", { ascending: false }),
    supabase.from("complaints").select("id", { count: "exact", head: true }),
    supabase.from("complaints").select("id", { count: "exact", head: true }).in("current_status", ["RESOLVED", "CLOSED"]),
    supabase.from("complaints").select("id", { count: "exact", head: true }).in("current_status", ["NEW", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "WAITING_GOVT"]),
  ]);

  const wardContacts = (contactsResult.data ?? [])
    .map((contact) => {
      const wardRelation = Array.isArray(contact.wards) ? contact.wards[0] : contact.wards;

      return {
        id: contact.id,
        name: contact.name,
        designation_ta: contact.designation_ta,
        phone: contact.phone,
        whatsapp: contact.whatsapp ?? null,
        address: contact.address ?? null,
        area_name: null,
        ward_id: contact.ward_id ?? null,
        ward_number: wardRelation?.number ?? null,
        ward_name_ta: null,
      };
    })
    .filter((contact) => {
      if (!normalizedArea && !normalizedWard) {
        return true;
      }

      const areaMatch = normalizedArea
        ? [contact.name, contact.address]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(normalizedArea.toLowerCase()))
        : true;

      const wardMatch = normalizedWard
        ? [contact.ward_number?.toString()]
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

export async function getComplaintFormOptions() {
  if (!isSupabaseConfigured()) {
    return { wards: [], categories: [], areas: [] };
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: wards }, { data: categories }, { data: areas }] = await Promise.all([
    supabase.from("wards").select("id,number").order("number"),
    supabase.from("complaint_categories").select("id,name_ta").eq("is_active", true).order("name_ta"),
    supabase
      .from("area_pocs")
      .select("id,ward_id,area_name,wards!area_pocs_ward_id_fkey(number)")
      .eq("is_active", true)
      .order("area_name"),
  ]);

  const normalizedAreas = Array.from(
    new Map(
      (areas ?? [])
        .map((area: any) => {
          const wardRelation = Array.isArray(area.wards) ? area.wards[0] ?? null : area.wards ?? null;
          return [
            `${area.ward_id}:${area.area_name}`,
            {
              id: String(area.id),
              ward_id: area.ward_id ?? null,
              ward_number: wardRelation?.number ?? null,
              area_name: area.area_name,
            },
          ] as const;
        })
        .filter(([, area]) => Boolean(area.area_name)),
    ).values(),
  ).sort((a, b) => {
    const wardDiff = (a.ward_number ?? 0) - (b.ward_number ?? 0);
    return wardDiff !== 0 ? wardDiff : a.area_name.localeCompare(b.area_name);
  });

  return {
    wards: (wards ?? []).map((ward: any) => ({ id: ward.id, ward_number: ward.number })),
    categories: categories ?? [],
    areas: normalizedAreas,
  };
}

export async function getPublicComplaints() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("complaints")
    .select("id,complaint_number,title,address,current_status,created_at,updated_at,wards(number),complaint_categories(name_ta)")
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}

export async function getHomepageFilters(): Promise<{ wards: Array<{ id: string; ward_number: number }> }> {
  if (!isSupabaseConfigured()) {
    return { wards: [] };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("wards").select("id,number").order("number");

  return { wards: (data ?? []).map((ward: any) => ({ id: ward.id, ward_number: ward.number })) };
}
