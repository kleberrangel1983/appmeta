---
name: run-appmeta
description: Build, run, and drive appmeta — the Express + SQLite REST API for app metadata records. Use when asked to start appmeta, run its smoke test, build it, hit its endpoints with curl, or verify CRUD behavior.
---

`appmeta` is a small Express + TypeScript + SQLite REST API that
stores app metadata records (`name`, `version`, `description`, `tags`).
Drive it with `.claude/skills/run-appmeta/smoke.sh` — that launches the
server in the background against an in-memory DB, exercises every
endpoint with `curl`, asserts expected HTTP codes, and tears down. All
paths below are relative to the repo root (`/home/user/appmeta`).

## Prerequisites

Ubuntu container with Node 22, npm, curl. `better-sqlite3` is built
from source on install, so a C++ toolchain is needed — already present
on this container, but on a barebones image:

```bash
sudo apt-get update
sudo apt-get install -y build-essential python3
```

## Setup

```bash
npm install
```

Installs Express, `better-sqlite3` (native build, ~8 s), and dev deps
(`tsx`, `typescript`, type packages).

## Build

No separate build for the smoke flow — `tsx` runs the TypeScript
sources directly. To produce `dist/`:

```bash
npm run build         # tsc -> dist/
npm run typecheck     # tsc --noEmit (fast, no output)
```

## Run (agent path)

One command — smoke covers launch + ready-probe + full CRUD + cleanup:

```bash
bash .claude/skills/run-appmeta/smoke.sh
# → ... ends with "smoke: OK", exit 0
# → port 3000 is freed on exit (success OR failure)
```

Server log is at `/tmp/appmeta.log`. Override with `APPMETA_LOG=…`.
Override the port with `PORT=4000 bash …/smoke.sh`.

What `smoke.sh` does, in order:

| step | endpoint | expected |
|---|---|---|
| health probe | `GET /health` | 200 `{status,version,count}` |
| create #1 | `POST /apps` claude-code | 201 |
| create #2 | `POST /apps` appmeta | 201 |
| list | `GET /apps` | 200, 2 items |
| filter | `GET /apps?tag=cli` | 200, 1 item |
| read | `GET /apps/1` | 200 |
| update | `PUT /apps/1` | 200, version bumped |
| duplicate name | `POST /apps` appmeta again | 409 |
| missing name | `POST /apps` no name | 400 |
| delete | `DELETE /apps/2` | 204 |
| read deleted | `GET /apps/2` | 404 |
| final health | `GET /health` | 200, `count=1` |

### Launch the server on its own (no smoke driver)

For ad-hoc poking — keep the server up between curl calls:

```bash
APPMETA_DB=:memory: PORT=3000 npm start &> /tmp/appmeta.log &
for i in {1..40}; do curl -sf http://localhost:3000/health >/dev/null && break; sleep 0.25; done
curl -s http://localhost:3000/health   # → {"status":"ok","version":"0.1.0","count":0}
# ...
pkill -f "tsx src/index.ts"            # see Gotchas — this kills the orphan
```

## Run (human path)

`npm run dev` runs `tsx watch` (hot reload), blocks the shell, writes
to a file-backed DB (`./appmeta.db`). Useful for browsing in a separate
terminal; useless headless. `Ctrl-C` to stop.

## Test

```bash
npm run smoke         # same as bash .claude/skills/run-appmeta/smoke.sh
npm run typecheck     # types only
```

There is no unit-test suite — `smoke.sh` is the test surface. Every
behavior change should keep `npm run smoke` green.

## Environment

| Variable | Required | Default | Notes |
|---|---|---|---|
| `PORT` | no | `3000` | Server bind port. |
| `APPMETA_DB` | no | `./appmeta.db` | File path or `:memory:`. Smoke uses `:memory:`. |
| `APPMETA_LOG` | no | `/tmp/appmeta.log` | Smoke-only — where the background server's stdout/stderr go. |

## Gotchas

- **`npm start` orphans `tsx`.** `npm` spawns `tsx` as a child process;
  killing the `npm` pid alone leaves `tsx` holding port 3000. `smoke.sh`
  works around this by launching under `setsid` and killing the whole
  process group on exit. For one-off launches, use
  `pkill -f "tsx src/index.ts"` to nuke the child directly.
- **Default DB is file-backed at `./appmeta.db`** — re-running without
  `APPMETA_DB=:memory:` accumulates state and will hit `409 name already
  exists` from the smoke's `claude-code` insert. Either pass
  `APPMETA_DB=:memory:` (smoke does) or `rm appmeta.db*` between runs.
- **SQLite WAL files.** A crashed file-backed run leaves
  `appmeta.db-wal` / `appmeta.db-shm` alongside the DB. They're in
  `.gitignore`; clean with `rm -f appmeta.db*`.
- **`tags` is stored as JSON text.** The schema column is `TEXT`; the
  API serializes on write and parses on read. Don't query `tags` with
  raw SQL `LIKE` and expect array semantics — filtering by tag is done
  in JS in `listApps`.

## Troubleshooting

- **`EADDRINUSE: address already in use :::3000`**: leftover `tsx`
  child from a prior `npm start`. `pkill -f "tsx src/index.ts"` and
  retry, or run smoke (its cleanup handles it).
- **`smoke: server died before ready`** with a `gyp` / `node-gyp` error
  in the log: `better-sqlite3` failed to build — install
  `build-essential python3` (see Prerequisites).
- **`UNIQUE constraint failed: apps.name`** on first POST after a fresh
  clone with no `APPMETA_DB` override: see Gotchas — the file-backed
  default DB persists across runs.
