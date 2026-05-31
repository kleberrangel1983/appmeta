import { NextResponse } from "next/server";
import { deleteApp, getApp, updateApp } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const app = await getApp(id);
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ app });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const patch = await request.json().catch(() => null);
  if (!patch || typeof patch !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const app = await updateApp(id, patch);
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ app });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const ok = await deleteApp(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
