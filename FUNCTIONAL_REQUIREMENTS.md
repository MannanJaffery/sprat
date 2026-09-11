# Functional Requirements

This document lists SPRAT's functional requirements (FRs) at the level of a
capability a user actually needs, not at the level of individual operations.

Each requirement is classified as one of:

- **CRUD** — standard resource management (create, read, update, and where
  applicable delete). A resource's full lifecycle is treated as **one**
  requirement rather than split into separate "create X" / "read X" / "update X"
  requirements — those are operations within a requirement, not requirements
  in their own right.
- **Non-CRUD** — a capability whose value is *not* routine data management:
  search, computed analysis, reconciliation, traceability, or an AI-assisted
  action. These are read-heavy or computed outputs, not create/update/delete
  workflows on a resource.

14 requirements are listed below: 7 CRUD, 7 Non-CRUD.

## Summary

| ID | Requirement | Category | Primary roles |
|----|---|---|---|
| FR-1 | User Authentication & Onboarding | Non CRUD | All |
| FR-2 | Project Management | CRUD | Admin, Project Manager |
| FR-3 | User Group Management | CRUD | Admin, Project Manager |
| FR-4 | Domain & Document Management | CRUD | Admin, Project Manager |
| FR-5 | Goal Management | CRUD | Admin, Project Manager, Analyst |
| FR-6 | Scenario Management | CRUD | Admin, Project Manager, Analyst |
| FR-7 | Classification Dimension & Keyword Definitions | CRUD | Admin, Project Manager |
| FR-8 | Multi-Analyst Classification & Reconciliation | Non-CRUD | Analyst, Admin, Project Manager |
| FR-9 | Goal Traceability & Cross-Reference View | Non-CRUD | All (scoped) |
| FR-10 | Full-Text Search | Non-CRUD | All (scoped) |
| FR-11 | Append-Only Audit Log | Non-CRUD | Admin, Project Manager |
| FR-12 | AI-Assisted Conflict Detection & Project Summaries | Non-CRUD | Admin, Project Manager, Analyst |
| FR-13 | Goal Statement Conformance Checker | Non-CRUD | All (scoped) |
| FR-14 | In-App AI Assistant | Non-CRUD | All |

---

## CRUD requirements

### FR-1 — User Authentication & Onboarding

Account creation, credential management, and the approval gate that stands
between a new sign-up and real access.

- Sign up and sign in via Supabase-managed authentication (email + password,
  password reset).
- A new account starts in a `pending` state with no role; the user submits a
  name and a requested role (Project Manager, Analyst, or Guest — never Admin).
- An Admin reviews pending sign-ups and approves (assigning the final role) or
  rejects them.
- An Admin can disable or re-enable any non-admin account; admin accounts can
  never be disabled or created through the application itself.

### FR-2 — Project Management

The top-level container for a body of work: its documents, domains, goals,
scenarios, and team.

- Create a project; browse every project that exists (name, description,
  member count) regardless of membership.
- Add, remove, and update the direct membership of a project, including a
  guest's domain-level access restrictions.
- Assign or remove whole user groups from a project.
- Request to join a project; an Admin or Project Manager approves or rejects
  the request.

### FR-3 — User Group Management

A reusable pool of analysts/guests that can be assigned to a project as a unit.

- Create a user group.
- Browse every group and request to join one (Analysts and Guests only).
- An Admin or Project Manager approves or rejects join requests, which adds the
  requester to the group.

### FR-4 — Domain & Document Management

The subject-matter categories a project organizes its source material under,
and the policy documents themselves.

- Create, edit, and delete domains, chosen from a curated preset list or typed
  freely (e.g. Healthcare, Financial Services, Government).
- Add, edit, and delete policy documents, each assigned to a domain and holding
  the source text goals are mined from.

### FR-5 — Goal Management

The core unit of analysis: a security or privacy obligation extracted from a
policy document.

- Create, edit, and delete goals, each carrying a taxonomy category/subtype,
  granularity, observability, actor, source excerpt, relevant legislation, and
  one or more subject classifications.
- Replace a goal with another, automatically re-linking its policy and
  scenario associations rather than leaving them dangling.
- Link an existing goal to additional source documents it also occurs in.

### FR-6 — Scenario Management

A concrete situation that exercises one or more goals.

- Create, edit, and delete scenarios, capturing their sources, actors,
  events, actions, obstacles, constraints, pre/post-conditions, status, and
  requirements text.
- Link and unlink goals to a scenario.

### FR-7 — Classification Dimension & Keyword Definitions

The taxonomy a project classifies its goals against, and the vocabulary that
supports it.

- Define custom classification dimensions (a label plus a fixed set of
  allowed values) in addition to the three built-in dimensions every goal
  carries.
- Create, edit, and delete keyword definitions used to support consistent
  classification across analysts.

---

## Non-CRUD requirements

### FR-8 — Multi-Analyst Classification & Reconciliation

Independent analysts each classify the same goal across every dimension;
their submissions are automatically compared once complete.

- An analyst's own submission is visible to them immediately; another
  analyst's submission stays hidden until the requester has submitted their
  own full set, to avoid biasing their judgment.
- Once all relevant analysts have submitted, every value is compared per
  dimension and any disagreement is flagged for an Admin or Project Manager
  to resolve.

### FR-9 — Goal Traceability & Cross-Reference View

Understanding where a goal comes from and what else relates to it, without
editing anything.

- Traceability: every policy document and scenario a specific goal appears in.
- Cross-reference: other goals related to it by source document, taxonomy,
  subject classification, or cited legislation — so a related obligation is
  never missed just because it lives in a different document.

### FR-10 — Full-Text Search

Locate goals and scenarios by any combination of attributes — description,
actor, taxonomy, source document, legislation, or subject classification —
without needing to know which document or category to look under first.

### FR-11 — Append-Only Audit Log

A tamper-evident record of every create, update, delete, and access-relevant
action in the system, filterable by actor, action, object type, and date.
Entries cannot be edited or deleted once written, by design — enforced at the
database level, not just in application code.

### FR-12 — AI-Assisted Conflict Detection & Project Summaries

On-demand, Groq-powered analysis over the goals a user can see in a project.

- **Conflict detection**: identifies pairs of goals that genuinely contradict
  each other (e.g. incompatible retention periods for the same data), each
  with a severity rating and a plain-English explanation.
- **Project summary**: a short executive summary of what a project's goals
  commit to overall, grouped by taxonomy, including notable obligations and
  thin/under-covered areas.

Both respect the requesting user's own project and domain access — a guest
never has more visible in an AI-generated result than they would in the raw
goal list.

### FR-13 — Goal Statement Conformance Checker

A rule-based (non-AI) quality check on a single goal's wording, using
established requirements-engineering heuristics: does it state a clear
obligation, name a responsible actor, avoid vague language, read as active
voice, and stay to a single, reasonably-sized statement. Returns a pass/fail
breakdown per check and an overall score — computed locally via lightweight
text-processing, with no external call involved.

### FR-14 — In-App AI Assistant

A conversational assistant, available to every role, that can both explain how
to use SPRAT and answer questions about real project data — who's a member of
a given project, how many users are in its assigned group, how many goals it
has, and similar. It resolves a project mentioned by name and then queries the
backend for the answer, applying the exact same access rules a normal API
request from that user would get: if the user isn't entitled to see it, the
assistant says so rather than guessing.
