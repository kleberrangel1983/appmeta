import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty">
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist.</p>
      <Link href="/" className="btn">
        Go home
      </Link>
    </div>
  );
}
