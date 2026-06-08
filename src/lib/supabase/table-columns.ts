type SupabaseTableClient = any;

const columnCache = new Map<string, Promise<Set<string>>>();

export async function getPublicTableColumns(client: SupabaseTableClient, tableName: string): Promise<Set<string>> {
  if (!columnCache.has(tableName)) {
    columnCache.set(
      tableName,
      (async () => {
        try {
          const { data, error } = await client
            .schema("information_schema")
            .from("columns")
            .select("column_name")
            .eq("table_schema", "public")
            .eq("table_name", tableName);

          if (error) {
            throw new Error(error.message);
          }

          return new Set((data ?? []).map((row: { column_name: string }) => row.column_name));
        } catch (error) {
          columnCache.delete(tableName);
          throw error;
        }
      })(),
    );
  }

  return columnCache.get(tableName)!;
}

export function pickInsertPayload<T extends Record<string, unknown>>(columns: Set<string>, payload: T) {
  return Object.fromEntries(Object.entries(payload).filter(([key, value]) => columns.has(key) && value !== undefined)) as Partial<T>;
}

export function pickSelectColumns(columns: Set<string>, preferredColumns: string[]) {
  return preferredColumns.filter((column) => columns.has(column));
}
