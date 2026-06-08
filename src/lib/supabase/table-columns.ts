type TableColumnMap = Record<string, Set<string>>;

const columnMap: TableColumnMap = {
  wards: new Set([
    "id",
    "ward_number",
    "ward_name",
    "assembly_constituency",
    "city",
    "district",
    "secretary_name",
    "secretary_mobile",
    "secretary_whatsapp",
    "created_at",
    "updated_at",
    "is_active",
    "number",
    "name_ta",
    "name_en",
  ]),
  area_pocs: new Set(["id", "ward_id", "name", "mobile", "whatsapp", "area_name", "is_active", "created_at", "updated_at"]),
  complaint_categories: new Set(["id", "name_ta", "name_en", "icon", "is_active", "created_at"]),
  complaints: new Set([
    "id",
    "complaint_number",
    "citizen_name",
    "mobile",
    "ward_id",
    "category_id",
    "title",
    "description",
    "latitude",
    "longitude",
    "address",
    "current_status",
    "assigned_user_id",
    "priority",
    "is_public",
    "created_at",
    "updated_at",
  ]),
  complaint_media: new Set(["id", "complaint_id", "media_type", "file_url", "uploaded_by", "created_at"]),
  complaint_status_history: new Set(["id", "complaint_id", "old_status", "new_status", "remarks", "updated_by", "created_at"]),
  complaint_assignments: new Set([
    "id",
    "complaint_id",
    "assigned_by",
    "assigned_to",
    "remarks",
    "created_at",
  ]),
  users: new Set([
    "id",
    "name",
    "mobile",
    "username",
    "password_hash",
    "role",
    "ward_id",
    "is_active",
    "created_at",
    "updated_at",
    "full_name",
    "phone",
  ]),
  announcements: new Set(["id", "title", "content", "image_url", "created_by", "created_at"]),
  banners: new Set(["id", "title", "image_url", "redirect_url", "display_order", "is_active", "created_at"]),
  ward_contacts: new Set([
    "id",
    "ward_id",
    "designation",
    "name",
    "mobile",
    "whatsapp",
    "address",
    "photo_url",
    "display_order",
    "is_active",
    "created_at",
  ]),
};

const emptyColumns = new Set<string>();

export async function getPublicTableColumns(_client: unknown, tableName: string): Promise<Set<string>> {
  return columnMap[tableName] ?? emptyColumns;
}

export function pickInsertPayload<T extends Record<string, unknown>>(columns: Set<string>, payload: T) {
  return Object.fromEntries(Object.entries(payload).filter(([key, value]) => columns.has(key) && value !== undefined)) as Partial<T>;
}

export function pickSelectColumns(columns: Set<string>, preferredColumns: string[]) {
  return preferredColumns.filter((column) => columns.has(column));
}
