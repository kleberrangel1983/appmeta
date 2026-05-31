import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "appmeta — App metadata manager",
  description: "Manage metadata for your apps across platforms.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <h1>
              <Link href={user ? "/" : "/login"} style={{ color: "var(--text)" }}>
                appmeta
              </Link>
            </h1>
            {user ? (
              <nav className="nav">
                <Link href="/" className="btn">
                  Dashboard
                </Link>
                <Link href="/apps" className="btn">
                  Apps
                </Link>
                <Link href="/apps/new" className="btn btn-primary">
                  New app
                </Link>
                <form action="/auth/sign-out" method="post" style={{ margin: 0 }}>
                  <button type="submit" className="btn" title={user.email ?? ""}>
                    Sign out
                  </button>
                </form>
              </nav>
            ) : null}
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
