import { isSupabaseConfigured } from "@/lib/env";
import { ComplaintStatus, UserRole } from "@/lib/enums";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getPublicTableColumns, pickSelectColumns } from "@/lib/supabase/table-columns";
import type { AdminProfile } from "@/lib/repositories/admin";
import type { ComplaintFilterOptions } from "@/lib/repositories/complaints";
import { getComplaintFilterOptions } from "@/lib/repositories/complaints";
import { getWardNumber } from "@/lib/ward-utils";

type SupabaseClient = any;

export type AdminComplaintListFilters = {
  q?: string;
  ward?: string;
  category?: string;
  status?: ComplaintStatus;
  sort?: "created_at" | "updated_at" | "priority" | "current_status";
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export type AdminComplaintListItem = {
  id: string;
  complaint_number: string;
  mobile: string;
  title: string;
  address: string;
  current_status: ComplaintStatus;
  priority: number;
  ward_number: number | null;
  category_name_ta: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export type AdminComplaintListResult = {
  items: AdminComplaintListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type AdminComplaintAssignmentRow = {
  id: string;
  complaint_id: string;
  assigned_to: string;
  assigned_by: string | null;
  assigned_by_role: UserRole | null;
  assigned_to_role: UserRole | null;
  remarks: string | null;
  created_at: string;
};

export type AdminComplaintStatusRow = {
  id: string;
  complaint_id: string;
  old_status: ComplaintStatus | null;
  new_status: ComplaintStatus | null;
  remarks: string | null;
  updated_by: string | null;
  created_at: string;
};

export type AdminComplaintMediaRow = {
  id: string;
  complaint_id: string;
  file_url: string | null;
  media_type: string;
  uploaded_by: string | null;
  created_at: string | null;
};

export type AdminComplaintUser = {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  ward_id: string | null;
  ward_number: number | null;
};

export type AdminComplaintActivity =
  | {
      id: string;
      kind: "status";
      title: string;
      note: string | null;
      created_at: string;
      actor_name: string | null;
      actor_role: UserRole | null;
      from_status: ComplaintStatus | null;
      to_status: ComplaintStatus | null;
    }
  | {
      id: string;
      kind: "assignment";
      title: string;
      note: string | null;
      created_at: string;
      actor_name: string | null;
      actor_role: UserRole | null;
      target_name: string | null;
      target_role: UserRole | null;
    }
  | {
      id: string;
      kind: "media";
      title: string;
      note: string | null;
      created_at: string;
      actor_name: string | null;
      actor_role: UserRole | null;
      media_type: string;
      url: string | null;
    };

export type AdminComplaintDetail = {
  complaint: {
    id: string;
    complaint_number: string;
    mobile: string;
    title: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    description: string;
    current_status: ComplaintStatus;
    priority: number;
    ward_id: string;
    category_id: string;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
    ward_number: number | null;
    category_name_ta: string | null;
  } | null;
  currentAssignment: AdminComplaintAssignmentRow | null;
  assignments: AdminComplaintAssignmentRow[];
  statusHistory: AdminComplaintStatusRow[];
  media: AdminComplaintMediaRow[];
  activityFeed: AdminComplaintActivity[];
  usersById: Record<string, AdminComplaintUser>;
};

export type AdminComplaintActionConfig = {
  canVerify: boolean;
  allowedStatuses: ComplaintStatus[];
  assignableUsers: AdminComplaintUser[];
};

function getClient(): SupabaseClient {
  return createSupabaseServiceClient() as any;
}

function isConfigured() {
  return isSupabaseConfigured();
}

function normalizePage(page?: number) {
  return page && page > 0 ? page : 1;
}

function resolveMediaUrl(_client: SupabaseClient, media: { file_url: string | null }) {
  return Promise.resolve(media.file_url ?? null);
}

function nextAssignmentRole(role: UserRole | null | undefined) {
  if (role === UserRole.SUPER_ADMIN) return UserRole.WARD_SECRETARY;
  if (role === UserRole.WARD_SECRETARY) return UserRole.AREA_COORDINATOR;
  if (role === UserRole.AREA_COORDINATOR) return UserRole.VOLUNTEER;
  return null;
}

function allowedStatusesForRole(role: UserRole | null | undefined, current: ComplaintStatus) {
  const byRole: Record<UserRole, ComplaintStatus[]> = {
    [UserRole.SUPER_ADMIN]: [
      ComplaintStatus.NEW,
      ComplaintStatus.VERIFIED,
      ComplaintStatus.ASSIGNED,
      ComplaintStatus.IN_PROGRESS,
      ComplaintStatus.WAITING_GOVT,
      ComplaintStatus.RESOLVED,
      ComplaintStatus.CLOSED,
      ComplaintStatus.REJECTED,
    ],
    [UserRole.WARD_SECRETARY]: [
      ComplaintStatus.VERIFIED,
      ComplaintStatus.ASSIGNED,
      ComplaintStatus.IN_PROGRESS,
      ComplaintStatus.WAITING_GOVT,
      ComplaintStatus.RESOLVED,
      ComplaintStatus.CLOSED,
      ComplaintStatus.REJECTED,
    ],
    [UserRole.AREA_COORDINATOR]: [
      ComplaintStatus.IN_PROGRESS,
      ComplaintStatus.WAITING_GOVT,
      ComplaintStatus.RESOLVED,
      ComplaintStatus.REJECTED,
    ],
    [UserRole.VOLUNTEER]: [ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED],
  };

  const allowed = role ? byRole[role] : [];
  return allowed.filter((status) => status !== current);
}

async function getUsersMap(client: SupabaseClient, ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));

  if (uniqueIds.length === 0) {
    return {} as Record<string, AdminComplaintUser>;
  }

  const { data } = await client
    .from("users")
    .select("id,name,mobile,role,ward_id,wards(*)")
    .in("id", uniqueIds);

  const map: Record<string, AdminComplaintUser> = {};

  (data ?? []).forEach((user: any) => {
    const wardRelation = Array.isArray(user.wards) ? user.wards[0] ?? null : user.wards ?? null;
    map[user.id] = {
      id: user.id,
      full_name: user.name ?? user.full_name ?? "",
      phone: user.mobile ?? user.phone ?? null,
      role: user.role,
      ward_id: user.ward_id ?? null,
      ward_number: getWardNumber(wardRelation) ?? null,
    };
  });

  return map;
}

function applyScope(query: SupabaseClient, profile: AdminProfile) {
  if (profile.role === UserRole.SUPER_ADMIN) {
    return query;
  }

  if (profile.ward_id) {
    return query.eq("ward_id", profile.ward_id);
  }

  return query.eq("ward_id", "00000000-0000-0000-0000-000000000000");
}

export async function getAdminComplaintFilterOptions(): Promise<ComplaintFilterOptions> {
  return getComplaintFilterOptions();
}

export async function getAdminComplaintList(
  profile: AdminProfile,
  filters: AdminComplaintListFilters = {},
): Promise<AdminComplaintListResult> {
  if (!isConfigured()) {
    return { items: [], total: 0, page: 1, pageSize: filters.pageSize ?? 12, pageCount: 0 };
  }

  const client = getClient();
  const pageSize = filters.pageSize ?? 12;
  const page = normalizePage(filters.page);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sort = filters.sort ?? "created_at";
  const order = filters.order ?? "desc";
  const scopeQuery = (q: any) => applyScope(q, profile);

  const selectBase =
    "id,complaint_number,mobile,title,address,current_status,priority,created_at,updated_at,ward_id,category_id,wards(*),complaint_categories(name_ta)";

  let query = scopeQuery(client.from("complaints").select(selectBase, { count: "exact" }));

  if (filters.q) {
    const q = filters.q.trim().replace(/,/g, " ");
    if (q) {
      query = query.or(`complaint_number.ilike.%${q}%,mobile.ilike.%${q}%,title.ilike.%${q}%,address.ilike.%${q}%`);
    }
  }

  if (filters.ward) {
    query = query.eq("ward_id", filters.ward);
  }

  if (filters.category) {
    query = query.eq("category_id", filters.category);
  }

  if (filters.status) {
    query = query.eq("current_status", filters.status);
  }

  query = query.order(sort, { ascending: order === "asc" });
  if (sort !== "created_at") {
    query = query.order("created_at", { ascending: false });
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
      complaint_number: item.complaint_number,
      mobile: item.mobile,
      title: item.title,
      address: item.address,
      current_status: item.current_status,
      priority: item.priority,
      ward_number: getWardNumber(wardRelation) ?? null,
      category_name_ta: categoryRelation?.name_ta ?? null,
      created_at: item.created_at,
      updated_at: item.updated_at,
      resolved_at: null,
    };
  });

  const total = count ?? 0;
  const pageCount = total > 0 ? Math.ceil(total / pageSize) : 0;

  return { items, total, page, pageSize, pageCount };
}

