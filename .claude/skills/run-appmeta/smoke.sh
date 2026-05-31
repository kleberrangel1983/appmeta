#!/usr/bin/env bash
# Launch the appmeta API in the background against an in-memory DB,
# exercise every CRUD path with curl, then tear down.
# Exits non-zero on the first failure. All HTTP responses are echoed
# so callers can read them from stdout or the log.
set -euo pipefail

PORT="${PORT:-3000}"
BASE="http://localhost:${PORT}"
LOG="${APPMETA_LOG:-/tmp/appmeta.log}"
REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"

cd "$REPO_ROOT"

cleanup() {
  # npm start spawns tsx as a child; killing only the npm pid leaves the
  # tsx child holding the port. Use setsid below + kill the whole group.
  if [[ -n "${APP_PGID:-}" ]]; then
    kill -TERM -- "-$APP_PGID" 2>/dev/null || true
    for _ in 1 2 3 4 5; do
      pgrep -g "$APP_PGID" >/dev/null 2>&1 || break
      sleep 0.2
    done
    kill -KILL -- "-$APP_PGID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# --- launch (in its own process group so cleanup can nuke npm + tsx) ---
setsid bash -c "APPMETA_DB=':memory:' PORT='$PORT' exec npm start" >"$LOG" 2>&1 &
APP_PID=$!
APP_PGID="$APP_PID"
echo "smoke: server pid=$APP_PID, pgid=$APP_PGID, port=$PORT, log=$LOG"

# --- ready probe ---
for i in $(seq 1 60); do
  if curl -sf "$BASE/health" >/dev/null; then
    echo "smoke: ready after $((i * 250))ms"
    break
  fi
  if ! kill -0 "$APP_PID" 2>/dev/null; then
    echo "smoke: server died before ready, log:"
    cat "$LOG"
    exit 1
  fi
  sleep 0.25
done
if ! curl -sf "$BASE/health" >/dev/null; then
  echo "smoke: server never became ready, log:"
  cat "$LOG"
  exit 1
fi

# --- helpers ---
expect_http() {
  local want="$1"; shift
  local got
  got=$(curl -s -o /tmp/appmeta.body -w '%{http_code}' "$@")
  if [[ "$got" != "$want" ]]; then
    echo "smoke: FAIL expected $want, got $got from $*"
    cat /tmp/appmeta.body
    exit 1
  fi
  cat /tmp/appmeta.body
  echo
}

# --- exercise the API ---
echo "=== health ==="
expect_http 200 "$BASE/health"

echo "=== create claude-code ==="
expect_http 201 -X POST "$BASE/apps" -H 'content-type: application/json' \
  -d '{"name":"claude-code","version":"2.1.158","description":"Anthropic CLI","tags":["cli","ai"]}'

echo "=== create appmeta ==="
expect_http 201 -X POST "$BASE/apps" -H 'content-type: application/json' \
  -d '{"name":"appmeta","version":"0.1.0","description":"this API","tags":["api","demo"]}'

echo "=== list ==="
expect_http 200 "$BASE/apps"

echo "=== filter by tag=cli ==="
expect_http 200 "$BASE/apps?tag=cli"

echo "=== get id=1 ==="
expect_http 200 "$BASE/apps/1"

echo "=== update id=1 version ==="
expect_http 200 -X PUT "$BASE/apps/1" -H 'content-type: application/json' \
  -d '{"version":"2.1.159"}'

echo "=== duplicate name -> 409 ==="
expect_http 409 -X POST "$BASE/apps" -H 'content-type: application/json' \
  -d '{"name":"appmeta","version":"0.1.1"}'

echo "=== missing name -> 400 ==="
expect_http 400 -X POST "$BASE/apps" -H 'content-type: application/json' \
  -d '{"version":"1.0.0"}'

echo "=== delete id=2 -> 204 ==="
expect_http 204 -X DELETE "$BASE/apps/2"

echo "=== get id=2 -> 404 ==="
expect_http 404 "$BASE/apps/2"

echo "=== health (count should be 1) ==="
expect_http 200 "$BASE/health"

echo "smoke: OK"
