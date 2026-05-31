import Link from "next/link";
import { listApps } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const apps = listApps();
  const total = apps.length;
  const published = apps.filter((a) => a.status === "published").length;
  const drafts = apps.filter((a) => a.status === "draft").length;
  const platforms = new Set(apps.map((a) => a.platform)).size;

  return (
    <>
      <section className="stats">
        <div className="stat">
          <div className="label">Total apps</div>
          <div className="value">{total}</div>
        </div>
        <div className="stat">
          <div className="label">Published</div>
          <div className="value">{published}</div>
        </div>
        <div className="stat">
          <div className="label">Drafts</div>
          <div className="value">{drafts}</div>
        </div>
        <div className="stat">
          <div className="label">Platforms</div>
          <div className="value">{platforms}</div>
        </div>
      </section>

      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>Recent apps</h2>
          <Link href="/apps" className="muted">
            View all →
          </Link>
        </div>

        {apps.length === 0 ? (
          <div className="empty">
            No apps yet. <Link href="/apps/new">Create your first one</Link>.
          </div>
        ) : (
          <div className="grid">
            {apps.slice(0, 6).map((app) => (
              <Link key={app.id} href={`/apps/${app.id}`} className="card app-card">
                <h3>{app.name}</h3>
                <p>{app.description || "No description"}</p>
                <span className={`badge badge-${app.status}`}>{app.status}</span>
                <span className="badge">{app.platform}</span>
                <span className="badge">v{app.version}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
