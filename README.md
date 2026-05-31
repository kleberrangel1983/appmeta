# appmeta

Tiny REST API for storing and serving app metadata records
(`name`, `version`, `description`, `tags`). Express + TypeScript + SQLite.

## Quick start

```bash
npm install
npm run smoke   # launches the server, exercises CRUD, tears down
```

## Endpoints

| method | path | purpose |
|---|---|---|
| `GET` | `/health` | `{status,version,count}` |
| `GET` | `/apps` | list all (optional `?tag=foo` filter) |
| `GET` | `/apps/:id` | read one |
| `POST` | `/apps` | create — body `{name,version,description?,tags?}` |
| `PUT` | `/apps/:id` | partial update |
| `DELETE` | `/apps/:id` | remove |

See [`.claude/skills/run-appmeta/SKILL.md`](.claude/skills/run-appmeta/SKILL.md)
for the full build/run/test runbook.
