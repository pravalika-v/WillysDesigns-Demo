# Render Free + Turso setup

This version supports both `DB_PROVIDER=sqlite` and `DB_PROVIDER=turso`. No frontend edits are needed. The remote connection uses Turso's official SQL-over-HTTP API, with parameterized queries and a timeout. No SDK or npm install is required.

## 1. Get your database URL and token

Sign in at https://app.turso.tech and create a database named `willysdesigns-demo`. Open that database's connection details to obtain its URL and create a database authentication token with read/write access. This is a **database token**, not an organization/platform API token. The app must be able to create its table and insert/select enquiries.

If you prefer the documented CLI workflow, install Turso's CLI using https://docs.turso.tech/cli/installation (on Windows use WSL), then run:

```sh
turso auth login
turso db create willysdesigns-demo
turso db show willysdesigns-demo --http-url
turso db tokens create willysdesigns-demo --expiration 30d
```

Skip `db create` if you already created the database in the dashboard. The third command prints the URL; the fourth prints the private token. The example token expires after 30 days: generate a replacement and update Render before then. Do not use `--read-only` for the application's token.

Copy credentials directly into Render. Do not put tokens into HTML, Git, screenshots, or chat. The project accepts either `https://...` or `libsql://...` database URLs and adds `/v2/pipeline` internally.

Official references:
- https://docs.turso.tech/sdk/http/quickstart
- https://docs.turso.tech/cli/db/tokens/create
- https://docs.turso.tech/quickstart

## 2. Deploy the new package

1. Extract this ZIP. Put the **contents of the project folder** (including `Dockerfile`, `database.mjs`, `server.mjs`, `public/`, and `render.yaml`) at the root of a Git repository.
2. In Render, create a Blueprint from that repository. The included `render.yaml` now selects **Free**, with no persistent disk. Enter the two requested Turso values when prompted.
3. Alternatively, create a Docker Web Service manually, select Free and add these under the service's **Environment** settings:

| Key | Value |
| --- | --- |
| `DB_PROVIDER` | `turso` |
| `TURSO_DATABASE_URL` | Your Turso database URL |
| `TURSO_AUTH_TOKEN` | Your private read/write database token |
| `NODE_ENV` | `production` |

4. Deploy. The application creates the `enquiries` table automatically. Missing or invalid Turso credentials cause startup to fail; it never silently saves to a temporary local file instead.
5. Once the Render URL is assigned, add `PUBLIC_ORIGIN=https://your-service.onrender.com` with no trailing slash. Save and redeploy.
6. Visit `/api/health`; it should return `{"ok":true}`. Submit sample details through Contact Us and confirm the saved record in Turso's database interface or shell. Restart Render and verify it is still there.

Render Free sleeps after inactivity. The website can take time to wake up, but the enquiries stay in Turso. Free-tier quotas apply to both services. See https://render.com/docs/free and https://turso.tech/pricing.

Do not use the previous ZIP's paid Render configuration. Updating a repository's Blueprint does not by itself guarantee an existing paid disk/service will be removed or downgraded; review the existing service's settings and charges, or create a new Free demo service.

## 3. Inspect enquiries and back up data

Render Free has no service shell. Inspect records through Turso, or use the included command on your own computer with a private `.env` containing the same provider and credentials:

```sh
node --env-file=.env scripts/enquiries.mjs
```

This prints the newest 100 records; it is **not a complete backup**. Use Turso's database export tools for a full backup: https://docs.turso.tech/cli/db/export. Store exports privately.

`scripts/backup.mjs` remains an online SQLite backup utility for `DB_PROVIDER=sqlite`; it explicitly refuses Turso mode to avoid backing up the wrong database.

## 4. Upgrade later

**Keep Turso:** upgrade the Render service's instance type and set `plan: starter` in `render.yaml` so the Blueprint matches. Leave all database settings unchanged. No data migration is required.

**Switch to SQLite on paid Render:** first export/migrate and verify any records you want to retain. Attach a writable persistent disk at `/app/data`, change `DB_PROVIDER=sqlite`, and set `DB_PATH=/app/data/enquiries.sqlite`. Add the disk and settings to `render.yaml` as well. Merely changing the provider does not copy Turso data. Keep the Turso database until the migration has been verified.

## Local development

With no environment settings the app defaults to local SQLite:

```sh
node server.mjs
```

To test against Turso locally, copy `.env.example` to `.env`, set `DB_PROVIDER=turso`, paste the two credentials, set `PUBLIC_ORIGIN=http://localhost:3000`, then run:

```sh
node --env-file=.env server.mjs
```

## What changed

- `database.mjs`: database-provider selection, table creation, local SQLite and authenticated HTTPS queries, atomic duplicate prevention.
- `server.mjs`: awaits writes and database health; uses the selected provider.
- `render.yaml`: Free plan and secret prompts; no disk.
- `Dockerfile`: includes the new database module.
- `.env.example`: provider, URL and token settings.
- `scripts/enquiries.mjs`: reads from either provider.
- `scripts/backup.mjs`: prevents accidental local-only backups in Turso mode.
- `test/turso.test.mjs`: HTTP protocol, concurrent retries, failures and server-instance persistence tests using a simulated Turso transport backed by real SQLite.

Eight automated tests pass. A live Turso connection has not been tested because no account credentials were supplied. Email remains disabled.
