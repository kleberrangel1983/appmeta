import { createClient } from "./supabase/server";

const BUCKET = "app-icons";
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export async function uploadIcon(file: File): Promise<string> {
  if (!ALLOWED.has(file.type)) {
    throw new Error(`Unsupported icon type: ${file.type}`);
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`Icon too large (max ${MAX_BYTES / 1024 / 1024} MB)`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const ext = EXT_BY_MIME[file.type] ?? "bin";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`uploadIcon: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function pathFromPublicUrl(publicUrl: string): string | null {
  const match = publicUrl.match(/\/storage\/v1\/object\/public\/app-icons\/(.+)$/);
  return match ? match[1] : null;
}

export async function deleteIcon(publicUrl: string): Promise<void> {
  const path = pathFromPublicUrl(publicUrl);
  if (!path) return;
  const supabase = await createClient();
  await supabase.storage.from(BUCKET).remove([path]);
}
