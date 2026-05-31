import { supabase } from "./supabase";
import type { AppMetadata, AppMetadataInput } from "./types";

const TABLE = "appmeta_apps";

type Row = {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  platform: AppMetadata["platform"];
  status: AppMetadata["status"];
  category: string;
  tags: string[];
  icon_url: string | null;
  store_url: string | null;
  created_at: string;
  updated_at: string;
};

function rowToApp(row: Row): AppMetadata {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    version: row.version,
    platform: row.platform,
    status: row.status,
    category: row.category,
    tags: row.tags ?? [],
    iconUrl: row.icon_url,
    storeUrl: row.store_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function inputToRow(input: Partial<AppMetadataInput>) {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.description !== undefined) row.description = input.description;
  if (input.version !== undefined) row.version = input.version;
  if (input.platform !== undefined) row.platform = input.platform;
  if (input.status !== undefined) row.status = input.status;
  if (input.category !== undefined) row.category = input.category;
  if (input.tags !== undefined) row.tags = input.tags;
  if (input.iconUrl !== undefined) row.icon_url = input.iconUrl;
  if (input.storeUrl !== undefined) row.store_url = input.storeUrl;
  return row;
}

export async function listApps(): Promise<AppMetadata[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`listApps: ${error.message}`);
  return (data as Row[]).map(rowToApp);
}

export async function getApp(id: string): Promise<AppMetadata | undefined> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getApp: ${error.message}`);
  return data ? rowToApp(data as Row) : undefined;
}

export async function createApp(input: AppMetadataInput): Promise<AppMetadata> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(inputToRow(input))
    .select("*")
    .single();
  if (error) throw new Error(`createApp: ${error.message}`);
  return rowToApp(data as Row);
}

export async function updateApp(
  id: string,
  patch: Partial<AppMetadataInput>,
): Promise<AppMetadata | undefined> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(inputToRow(patch))
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(`updateApp: ${error.message}`);
  return data ? rowToApp(data as Row) : undefined;
}

export async function deleteApp(id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from(TABLE)
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw new Error(`deleteApp: ${error.message}`);
  return (count ?? 0) > 0;
}