export async function getAdminComplaintDetail(
  complaintId: string,
  profile: AdminProfile,
): Promise<AdminComplaintDetail> {
  if (!isConfigured()) {
    return {
      complaint: null,
      currentAssignment: null,
      assignments: [],
      statusHistory: [],
      media: [],
      activityFeed: [],
      usersById: {},
    };
  }

  const client = getClient();

  const complaintSelectBase =
    "id,complaint_number,mobile,title,address,latitude,longitude,description,current_status,priority,ward_id,category_id,created_at,updated_at,wards(*),complaint_categories(name_ta)";

  const complaintResult = await applyScope(client.from("complaints").select(complaintSelectBase), profile)
    .eq("id", complaintId)
    .maybeSingle();
  let complaint = complaintResult.data ?? null;
  const complaintError = complaintResult.error;

  if (complaintError) {
    throw new Error(complaintError.message);
  }

  const [assignmentColumns, statusHistoryColumns] = await Promise.all([
    getPublicTableColumns(client, "complaint_assignments"),
    getPublicTableColumns(client, "complaint_status_history"),
  ]);
  const assignmentOrderColumn = assignmentColumns.has("created_at")
    ? "created_at"
    : assignmentColumns.has("assigned_at")
      ? "assigned_at"
      : "id";

  const assignmentSelect = pickSelectColumns(assignmentColumns, [
    "id",
    "complaint_id",
    "assigned_to",
    "assigned_by",
    "assigned_by_role",
    "assigned_to_role",
    "remarks",
    "note",
    "assigned_at",
    "created_at",
    "created_by",
    "closed_at",
  ]).join(",");
  const statusHistorySelect = pickSelectColumns(statusHistoryColumns, [
    "id",
    "complaint_id",
    "old_status",
    "new_status",
    "remarks",
    "updated_by",
    "created_at",
    "from_status",
    "to_status",
    "note",
    "changed_by",
    "created_by",
    "activity_type",
  ]).join(",");

  const [{ data: assignments }, { data: statusHistory }, { data: media }] = await Promise.all([
    client.from("complaint_assignments").select(assignmentSelect).eq("complaint_id", complaintId).order(assignmentOrderColumn, { ascending: true }),
    client.from("complaint_status_history").select(statusHistorySelect).eq("complaint_id", complaintId).order("created_at", { ascending: true }),
    client.from("complaint_media").select("id,complaint_id,file_url,media_type,uploaded_by,created_at").eq("complaint_id", complaintId).order("created_at", { ascending: true }),
  ]);

  const assignmentRows = (assignments ?? []).map((row: any) => ({
    id: row.id,
    complaint_id: row.complaint_id,
    assigned_to: row.assigned_to,
    assigned_by: row.assigned_by ?? null,
    assigned_by_role: row.assigned_by_role ?? null,
    assigned_to_role: row.assigned_to_role ?? null,
    remarks: row.remarks ?? row.note ?? null,
    created_at: row.created_at ?? row.assigned_at ?? new Date().toISOString(),
  })) as AdminComplaintAssignmentRow[];
  const statusRows = (statusHistory ?? []).map((row: any) => ({
    id: row.id,
    complaint_id: row.complaint_id,
    old_status: (row.old_status ?? row.from_status ?? null) as ComplaintStatus | null,
    new_status: (row.new_status ?? row.to_status ?? null) as ComplaintStatus | null,
    remarks: row.remarks ?? row.note ?? null,
    updated_by: row.updated_by ?? row.changed_by ?? row.created_by ?? null,
    created_at: row.created_at,
  })) as AdminComplaintStatusRow[];
  const mediaRows = (media ?? []) as AdminComplaintMediaRow[];

  const userIds = [
    ...assignmentRows.flatMap((row) => [row.assigned_to, row.assigned_by ?? ""]),
    ...statusRows.flatMap((row) => [row.updated_by ?? ""]),
    ...mediaRows.map((row) => row.uploaded_by ?? ""),
  ].filter(Boolean);

  const usersById = await getUsersMap(client, userIds);

  const hydratedMedia = await Promise.all(mediaRows.map(async (item) => ({ ...item, file_url: await resolveMediaUrl(client, item) })));

  const wardRelation = Array.isArray((complaint as any)?.wards) ? (complaint as any).wards[0] ?? null : (complaint as any)?.wards ?? null;
  const categoryRelation = Array.isArray((complaint as any)?.complaint_categories)
    ? (complaint as any).complaint_categories[0] ?? null
    : (complaint as any)?.complaint_categories ?? null;

  const activityFeed: AdminComplaintActivity[] = [
    {
      id: `created-${complaint?.id ?? complaintId}`,
      kind: "status" as const,
      title: "Complaint created",
      note: null,
      created_at: complaint?.created_at ?? new Date().toISOString(),
      actor_name: null,
      actor_role: null,
      from_status: null,
      to_status: complaint?.current_status ?? null,
    },
    ...statusRows.map((row): AdminComplaintActivity => ({
      id: row.id,
      kind: "status" as const,
      title: row.old_status && row.new_status && row.old_status !== row.new_status ? "Status changed" : "Comment added",
      note: row.remarks,
      created_at: row.created_at,
      actor_name: row.updated_by ? usersById[row.updated_by]?.full_name ?? null : null,
      actor_role: row.updated_by ? usersById[row.updated_by]?.role ?? null : null,
      from_status: row.old_status,
      to_status: row.new_status,
    })),
    ...assignmentRows.map((row): AdminComplaintActivity => ({
      id: row.id,
      kind: "assignment" as const,
      title: "Assignment recorded",
      note: row.remarks,
      created_at: row.created_at,
      actor_name: row.assigned_by ? usersById[row.assigned_by]?.full_name ?? null : null,
      actor_role: row.assigned_by ? usersById[row.assigned_by]?.role ?? null : null,
      target_name: usersById[row.assigned_to]?.full_name ?? null,
      target_role: usersById[row.assigned_to]?.role ?? row.assigned_to_role ?? null,
    })),
    ...hydratedMedia.map((row): AdminComplaintActivity => ({
      id: row.id,
      kind: "media" as const,
      title: row.media_type.startsWith("video/") ? "Video uploaded" : "Image uploaded",
      note: null,
      created_at: row.created_at ?? new Date().toISOString(),
      actor_name: row.uploaded_by ? usersById[row.uploaded_by]?.full_name ?? null : null,
      actor_role: row.uploaded_by ? usersById[row.uploaded_by]?.role ?? null : null,
      media_type: row.media_type,
      url: row.file_url,
    })),
  ]
    .filter(Boolean)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    complaint: complaint
      ? {
          id: complaint.id,
          complaint_number: complaint.complaint_number,
          mobile: complaint.mobile,
          title: complaint.title,
          address: complaint.address,
          latitude: complaint.latitude,
          longitude: complaint.longitude,
          description: complaint.description,
          current_status: complaint.current_status,
          priority: complaint.priority,
          ward_id: complaint.ward_id,
          category_id: complaint.category_id,
          created_at: complaint.created_at,
          updated_at: complaint.updated_at,
          resolved_at: null,
          ward_number: getWardNumber(wardRelation) ?? null,
          category_name_ta: categoryRelation?.name_ta ?? null,
        }
      : null,
    currentAssignment: assignmentRows[assignmentRows.length - 1] ?? null,
    assignments: assignmentRows,
    statusHistory: statusRows,
    media: hydratedMedia,
    activityFeed,
    usersById,
  };
}

