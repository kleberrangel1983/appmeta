import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "appmeta — App metadata manager",
  description: "Manage metadata for your apps across platforms.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <h1>
              <Link href="/" style={{ color: "var(--text)" }}>
                appmeta
              </Link>
            </h1>
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
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
