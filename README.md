# 個人支出追蹤儀表板 — Expense Dashboard

A full-stack personal expense tracker built with Next.js 16, SQLite (via `better-sqlite3`), NextAuth.js v5, and Tailwind CSS v4. The entire UI is in Traditional Chinese (繁體中文).

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Features](#features)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Local Development Setup](#local-development-setup)
6. [Environment Variables](#environment-variables)
7. [Database Design](#database-design)
8. [API Reference](#api-reference)
9. [Docker Deployment](#docker-deployment)
10. [Architecture Notes](#architecture-notes)
11. [Breaking Changes from Standard Next.js](#breaking-changes-from-standard-nextjs)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS v4 (CSS-first config), shadcn/ui |
| Fonts | Noto Sans TC (CJK), Geist Mono (code) |
| Icons | lucide-react |
| Charts | recharts 3 |
| Database | SQLite via better-sqlite3 (synchronous, server-only) |
| Auth | NextAuth.js v5 beta (Credentials provider, JWT sessions) |
| Forms | react-hook-form + zod v4 |
| Timezone | date-fns + date-fns-tz |
| Toast | sonner |
| Theme | next-themes (system / light / dark) |

---

## Features

- **Dashboard** — interactive time-range picker (今日 / 本週 / 本月 / 近30天 / 自訂), total-spend card, bar chart (daily breakdown, gap-free), pie chart (by category)
- **Expense ledger** — paginated table with universal search and advanced filters (date range, category, amount range), full CRUD, attachment viewer
- **Settings** — change password, view active timezone
- **Auth** — username/password login, JWT sessions, route protection via `proxy.ts`
- **Dark mode** — system preference detected, toggle in sidebar, persists across reloads
- **Containerised** — multi-stage Docker image with standalone Next.js output

---

## Project Structure

```
expense-dashboard/
├── app/
│   ├── (auth)/login/               # Public login page
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Auth guard + sidebar layout
│   │   ├── page.tsx                # Dashboard home (delegates to DashboardShell)
│   │   ├── expenses/page.tsx       # Expense ledger
│   │   └── settings/page.tsx       # Account settings
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth handler
│   │   ├── auth/change-password/   # POST: change user password
│   │   ├── expenses/               # GET (list + filters), POST (create)
│   │   ├── expenses/[id]/          # GET, PUT, DELETE single expense
│   │   ├── attachments/[id]/       # GET (stream), DELETE
│   │   └── dashboard/stats/        # GET: range totals + chart data
│   ├── globals.css                 # Tailwind v4 CSS-first config + oklch vars
│   └── layout.tsx                  # Root layout (font, ThemeProvider, Toaster)
├── components/
│   ├── ui/                         # shadcn/ui generated components
│   ├── sidebar.tsx                 # Server component sidebar with ThemeToggle
│   ├── theme-provider.tsx          # next-themes wrapper (client)
│   ├── theme-toggle.tsx            # Sun/Moon button (client)
│   ├── dashboard-shell.tsx         # Interactive dashboard with range picker (client)
│   ├── dashboard-charts.tsx        # recharts BarChart + PieChart (client)
│   ├── expense-table.tsx           # Paginated table + filter panel + CRUD dialogs (client)
│   ├── expense-form.tsx            # Create/edit form via react-hook-form + zod (client)
│   └── attachment-list.tsx         # Attachment viewer/deleter (client)
├── lib/
│   ├── paths.ts                    # Env-var-driven path resolution (crashes loud in prod)
│   ├── timezone.ts                 # DISPLAY_TIMEZONE server-side constant
│   ├── categories.ts               # Canonical expense category list
│   ├── auth.ts                     # NextAuth v5 config
│   ├── utils.ts                    # shadcn cn() helper
│   └── db/
│       ├── expense-db.ts           # better-sqlite3 singleton → EXPENSE_DB_PATH
│       └── auth-db.ts              # better-sqlite3 singleton → AUTH_DB_PATH
├── scripts/
│   └── seed.ts                     # One-time admin user creation (npm run seed)
├── auth.ts                         # Re-exports NextAuth handlers from lib/auth.ts
├── proxy.ts                        # Route protection (Next.js 16 middleware)
├── next.config.ts                  # output: 'standalone' for Docker
├── Dockerfile                      # Multi-stage production Docker image
├── .dockerignore
└── .env.local                      # Local dev secrets (never committed)
```

---

## Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm 10+**
- An existing `expenses.db` SQLite database placed at the project root (or at the path set by `EXPENSE_DB_PATH`)

### Expected `expenses.db` schema

The application does **not** run migrations. Your database must already have:

```sql
CREATE TABLE expenses (
  id           TEXT PRIMARY KEY,
  amount       REAL NOT NULL,
  category     TEXT NOT NULL,
  sub_category TEXT,
  description  TEXT NOT NULL,
  remark       TEXT,
  date         TEXT NOT NULL,   -- ISO-8601 UTC string
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE TABLE expense_attachments (
  id                TEXT PRIMARY KEY,
  expense_id        TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  file_path         TEXT NOT NULL,      -- relative path, e.g. "attachments/uuid.jpg"
  original_filename TEXT NOT NULL,
  mime_type         TEXT NOT NULL,
  remark            TEXT,
  created_at        TEXT NOT NULL
);
```

All `date` values must be stored as UTC ISO strings (e.g. `2026-04-30T08:00:00.000Z`).

---

## Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file
cp .env.local.example .env.local   # or create it manually — see Environment Variables below

# 3. Seed the auth database (creates admin / admin123)
npm run seed

# 4. Start the dev server
npm run dev
```

Navigate to `http://localhost:3000`. You will be redirected to `/login`. Log in with `admin` / `admin123` and change the password immediately via `/settings`.

---

## Environment Variables

Create `.env.local` in the project root. This file is gitignored and must never be committed.

```env
# ── Auth ──────────────────────────────────────────────────────────────────────
# Required in all environments.
# Generate a secret: openssl rand -base64 32
# Keep this value stable between container restarts or all sessions are invalidated.
NEXTAUTH_SECRET=change-me-in-production
# Production domain used by Auth.js when deployed behind a reverse proxy.
# AUTH_URL=https://expenses.admijw.xyz
# AUTH_TRUST_HOST=true

# ── Timezone ──────────────────────────────────────────────────────────────────
# IANA timezone identifier used for all date display and input conversion.
# Changing this requires a server restart.
DISPLAY_TIMEZONE=Asia/Kuala_Lumpur
NEXT_PUBLIC_DISPLAY_TIMEZONE=Asia/Kuala_Lumpur

# ── Paths (optional in dev, REQUIRED in production) ───────────────────────────
# Absolute OR relative (to CWD) paths.
# Missing any of these in NODE_ENV=production crashes the server on first use
# with a clear error message.

# EXPENSE_DB_PATH=./expenses.db
# AUTH_DB_PATH=./auth.db
# ATTACHMENTS_DIR_PATH=../data/mcp/expense_db/attachments
```

### Variable reference

| Variable | Required in prod | Dev default | Description |
|---|---|---|---|
| `NEXTAUTH_SECRET` | Yes | — | JWT signing secret. Generate: `openssl rand -base64 32` |
| `DISPLAY_TIMEZONE` | Yes | `Asia/Kuala_Lumpur` | Server-side timezone for date queries |
| `AUTH_URL` | Recommended in prod | — | Public production origin for Auth.js redirects, e.g. `https://expenses.admijw.xyz`. |
| `AUTH_TRUST_HOST` | Recommended in prod | — | Set to `true` when running behind a trusted reverse proxy. |
| `NEXT_PUBLIC_DISPLAY_TIMEZONE` | Yes | `Asia/Kuala_Lumpur` | Client-side timezone (settings page display) |
| `EXPENSE_DB_PATH` | Yes | `./expenses.db` | Absolute path to the expense SQLite file |
| `AUTH_DB_PATH` | Yes | `./auth.db` | Absolute path to the auth SQLite file |
| `ATTACHMENTS_DIR_PATH` | Yes | `../data/mcp/expense_db/attachments` | Directory containing uploaded attachment files |

> **Path resolution**: relative paths are resolved against `process.cwd()` (the server's working directory). In Docker this is `/app`. Prefer absolute paths in production.

---

## Database Design

Two separate SQLite databases are used:

| Database | Env var | Managed by | Purpose |
|---|---|---|---|
| `expenses.db` | `EXPENSE_DB_PATH` | External / pre-existing | All expense and attachment records |
| `auth.db` | `AUTH_DB_PATH` | This app | User accounts (auto-created on first run) |

The app **never runs schema migrations** on `expenses.db`. The auth DB schema (`users` table) is created automatically via `CREATE TABLE IF NOT EXISTS` on first connect.

### Timezone handling

All dates are stored in `expenses.db` as UTC ISO strings. The application:

1. **Display**: converts UTC → `DISPLAY_TIMEZONE` using `formatInTimeZone()` from `date-fns-tz`
2. **Input**: converts datetime-local input (treated as `DISPLAY_TIMEZONE`) → UTC using `fromZonedTime()` before writing
3. **Queries**: converts boundary dates from `DISPLAY_TIMEZONE` → UTC before passing to SQLite `WHERE date >= ?` clauses

---

## API Reference

All routes require an authenticated session (401 otherwise). All routes use `export const runtime = 'nodejs'` (required for Node.js APIs: SQLite, `fs`).

### `GET /api/dashboard/stats`

Returns aggregated stats for the requested time range.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `from` | `YYYY-MM-DD` | Range start (in `DISPLAY_TIMEZONE`). Defaults to current month start. |
| `to` | `YYYY-MM-DD` | Range end (inclusive, in `DISPLAY_TIMEZONE`). Defaults to today. |

**Response:**

```json
{
  "rangeTotal": 1234.56,
  "dailyTotals": [{ "day": "2026-04-01", "total": 45.00 }],
  "categoryTotals": [{ "category": "食物", "total": 300.00 }],
  "chartStartDateStr": "2026-04-01",
  "chartEndDateStr": "2026-04-30"
}
```

`dailyTotals` is always a **dense** array — zero-filled for days with no expenses.

---

### `GET /api/expenses`

**Query params:**

| Param | Default | Description |
|---|---|---|
| `page` | `1` | Page number |
| `limit` | `20` | Items per page (max 100) |
| `search` | — | Text search across category, sub_category, description, remark |
| `dateFrom` | — | UTC ISO string — lower date bound |
| `dateTo` | — | UTC ISO string — upper date bound |
| `category` | — | Exact category match |
| `minAmount` | — | Minimum amount (inclusive) |
| `maxAmount` | — | Maximum amount (inclusive) |

**Response:** `{ rows, total, page, limit }`

---

### `POST /api/expenses`

**Body:** `{ amount, category, sub_category?, description, remark?, date }` where `date` is a UTC ISO string and `category` must be one of the values in `lib/categories.ts`.

### `GET /api/expenses/[id]`

Returns `{ expense, attachments[] }`.

### `PUT /api/expenses/[id]`

Updates an expense. Same body shape as POST.

### `DELETE /api/expenses/[id]`

Deletes the expense and all its attachment records (DB rows only; physical files remain until explicitly deleted via the attachments API).

---

### `GET /api/attachments/[id]`

Streams the physical file from `ATTACHMENTS_DIR_PATH` with the correct `Content-Type` and `Content-Disposition` headers.

### `DELETE /api/attachments/[id]`

Deletes the DB row and the physical file from disk.

---

### `POST /api/auth/change-password`

**Body:** `{ currentPassword, newPassword }`

Verifies `currentPassword` against the stored bcrypt hash, then updates it.

---

## Docker Deployment

### Build the image

```bash
docker build -t expense-dashboard:latest .
```

### Run the container

```bash
docker run -d \
  --name expense-dashboard \
  -p 3000:3000 \
  -e NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
  -e AUTH_URL="https://expenses.admijw.xyz" \
  -e AUTH_TRUST_HOST="true" \
  -e DISPLAY_TIMEZONE="Asia/Kuala_Lumpur" \
  -e NEXT_PUBLIC_DISPLAY_TIMEZONE="Asia/Kuala_Lumpur" \
  -e EXPENSE_DB_PATH="/data/expenses.db" \
  -e AUTH_DB_PATH="/data/auth.db" \
  -e ATTACHMENTS_DIR_PATH="/data/attachments" \
  -v /your/host/data:/data \
  expense-dashboard:latest
```

Mount a single host directory (e.g. `/your/host/data`) as `/data` inside the container. Place your existing `expenses.db` and `attachments/` folder there. The app creates `auth.db` automatically on first startup.

### docker-compose example

```yaml
services:
  expense-dashboard:
    image: expense-dashboard:latest
    build: .
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      NEXTAUTH_SECRET: "${NEXTAUTH_SECRET}"
      AUTH_URL: https://expenses.admijw.xyz
      AUTH_TRUST_HOST: "true"
      DISPLAY_TIMEZONE: Asia/Kuala_Lumpur
      NEXT_PUBLIC_DISPLAY_TIMEZONE: Asia/Kuala_Lumpur
      EXPENSE_DB_PATH: /data/expenses.db
      AUTH_DB_PATH: /data/auth.db
      ATTACHMENTS_DIR_PATH: /data/attachments
    volumes:
      - ./data:/data
```

Store secrets in a `.env` file next to `docker-compose.yml` (not committed):

```env
NEXTAUTH_SECRET=your-long-random-secret
```

Generate `NEXTAUTH_SECRET` once and keep it unchanged across deployments; changing it invalidates existing sessions.

### Seed in Docker

The easiest approach is to run the seed script locally against the data directory before starting the container:

```bash
AUTH_DB_PATH=/your/host/data/auth.db npm run seed
```

Or against a running container:

```bash
docker exec -e AUTH_DB_PATH=/data/auth.db expense-dashboard \
  node -e "require('child_process').execSync('node /app/scripts/seed.js', {stdio:'inherit'})"
```

### How the Dockerfile works

Three stages keep the final image small:

| Stage | Base | Purpose |
|---|---|---|
| `deps` | `node:20-alpine` + `python3 make g++` | `npm ci` — compiles the `better-sqlite3` native addon via node-gyp |
| `builder` | `node:20-alpine` | `next build` using pre-built node_modules — produces `.next/standalone` |
| `runner` | `node:20-alpine` | Copies only the standalone output; no sources, no devDependencies |

**Why `python3 make g++`?** `better-sqlite3` is a native Node.js addon compiled at install time by `node-gyp`. Alpine does not ship a C++ toolchain, so these packages must be added explicitly in the `deps` stage.

**Why `output: 'standalone'`?** Next.js traces exactly which `node_modules` are required at runtime and bundles only those into `.next/standalone/node_modules`, dramatically reducing the runner image size.

> **Important**: all three stages use the same `node:20-alpine` base. This ensures the native `better-sqlite3.node` binary compiled in `deps` is ABI-compatible with the Node.js runtime in `runner`.

---

## Architecture Notes

### Two-database pattern

`expenses.db` is treated as **external read/write, no migrations**. The dashboard is a thin layer over it. `auth.db` is owned by the dashboard and auto-initialized.

### Server-only SQLite

`better-sqlite3` is a synchronous native addon. It must only run in Node.js server contexts (API routes, server components). It cannot be imported in client components. All DB calls are in `lib/db/` and invoked only from server-side code.

### Path resolution (`lib/paths.ts`)

All filesystem paths (DB files, attachments directory) go through `lib/paths.ts`. In production (`NODE_ENV=production`), a missing env var calls `process.exit(1)` immediately — a deliberate "fail loud, fail fast" design so misconfigured containers don't serve broken responses silently.

### Category canonicalization

Expense categories are defined once in `lib/categories.ts` and shared between:
- The category `<Select>` in `expense-form.tsx` (client)
- The category filter `<Select>` in `expense-table.tsx` (client)
- The POST validation in `app/api/expenses/route.ts` (server)

### Dashboard interactivity

`app/(dashboard)/page.tsx` is a server component that only performs the auth guard, then renders `<DashboardShell>` (client component). All data fetching and range-picker state live in the client, calling `/api/dashboard/stats?from=...&to=...`.

### Bar chart gap prevention

`getDashboardStats` calls `fillDailyTotals()` internally to produce a dense date array for the full requested range. Days with no expenses are inserted with `total: 0`, preventing recharts from skipping dates on the X axis.

---

## Breaking Changes from Standard Next.js

This project targets **Next.js 16.2.4**, which has several breaking changes from v14/v15:

| Feature | Old (v14/v15) | New (v16) |
|---|---|---|
| Middleware file | `middleware.ts` | `proxy.ts` |
| Route params | `{ params: { id } }` (sync) | `const { id } = await params` (async) |
| `cookies()` | Sync | `await cookies()` |
| `headers()` | Sync | `await headers()` |
| Default bundler | Webpack | Turbopack |
| CSS config | `tailwind.config.js` | CSS-first via `globals.css` |

Always read `node_modules/next/dist/docs/` for the authoritative API reference for this version before modifying framework-touching code.
