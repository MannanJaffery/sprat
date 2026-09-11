# Application Walkthrough

This document walks through every screen in SPRAT and how they connect, in the
order a user actually moves through them. It complements
[`README.md`](./README.md) (setup) and
[`FUNCTIONAL_REQUIREMENTS.md`](./FUNCTIONAL_REQUIREMENTS.md) (requirement-level
capability list) — this one is the "what does each page actually do" reference.

## The end-to-end flow

```
Landing page → Sign up → Onboarding (request a role) → pending, awaiting approval
                                                              │
                                        Admin approves ───────┘
                                                              │
                                                              ▼
                                    Sign in → Projects (dashboard)
                                                              │
                                      pick or request to join a project
                                                              │
                                                              ▼
                              Project workspace: Overview, Domains, Documents,
                              Goals, Scenarios, Search, Classification
                              Dimensions, Keyword Definitions
                                                              │
                         (Admin / Project Manager only) Users, User Groups, Audit Log
```

The sidebar, top bar, command palette, and AI assistant are present on every
authenticated screen and are covered once, in their own section, rather than
repeated per page.

---

## 1. Public & authentication pages

### Landing page (`/`)

The public marketing page. A hero section states what SPRAT does with a single
"Create your workspace" call to action; further sections cover the regulatory
landscape it operates in, a feature-by-feature walkthrough with illustrative
mockups, the four user roles, and a closing call to action. The nav bar shows
"Sign in" to a logged-out visitor, or a "Dashboard" shortcut straight to
`/projects` if the visitor already has an active session.

### Sign up (`/signup`)

Email, password, and confirm-password. On success, either the user is sent to
onboarding (session already active) or told to confirm their email first,
depending on the Supabase project's email-confirmation setting.

### Onboarding (`/onboarding`)

Shown to any signed-in account still in the `pending` state. Asks for a full
name and which role to request — Project Manager, Analyst, or Guest (Admin is
never offered here). After submitting, the account stays `pending` until an
Admin approves or rejects it from the Users page; the onboarding screen itself
shows an "awaiting approval" state on repeat visits and sends the user back to
the landing page once submitted.

### Sign in (`/login`)

Email/password sign-in, a "forgot password" flow (Supabase password-reset
email), and a "quick login" dropdown pre-filling one of four seeded demo
accounts (one per role) for local development and demos.

---

## 2. The application shell

Everything below `/projects` and its nested routes shares one layout: a
sidebar on the left, a top bar, a command palette, and a floating AI
assistant. These are not separate pages — they're always there.

### Sidebar

Two states depending on whether a project is currently open:

- **Outside a project**: Home (back to the landing page), Projects, User
  Groups, and — for Admin/Project Manager — an Administration section with
  Users (Admin only) and Audit Log.
- **Inside a project**: Home, "All projects", the current project's name, then
  a Workspace section (Overview, Domains, Documents, Goals, Scenarios) and an
  Analysis tools section (Search, Keyword Definitions, Classification
  Dimensions).

Collapses to a slide-out drawer on mobile/tablet, toggled from the top bar.

### Top bar

Breadcrumbs for the current location, a "Search ⌘K" button that opens the
command palette, and an account menu (name, email, role badge, sign out).

### Command palette (⌘K / Ctrl+K)

A searchable jump-to-anywhere dialog. Always offers "All projects"; inside a
project it adds every workspace/analysis page above; Administration items
appear only for Admin/Project Manager, matching the sidebar's own gating.

### AI assistant

A floating chat button, present for every active role. It can explain how to
use SPRAT and — via backend tool calls that re-check the asker's real
permissions — answer questions about actual data: a project's members, its
assigned user group's size, its goal counts. See FR-14.

---

## 3. Workspace — finding and entering a project

### Projects (`/projects`)

The dashboard. Shows every project that exists (browsing is open to everyone,
per FR-1), each card badged as Member, Pending request, or offering a
"Request to join" button. Admin/Project Manager get a "New project" action.
Two charts sit above the list: projects created per week (hidden for Guests)
and a membership-status breakdown.

### Project Overview (`/projects/:id/overview`)

The landing tab once inside a project: project name/description, the members
table (name, role, access level), assigned user groups, and — for Admin/PM —
an "Add member" flow (with per-guest domain restriction), a pending
join-requests panel to approve/reject, and controls to assign or remove whole
user groups.

---

## 4. Inside a project — content & taxonomy

### Domains

The subject-matter categories documents are organized under (e.g. Healthcare,
Financial Services). Admin/PM can add one from a curated preset list or type a
custom name, and rename or delete existing ones; everyone else sees the list
read-only.

### Documents

The repository of source policy text. Admin/PM can add a document (name,
domain, optional source URL, full text); anyone can browse and open one.

### Document detail

Read-only: the document's readability score (Flesch), a goal-occurrence
breakdown (which goals were mined from it and how often), and the full text.

### Goals

The core unit of analysis — obligations mined from policy text. Admin/PM/
Analyst can add a goal (linked to a source document, taxonomy category and
subtype, actor, observability, subject classifications); everyone can browse
and search. Admin/PM/Analyst also see two on-demand AI panels above the list:
the **conflict detector** and the **AI project summary** (FR-12).

### Goal detail

Five tabs per goal:

- **Details** — the goal's fields; editable, replaceable, or deletable by
  Admin/PM/Analyst.
- **Classification & Compare** — analysts submit their own classification;
  once everyone has, disagreements are surfaced automatically (FR-8).
- **Traceability** — every document and scenario this goal appears in.
- **Cross-Reference** — other goals related to it by document, taxonomy,
  subject classification, or legislation (FR-9).
- **Grammar Check** — a rule-based conformance report on the goal's wording:
  obligation language, named actor, vague terms, passive voice, length
  (FR-13, no AI involved).

### Scenarios

Concrete situations that exercise one or more goals. Admin/PM/Analyst can
create, edit, delete, and link/unlink goals; Guests browse read-only.

### Scenario detail

All scenario fields (actors, events, actions, obstacles, constraints,
pre/post-conditions, requirements text), its linked goals, and a status badge
(draft/active/resolved).

### Search

One filter form across both goals and scenarios simultaneously — free text,
taxonomy, subject classification, granularity, observability, source
document, actor, legislation, and scenario status — open to every project
member (FR-10).

### Classification Dimensions

The taxonomy goals are classified against, beyond the three built-in
dimensions. Admin/PM add a dimension directly; anyone else can request one
(with a rationale), which Admin/PM then approves or rejects.

### Keyword Definitions

A shared glossary supporting consistent classification. Admin/PM/Analyst can
add definitions; a definition can be locked so only a manager or its original
author can still edit it.

---

## 5. Administration

Visible only to Admin (and, for the audit log, Project Manager too).

### Users

Two parts: pending sign-ups (pick a role, Approve or Reject), and the full
user directory (role, user group, active/disabled toggle — admin accounts
never show a disable control, so an admin can never be disabled from here).

### User Groups

Admin creates groups; Analysts/Guests request to join one; Admin/Project
Manager approve or reject those requests, which adds the requester to the
group.

### Audit Log

A paginated, filterable (action type, object type, date range) view of every
recorded action — append-only at the database level, so this is a read-only
window onto history, never an editable table (FR-11).
