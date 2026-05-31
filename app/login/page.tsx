import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function loginAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/") || "/";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <div style={{ maxWidth: 400, margin: "60px auto" }}>
      <h2 style={{ marginTop: 0 }}>Sign in</h2>
      {error && (
        <p
          style={{
            background: "rgba(248,81,73,0.1)",
            border: "1px solid var(--danger)",
            color: "var(--danger)",
            padding: "10px 12px",
            borderRadius: 6,
            fontSize: 14,
          }}
        >
          {error}
        </p>
      )}
      <form action={loginAction} className="form">
        <input type="hidden" name="next" value={next ?? "/"} />
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <div className="actions">
          <button className="btn btn-primary" type="submit">
            Sign in
          </button>
        </div>
      </form>
      <p className="muted" style={{ marginTop: 20, fontSize: 14 }}>
        New here? <Link href="/signup">Create an account</Link>
      </p>
    </div>
  );
}
