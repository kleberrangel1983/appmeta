import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function signupAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signUp({ email, password });
  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }
  // If email confirmation is required, session won't exist yet
  if (!data.session) {
    redirect(
      `/login?error=${encodeURIComponent("Check your email to confirm your account.")}`,
    );
  }
  redirect("/");
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div style={{ maxWidth: 400, margin: "60px auto" }}>
      <h2 style={{ marginTop: 0 }}>Create account</h2>
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
      <form action={signupAction} className="form">
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
          <label htmlFor="password">Password (min 6 chars)</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <div className="actions">
          <button className="btn btn-primary" type="submit">
            Create account
          </button>
        </div>
      </form>
      <p className="muted" style={{ marginTop: 20, fontSize: 14 }}>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
