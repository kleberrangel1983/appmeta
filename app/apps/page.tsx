import Link from "next/link";
import { listApps } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AppsPage() {
  const apps = await listApps();

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20 }}>All apps</h2>
        <Link href="/apps/new" className="btn btn-primary">
          + New app
        </Link>
      </div>

      {apps.length === 0 ? (
        <div className="empty">
          No apps yet. <Link href="/apps/new">Create one</Link>.
        </div>
      ) : (
        <div className="grid">
          {apps.map((app) => (
            <Link key={app.id} href={`/apps/${app.id}`} className="card app-card">
              <h3>{app.name}</h3>
              <p>{app.description || "No description"}</p>
              <span className={`badge badge-${app.status}`}>{app.status}</span>
              <span className="badge">{app.platform}</span>
              <span className="badge">{app.category}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