export async function getAdminComplaintActionConfig(
  profile: AdminProfile,
  currentStatus: ComplaintStatus,
  wardId: string,
): Promise<AdminComplaintActionConfig> {
  if (!isConfigured()) {
    return { canVerify: false, allowedStatuses: [], assignableUsers: [] };
  }

  const client = getClient();
  const targetRole = nextAssignmentRole(profile.role);
  if (profile.role !== UserRole.SUPER_ADMIN && !profile.ward_id) {
    return {
      canVerify: profile.role !== UserRole.VOLUNTEER,
      allowedStatuses: allowedStatusesForRole(profile.role, currentStatus),
      assignableUsers: [],
    };
  }
  const assignableUsers =
    targetRole === null
      ? []
      : (await client
          .from("users")
          .select("id,name,mobile,role,ward_id,wards(*)")
          .eq("is_active", true)
        .eq("role", targetRole)
        .order("name")).data?.map((user: any) => {
          const wardRelation = Array.isArray(user.wards) ? user.wards[0] ?? null : user.wards ?? null;
          return {
            id: user.id,
            full_name: user.name ?? user.full_name ?? "",
            phone: user.mobile ?? user.phone ?? null,
            role: user.role,
            ward_id: user.ward_id ?? null,
            ward_number: getWardNumber(wardRelation) ?? null,
          };
        }) ?? [];

  const scopedAssignableUsers =
    profile.role === UserRole.SUPER_ADMIN
      ? assignableUsers
      : assignableUsers.filter((user: AdminComplaintUser) => user.ward_id === profile.ward_id || user.ward_id === wardId);

  return {
    canVerify: profile.role !== UserRole.VOLUNTEER,
    allowedStatuses: allowedStatusesForRole(profile.role, currentStatus),
    assignableUsers: scopedAssignableUsers,
  };
}
