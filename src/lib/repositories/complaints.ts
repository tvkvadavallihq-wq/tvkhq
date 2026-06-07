import { isSupabaseConfigured } from "@/lib/env";
import { ComplaintStatus } from "@/lib/enums";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type ComplaintFilterOptions = {
  wards: Array<{ id: string; ward_number: number }>;
  categories: Array<{ id: string; name_ta: string }>;
};

export type ComplaintListFilters = {
  ward?: string;
  category?: string;
  status?: ComplaintStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type PublicComplaintListItem = {
  id: string;
  tracking_id: string;
  title: string;
  address: string;
  status: ComplaintStatus;
  created_at: string;
  resolved_at: string | null;
  ward_number: number | null;
  category_name_ta: string | null;
};

export type PublicComplaintListResult = {
  items: PublicComplaintListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type ComplaintTrackingHistory = {
  id: string;
  note: string | null;
  created_at: string;
};

export type ComplaintTrackingAssignment = {
  id: string;
  note: string | null;
  assigned_at: string;
  assigned_to: {
    id: string;
    full_name: string;
    phone: string | null;
    role: string;
  } | null;
};

export type ComplaintTrackingMedia = {
  id: string;
  file_url: string;
  media_type: string;
  created_at: string;
};

export type ComplaintTrackingResult = {
  id: string;
  tracking_id: string;
  mobile: string;
  title: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  status: ComplaintStatus;
  created_at: string;
  resolved_at: string | null;
  ward: { id: string; ward_number: number } | null;
  category: { id: string; name_ta: string } | null;
  assignment: ComplaintTrackingAssignment | null;
  history: ComplaintTrackingHistory[];
  media: ComplaintTrackingMedia[];
};

function getComplaintClient(): any {
  return createSupabaseServiceClient() as any;
}

function normalizePage(page?: number) {
  return page && page > 0 ? page : 1;
}

function parseDate(date?: string) {
  if (!date) return null;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function resolveDate(status: ComplaintStatus, updatedAt: string) {
  return status === ComplaintStatus.RESOLVED || status === ComplaintStatus.CLOSED ? updatedAt : null;
}

export async function getComplaintFilterOptions(): Promise<ComplaintFilterOptions> {
  if (!isSupabaseConfigured()) {
    return { wards: [], categories: [] };
  }

  const supabase = getComplaintClient();
  const [{ data: wards }, { data: categories }] = await Promise.all([
    supabase.from("wards").select("id,number").order("number"),
    supabase.from("complaint_categories").select("id,name_ta").eq("is_active", true).order("name_ta"),
  ]);

  return {
    wards: (wards ?? []).map((ward: any) => ({ id: ward.id, ward_number: ward.number })),
    categories: categories ?? [],
  };
}

async function loadComplaintByNumber(trackingId: string, phone?: string): Promise<ComplaintTrackingResult | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = getComplaintClient();
  const normalizedTrackingId = trackingId.trim().toUpperCase();
  const normalizedPhone = phone?.trim();

  let complaintQuery = supabase
    .from("complaints")
    .select("id,complaint_number,mobile,title,address,latitude,longitude,description,current_status,created_at,updated_at,wards(id,number),complaint_categories(id,name_ta)")
    .eq("complaint_number", normalizedTrackingId);

  if (normalizedPhone) {
    complaintQuery = complaintQuery.eq("mobile", normalizedPhone);
  }

  const { data: complaint, error } = await complaintQuery.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!complaint) {
    return null;
  }

  const [assignmentResult, historyResult, mediaResult] = await Promise.all([
    supabase
      .from("complaint_assignments")
      .select("id,assigned_to,remarks,created_at")
      .eq("complaint_id", complaint.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("complaint_status_history").select("id,remarks,created_at").eq("complaint_id", complaint.id).order("created_at"),
    supabase.from("complaint_media").select("id,file_url,media_type,created_at").eq("complaint_id", complaint.id).order("created_at"),
  ]);

  if (assignmentResult.error) {
    throw new Error(assignmentResult.error.message);
  }
  if (historyResult.error) {
    throw new Error(historyResult.error.message);
  }
  if (mediaResult.error) {
    throw new Error(mediaResult.error.message);
  }

  const assignedUserId = assignmentResult.data?.assigned_to ?? null;
  const assignedUserResult = assignedUserId
    ? await supabase.from("users").select("id,full_name,phone,role").eq("id", assignedUserId).maybeSingle()
    : { data: null, error: null };

  if (assignedUserResult.error) {
    throw new Error(assignedUserResult.error.message);
  }

  const wardRelation = Array.isArray(complaint.wards) ? complaint.wards[0] ?? null : complaint.wards ?? null;
  const categoryRelation = Array.isArray(complaint.complaint_categories)
    ? complaint.complaint_categories[0] ?? null
    : complaint.complaint_categories ?? null;

  return {
    id: complaint.id,
    tracking_id: complaint.complaint_number,
    mobile: complaint.mobile,
    title: complaint.title,
    address: complaint.address,
    latitude: complaint.latitude,
    longitude: complaint.longitude,
    description: complaint.description,
    status: complaint.current_status,
    created_at: complaint.created_at,
    resolved_at: resolveDate(complaint.current_status, complaint.updated_at),
    ward: wardRelation ? { id: wardRelation.id, ward_number: wardRelation.number } : null,
    category: categoryRelation ? { id: categoryRelation.id, name_ta: categoryRelation.name_ta } : null,
    assignment: assignmentResult.data
      ? {
          id: assignmentResult.data.id,
          note: assignmentResult.data.remarks,
          assigned_at: assignmentResult.data.created_at,
          assigned_to: assignedUserResult.data,
        }
      : null,
    history: (historyResult.data ?? []).map((item: any) => ({
      id: item.id,
      note: item.remarks,
      created_at: item.created_at,
    })),
    media: (mediaResult.data ?? []).map((item: any) => ({
      id: item.id,
      file_url: item.file_url,
      media_type: item.media_type,
      created_at: item.created_at,
    })),
  };
}

export async function getComplaintTrackingDetails(trackingId: string, phone: string): Promise<ComplaintTrackingResult | null> {
  return loadComplaintByNumber(trackingId, phone);
}

export async function getComplaintByTrackingId(trackingId: string): Promise<ComplaintTrackingResult | null> {
  return loadComplaintByNumber(trackingId);
}

export async function getPublicComplaintList(filters: ComplaintListFilters = {}): Promise<PublicComplaintListResult> {
  if (!isSupabaseConfigured()) {
    return { items: [], total: 0, page: 1, pageSize: filters.pageSize ?? 12, pageCount: 0 };
  }

  const supabase = getComplaintClient();
  const pageSize = filters.pageSize ?? 12;
  const page = normalizePage(filters.page);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("complaints")
    .select("id,complaint_number,title,address,current_status,created_at,updated_at,wards(id,number),complaint_categories(id,name_ta)", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (filters.ward) {
    query = query.eq("ward_id", filters.ward);
  }
  if (filters.category) {
    query = query.eq("category_id", filters.category);
  }
  if (filters.status) {
    query = query.eq("current_status", filters.status);
  }

  const dateFrom = parseDate(filters.from);
  const dateTo = parseDate(filters.to);

  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }
  if (dateTo) {
    query = query.lte("created_at", dateTo);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const items = (data ?? []).map((item: any) => {
    const wardRelation = Array.isArray(item.wards) ? item.wards[0] ?? null : item.wards ?? null;
    const categoryRelation = Array.isArray(item.complaint_categories)
      ? item.complaint_categories[0] ?? null
      : item.complaint_categories ?? null;

    return {
      id: item.id,
      tracking_id: item.complaint_number,
      title: item.title,
      address: item.address,
      status: item.current_status,
      created_at: item.created_at,
      resolved_at: resolveDate(item.current_status, item.updated_at),
      ward_number: wardRelation?.number ?? null,
      category_name_ta: categoryRelation?.name_ta ?? null,
    };
  });

  const total = count ?? 0;
  const pageCount = total > 0 ? Math.ceil(total / pageSize) : 0;

  return { items, total, page, pageSize, pageCount };
}
