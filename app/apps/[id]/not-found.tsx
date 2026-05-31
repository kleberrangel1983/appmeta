import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty">
      <h2>App not found</h2>
      <p>The app you are looking for does not exist or was deleted.</p>
      <Link href="/apps" className="btn">
        Back to apps
      </Link>
    </div>
  );
}
