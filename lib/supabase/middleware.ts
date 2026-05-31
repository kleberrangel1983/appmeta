import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/debug-env"];

function checkEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const problems: string[] = [];
  if (!url) problems.push("NEXT_PUBLIC_SUPABASE_URL is missing");
  else if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url.trim())) {
    problems.push(
      `NEXT_PUBLIC_SUPABASE_URL has invalid format (length=${url.length}, starts="${url.slice(0, 20)}", ends="${url.slice(-10)}")`,
    );
  }
  if (!key) problems.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
  else if (key.length < 30) {
    problems.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY too short (length=${key.length})`);
  }
  return problems;
}

export async function updateSession(request: NextRequest) {
  const envProblems = checkEnv();
  if (envProblems.length > 0) {
    return new NextResponse(
      `appmeta env configuration error:\n\n- ${envProblems.join("\n- ")}\n\nFix the variables in Vercel → Settings → Environment Variables, then redeploy.`,
      { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
