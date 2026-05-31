import { NextResponse } from "next/server";
import { createApp, listApps } from "@/lib/store";
import type { AppMetadataInput, AppStatus, Platform } from "@/lib/types";

const PLATFORMS: Platform[] = ["ios", "android", "web", "desktop"];
const STATUSES: AppStatus[] = ["draft", "published", "archived"];

function parseInput(body: unknown): AppMetadataInput | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Body must be an object" };
  }
  const b = body as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) return { error: "name is required" };

  const platform = b.platform as Platform;
  if (!PLATFORMS.includes(platform)) {
    return { error: `platform must be one of: ${PLATFORMS.join(", ")}` };
  }

  const status = (b.status as AppStatus) ?? "draft";
  if (!STATUSES.includes(status)) {
    return { error: `status must be one of: ${STATUSES.join(", ")}` };
  }

  return {
    name,
    slug:
      typeof b.slug === "string" && b.slug.trim()
        ? b.slug.trim()
        : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    description: typeof b.description === "string" ? b.description : "",
    version: typeof b.version === "string" ? b.version : "0.1.0",
    platform,
    status,
    category: typeof b.category === "string" ? b.category : "Uncategorized",
    tags: Array.isArray(b.tags) ? b.tags.filter((t): t is string => typeof t === "string") : [],
    iconUrl: typeof b.iconUrl === "string" ? b.iconUrl : null,
    storeUrl: typeof b.storeUrl === "string" ? b.storeUrl : null,
  };
}

export function GET() {
  return NextResponse.json({ apps: listApps() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const app = createApp(parsed);
  return NextResponse.json({ app }, { status: 201 });
}
