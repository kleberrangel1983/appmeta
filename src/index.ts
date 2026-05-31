import express, { type Request, type Response, type NextFunction } from "express";
import {
  openDb,
  listApps,
  getApp,
  createApp,
  updateApp,
  deleteApp,
  countApps,
  type AppInput,
} from "./db.js";

const VERSION = "0.1.0";
const PORT = Number(process.env.PORT ?? 3000);

const db = openDb();
const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: VERSION, count: countApps(db) });
});

app.get("/apps", (req, res) => {
  const tag = typeof req.query.tag === "string" ? req.query.tag : undefined;
  res.json(listApps(db, tag));
});

app.get("/apps/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "invalid id" });
  const record = getApp(db, id);
  if (!record) return res.status(404).json({ error: "not found" });
  res.json(record);
});

function validateInput(body: unknown, partial = false): AppInput | string {
  if (!body || typeof body !== "object") return "body must be a JSON object";
  const b = body as Record<string, unknown>;
  if (!partial || b.name !== undefined) {
    if (typeof b.name !== "string" || !b.name) return "name is required";
  }
  if (!partial || b.version !== undefined) {
    if (typeof b.version !== "string" || !b.version) return "version is required";
  }
  if (b.description !== undefined && typeof b.description !== "string") {
    return "description must be a string";
  }
  if (b.tags !== undefined) {
    if (!Array.isArray(b.tags) || !b.tags.every((t) => typeof t === "string")) {
      return "tags must be an array of strings";
    }
  }
  return {
    name: b.name as string,
    version: b.version as string,
    description: b.description as string | undefined,
    tags: b.tags as string[] | undefined,
  };
}

app.post("/apps", (req, res) => {
  const parsed = validateInput(req.body);
  if (typeof parsed === "string") return res.status(400).json({ error: parsed });
  try {
    const record = createApp(db, parsed);
    res.status(201).json(record);
  } catch (err) {
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      return res.status(409).json({ error: "name already exists" });
    }
    throw err;
  }
});

app.put("/apps/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "invalid id" });
  const parsed = validateInput(req.body, true);
  if (typeof parsed === "string") return res.status(400).json({ error: parsed });
  const record = updateApp(db, id, parsed);
  if (!record) return res.status(404).json({ error: "not found" });
  res.json(record);
});

app.delete("/apps/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "invalid id" });
  if (!deleteApp(db, id)) return res.status(404).json({ error: "not found" });
  res.status(204).end();
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "internal error" });
});

const server = app.listen(PORT, () => {
  console.log(`appmeta listening on http://localhost:${PORT}`);
});

const shutdown = (sig: string) => {
  console.log(`${sig} received, shutting down`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
