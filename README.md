# appmeta

A small, well-tested **app metadata API** — a CRUD service for application
metadata records (name, platform, version, description, tags).

The codebase is structured in clean layers so each is independently testable:

| Layer | File | Responsibility |
|-------|------|----------------|
| Types / contracts | `src/types.ts` | Domain types, error classes, repository interface |
| Validation | `src/validation.ts` | Pure field-level validation of create/update payloads |
| Persistence | `src/repository.ts` | `InMemoryMetadataRepository` (swap for any `MetadataRepository`) |
| Service | `src/service.ts` | Business logic: validation + persistence orchestration |
| HTTP | `src/app.ts` | Express routes + centralized error handling |
| Entrypoint | `src/server.ts` | Wires the stack and starts the server |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check → `{ status: 'ok' }` |
| POST | `/metadata` | Create a record → `201` |
| GET | `/metadata` | List records (filters: `?platform=`, `?tag=`) |
| GET | `/metadata/:id` | Fetch one record |
| PATCH | `/metadata/:id` | Update fields |
| DELETE | `/metadata/:id` | Delete a record → `204` |

Validation failures return `400 { errors: [{ field, message }] }`; missing
records return `404 { error }`.

## Development

```bash
npm install      # install dependencies
npm run dev      # run the API locally with hot reload
npm test         # run the test suite
npm run coverage # run tests with a coverage report
npm run typecheck
```

## Testing

Tests run on [Vitest](https://vitest.dev/) and live in `test/`:

- `validation.test.ts` — every field rule and edge case
- `repository.test.ts` — persistence, filters, defensive copies
- `service.test.ts` — business logic with the in-memory repository
- `app.test.ts` — HTTP layer in isolation (fake service)
- `e2e.test.ts` — full stack: HTTP → service → repository

A coverage gate is enforced in `vitest.config.ts` (lines/functions/statements
≥ 80%, branches ≥ 75%) and runs in CI on every push and pull request. Current
coverage is **100% lines / functions / statements** and **~98% branches**.
