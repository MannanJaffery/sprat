# SPRAT — Security & Privacy Requirements Analysis Tool

SPRAT is a workspace for mining security and privacy goals out of policy documents,
classifying them against a taxonomy, reconciling independent analysts' judgments,
tracing goals through to the scenarios that implement them, and keeping a defensible,
append-only record of who did what. It ships with a small suite of AI-assisted
analysis tools on top of that core workflow.

## Key features

- **Goal mining & classification** — extract goals from policy text, classify them by
  taxonomy, subject, and any custom project-defined dimensions.
- **Multi-analyst reconciliation** — independent analysts classify the same goal;
  disagreements are surfaced automatically once everyone has submitted.
- **Scenario modeling & traceability** — model concrete usage scenarios and trace every
  goal back to the policies and scenarios it appears in.
- **Role-based access control** — Admin, Project Manager, Analyst, and Guest roles,
  enforced end-to-end on the server; guests can be scoped to specific domains.
- **Sign-up with admin approval** — anyone can create an account; access only
  activates once an admin approves the requested role.
- **Append-only audit log** — every action is recorded and cannot be edited or deleted.
- **AI-assisted analysis** (Groq) — an in-app assistant with real read access to your
  project data, an automated conflict detector across a project's goals, and
  on-demand executive summaries.
- **Rule-based goal quality checks** — a grammar/conformance checker (no AI call)
  that flags vague, passive, or unattributed goal statements.

## Tech stack

| Layer | Technology |
|---|---|
| Client | React 18, Vite, Tailwind CSS, React Router, TanStack Query, Framer Motion, Recharts |
| Server | Node.js, Express, `pg` (raw SQL, no ORM) |
| Data & Auth | Supabase (hosted PostgreSQL + Auth), JWKS-verified access tokens |
| AI | Groq (OpenAI-compatible chat completions + tool calling) |
| NLP | `compromise` (rule-based goal grammar checks — no AI involved) |

## Architecture

```
React client  →  Express API  →  Supabase-hosted PostgreSQL
     │                │
     │                └─ verifies Supabase-issued JWTs via JWKS, loads the
     │                   caller's profile (role/status), enforces RBAC
     │
     └─ talks to Supabase Auth directly for sign-up / sign-in / password reset

Express API  →  Groq (chat completions API)
     └─ the assistant, conflict detector, and summaries all call out to Groq;
        the assistant additionally uses function calling to read real project
        data through the same permission checks a normal API request gets
```

The client never talks to Postgres directly — Express is the only path to project
data, so every table has Row-Level Security enabled with no policies (default-deny),
closing off Supabase's automatic PostgREST exposure of the schema.

## Project structure

```
sprat/
├── client/                # React app (Vite)
│   └── src/
│       ├── api/           # axios wrappers per resource
│       ├── components/    # shared UI + feature panels
│       ├── hooks/         # useAuth, etc.
│       ├── lib/           # supabase client, framer-motion variants
│       └── pages/         # route-level views
├── server/                # Express API
│   ├── db/
│   │   ├── migrations/    # SQL migrations, applied in order
│   │   ├── connection.js  # pg Pool + transaction helper
│   │   ├── migrate.js     # migration runner
│   │   └── seedDemoUsers.js
│   └── src/
│       ├── controllers/
│       ├── middleware/    # auth, RBAC, project-access, audit logging
│       ├── routes/
│       └── services/      # business logic, including services/ai/
├── README.md
└── FUNCTIONAL_REQUIREMENTS.md
```

## Getting started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (Postgres + Auth)
- A [Groq](https://console.groq.com) API key (optional — the app runs fine without
  one, the AI features simply return a 503 until it's configured)

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment variables

Copy each example file and fill in your own values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

`server/.env`:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase Postgres connection string (URL-encode any special characters in the password) |
| `SUPABASE_URL` | Your project's base URL — used to fetch its JWKS for verifying access tokens |
| `GROQ_API_KEY` | Server-side only. Never move this to the client. |
| `GROQ_MODEL` | Groq model id (defaults to a free-tier model if unset) |
| `CLIENT_ORIGIN` | The client's origin, for CORS |

`client/.env`:

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_PROJECT_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase's public anon/publishable key |

### 3. Run migrations

```bash
npm run db:migrate
```

### 4. (Optional) Seed demo accounts

```bash
node server/db/seedDemoUsers.js
```

Creates one pre-approved, active account per role — useful for trying the app
immediately without going through sign-up and admin approval. See that script for
the seeded emails/password; these are local-development convenience accounts only.
Bootstrapping the very first real admin account is a manual, one-time SQL step —
see `server/db/ADMIN_BOOTSTRAP.sql`.

### 5. Run the app

```bash
npm run dev
```

Starts the API on `:4000` and the client on `:5173`.

## User roles

| Role | Can do |
|---|---|
| **Admin** | Everything — approves signups, manages users, bypasses project membership checks |
| **Project Manager** | Owns projects: documents, domains, team membership, join-request decisions |
| **Analyst** | Mines and classifies goals, builds scenarios |
| **Guest** | Read-only, optionally scoped to specific domains within a project |

## Functional requirements

See [`FUNCTIONAL_REQUIREMENTS.md`](./FUNCTIONAL_REQUIREMENTS.md) for the full list,
classified as CRUD (standard resource management) or Non-CRUD (analysis, search,
and AI-assisted capabilities).
