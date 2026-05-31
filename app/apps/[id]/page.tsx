import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteApp, getApp, updateApp } from "@/lib/store";
import type { AppStatus, Platform } from "@/lib/types";

export const dynamic = "force-dynamic";

async function updateAction(id: string, formData: FormData) {
  "use server";

  const patch = {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? ""),
    version: String(formData.get("version") ?? ""),
    platform: String(formData.get("platform") ?? "") as Platform,
    status: String(formData.get("status") ?? "") as AppStatus,
    category: String(formData.get("category") ?? ""),
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    storeUrl: String(formData.get("storeUrl") ?? "").trim() || null,
    iconUrl: String(formData.get("iconUrl") ?? "").trim() || null,
    slug: String(formData.get("slug") ?? "").trim(),
  };

  updateApp(id, patch);
  redirect(`/apps/${id}`);
}

async function deleteAction(id: string) {
  "use server";
  deleteApp(id);
  redirect("/apps");
}

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const app = getApp(id);
  if (!app) notFound();

  const update = updateAction.bind(null, app.id);
  const remove = deleteAction.bind(null, app.id);

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Link href="/apps" className="muted">
          ← Back to apps
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <h2 style={{ margin: 0 }}>{app.name}</h2>
        <span className={`badge badge-${app.status}`}>{app.status}</span>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Created {new Date(app.createdAt).toLocaleString()} · Updated{" "}
        {new Date(app.updatedAt).toLocaleString()}
      </p>

      <form action={update} className="form" style={{ marginTop: 24 }}>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" defaultValue={app.name} required />
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            defaultValue={app.description}
          />
        </div>

        <div className="row">
          <div>
            <label htmlFor="platform">Platform</label>
            <select id="platform" name="platform" defaultValue={app.platform}>
              <option value="ios">iOS</option>
              <option value="android">Android</option>
              <option value="web">Web</option>
              <option value="desktop">Desktop</option>
            </select>
          </div>
          <div>
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={app.status}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="row">
          <div>
            <label htmlFor="version">Version</label>
            <input id="version" name="version" defaultValue={app.version} />
          </div>
          <div>
            <label htmlFor="category">Category</label>
            <input id="category" name="category" defaultValue={app.category} />
          </div>
        </div>

        <div>
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input id="tags" name="tags" defaultValue={app.tags.join(", ")} />
        </div>

        <div>
          <label htmlFor="slug">Slug</label>
          <input id="slug" name="slug" defaultValue={app.slug} />
        </div>

        <div className="row">
          <div>
            <label htmlFor="iconUrl">Icon URL</label>
            <input id="iconUrl" name="iconUrl" defaultValue={app.iconUrl ?? ""} />
          </div>
          <div>
            <label htmlFor="storeUrl">Store URL</label>
            <input id="storeUrl" name="storeUrl" defaultValue={app.storeUrl ?? ""} />
          </div>
        </div>

        <div className="actions">
          <button className="btn btn-primary" type="submit">
            Save changes
          </button>
        </div>
      </form>

      <form action={remove} style={{ marginTop: 32, textAlign: "right" }}>
        <button className="btn btn-danger" type="submit">
          Delete app
        </button>
      </form>
    </>
  );
}
