import { redirect } from "next/navigation";
import { createApp } from "@/lib/store";
import type { AppStatus, Platform } from "@/lib/types";

export const dynamic = "force-dynamic";

async function createAction(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("name is required");

  const platform = String(formData.get("platform") ?? "web") as Platform;
  const status = String(formData.get("status") ?? "draft") as AppStatus;
  const description = String(formData.get("description") ?? "");
  const version = String(formData.get("version") ?? "0.1.0");
  const category = String(formData.get("category") ?? "Uncategorized");
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const storeUrl = String(formData.get("storeUrl") ?? "").trim() || null;
  const iconUrl = String(formData.get("iconUrl") ?? "").trim() || null;
  const slug =
    String(formData.get("slug") ?? "").trim() ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const app = await createApp({
    name,
    slug,
    description,
    version,
    platform,
    status,
    category,
    tags,
    iconUrl,
    storeUrl,
  });

  redirect(`/apps/${app.id}`);
}

export default function NewAppPage() {
  return (
    <>
      <h2 style={{ marginTop: 0 }}>New app</h2>
      <form action={createAction} className="form">
        <div>
          <label htmlFor="name">Name *</label>
          <input id="name" name="name" required placeholder="e.g. Pomodoro Pro" />
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            placeholder="Short summary of the app"
          />
        </div>

        <div className="row">
          <div>
            <label htmlFor="platform">Platform</label>
            <select id="platform" name="platform" defaultValue="web">
              <option value="ios">iOS</option>
              <option value="android">Android</option>
              <option value="web">Web</option>
              <option value="desktop">Desktop</option>
            </select>
          </div>
          <div>
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue="draft">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="row">
          <div>
            <label htmlFor="version">Version</label>
            <input id="version" name="version" defaultValue="0.1.0" />
          </div>
          <div>
            <label htmlFor="category">Category</label>
            <input id="category" name="category" placeholder="Productivity" />
          </div>
        </div>

        <div>
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input id="tags" name="tags" placeholder="timer, focus, productivity" />
        </div>

        <div>
          <label htmlFor="slug">Slug (optional)</label>
          <input id="slug" name="slug" placeholder="auto-generated from name" />
        </div>

        <div className="row">
          <div>
            <label htmlFor="iconUrl">Icon URL</label>
            <input id="iconUrl" name="iconUrl" placeholder="https://..." />
          </div>
          <div>
            <label htmlFor="storeUrl">Store URL</label>
            <input id="storeUrl" name="storeUrl" placeholder="https://..." />
          </div>
        </div>

        <div className="actions">
          <button className="btn btn-primary" type="submit">
            Create app
          </button>
        </div>
      </form>
    </>
  );
}
