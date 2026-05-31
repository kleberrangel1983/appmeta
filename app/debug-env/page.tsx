export const dynamic = "force-dynamic";

export default function DebugEnvPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const inspect = (name: string, raw: string | undefined) => {
    if (raw === undefined) return { name, present: false };
    return {
      name,
      present: true,
      length: raw.length,
      lengthTrimmed: raw.trim().length,
      hasLeadingSpace: raw !== raw.trimStart(),
      hasTrailingSpace: raw !== raw.trimEnd(),
      hasNewline: raw.includes("\n") || raw.includes("\r"),
      hasQuotes: raw.startsWith('"') || raw.startsWith("'"),
      first20: raw.slice(0, 20),
      last10: raw.slice(-10),
    };
  };

  const urlInfo = inspect("NEXT_PUBLIC_SUPABASE_URL", url);
  const keyInfo = inspect("NEXT_PUBLIC_SUPABASE_ANON_KEY", key);

  return (
    <div style={{ fontFamily: "monospace", padding: 32 }}>
      <h2>appmeta — env debug</h2>
      <p style={{ color: "var(--text-muted)" }}>
        This page shows safe metadata about the env vars without exposing their
        full values. Delete this route once everything works.
      </p>
      <pre
        style={{
          background: "var(--surface)",
          padding: 16,
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        {JSON.stringify({ url: urlInfo, key: keyInfo }, null, 2)}
      </pre>
    </div>
  );
}
