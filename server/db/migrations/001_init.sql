-- SPRAT core schema (Postgres / Supabase)
--
-- `profiles` holds our own app data (role, status, group) for each Supabase Auth
-- user; it is FK'd 1:1 to auth.users(id). Supabase owns credentials entirely —
-- there is no password column here. A trigger on auth.users keeps a profile row
-- in sync with every signup (status starts 'pending' until an admin approves it
-- with a role — see the handle_new_user() function at the bottom of this file).
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'project_manager', 'analyst', 'guest')),
  requested_role TEXT CHECK (requested_role IN ('project_manager', 'analyst', 'guest')),
  user_group_id INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_group_id_fkey;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_user_group_id_fkey FOREIGN KEY (user_group_id) REFERENCES user_groups(id);

-- Projects & membership (project-scoped access control)
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_members (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  guest_restrictions TEXT, -- JSON array of allowed domain_ids, NULL = unrestricted
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS project_user_groups (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_group_id INTEGER NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  added_by UUID REFERENCES profiles(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_group_id)
);

-- Domains & documents/policies
CREATE TABLE IF NOT EXISTS domains (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, name)
);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  domain_id INTEGER REFERENCES domains(id),
  name TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  source_url TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  goal_code TEXT NOT NULL,
  description TEXT NOT NULL,
  taxonomy_category TEXT NOT NULL CHECK (taxonomy_category IN ('protection', 'vulnerability')),
  taxonomy_subtype TEXT NOT NULL,
  granularity TEXT NOT NULL CHECK (granularity IN ('policy', 'scenario')),
  observable BOOLEAN NOT NULL DEFAULT true,
  actor TEXT,
  context_excerpt TEXT,
  relevant_legislation TEXT,
  replaced_by_goal_id INTEGER REFERENCES goals(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, goal_code)
);

-- Multi-select subject classification
CREATE TABLE IF NOT EXISTS goal_subject_classifications (
  id SERIAL PRIMARY KEY,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  subject_classification TEXT NOT NULL,
  UNIQUE (goal_id, subject_classification)
);

-- Occurrence analytics + traceability: goal <-> document links
CREATE TABLE IF NOT EXISTS goal_document_links (
  id SERIAL PRIMARY KEY,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  UNIQUE (goal_id, document_id)
);

-- Multi-analyst classification comparison (built-in dimensions)
CREATE TABLE IF NOT EXISTS goal_classifications (
  id SERIAL PRIMARY KEY,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  analyst_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  classification_type TEXT NOT NULL CHECK (classification_type IN
    ('policy_vs_scenario', 'observable_vs_unobservable', 'protection_vs_vulnerability')),
  classification_value TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (goal_id, analyst_id, classification_type)
);

-- Project-defined classification dimensions + analyst-raised requests for new ones
CREATE TABLE IF NOT EXISTS classification_types (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type_key TEXT NOT NULL,
  label TEXT NOT NULL,
  options TEXT NOT NULL, -- JSON array of allowed values
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, type_key)
);

CREATE TABLE IF NOT EXISTS classification_type_requests (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  label TEXT NOT NULL,
  options TEXT NOT NULL, -- JSON array of allowed values
  rationale TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  decided_by UUID REFERENCES profiles(id),
  decided_at TIMESTAMPTZ,
  created_type_id INTEGER REFERENCES classification_types(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goal_custom_classifications (
  id SERIAL PRIMARY KEY,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  classification_type_id INTEGER NOT NULL REFERENCES classification_types(id) ON DELETE CASCADE,
  analyst_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (goal_id, classification_type_id, analyst_id)
);

-- Scenarios
CREATE TABLE IF NOT EXISTS scenarios (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sources TEXT,
  actors TEXT,
  events TEXT,
  actions TEXT,
  obstacles TEXT,
  constraints TEXT,
  pre_conditions TEXT,
  post_conditions TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'resolved')),
  issues TEXT,
  requirements_text TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scenario_goals (
  scenario_id INTEGER NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  PRIMARY KEY (scenario_id, goal_id)
);

-- Goal keyword definitions with lock/unlock
CREATE TABLE IF NOT EXISTS keyword_definitions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  definition TEXT NOT NULL,
  locked BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  locked_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, keyword)
);

-- Access log: append-only, tamper-evident audit trail
-- object_id is TEXT rather than INTEGER because it needs to hold either a plain
-- integer id (goals, scenarios, ...) or a UUID (profiles/users), depending on
-- object_type.
CREATE TABLE IF NOT EXISTS access_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  object_type TEXT NOT NULL,
  object_id TEXT,
  ip_address TEXT,
  detail TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION access_logs_immutable() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'access_logs is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS access_logs_no_update ON access_logs;
CREATE TRIGGER access_logs_no_update BEFORE UPDATE ON access_logs
  FOR EACH ROW EXECUTE FUNCTION access_logs_immutable();

DROP TRIGGER IF EXISTS access_logs_no_delete ON access_logs;
CREATE TRIGGER access_logs_no_delete BEFORE DELETE ON access_logs
  FOR EACH ROW EXECUTE FUNCTION access_logs_immutable();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_goals_project ON goals(project_id);
CREATE INDEX IF NOT EXISTS idx_goals_document ON goals(document_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_project ON scenarios(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_occurred ON access_logs(occurred_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_object ON access_logs(object_type);
CREATE INDEX IF NOT EXISTS idx_classification_types_project ON classification_types(project_id);
CREATE INDEX IF NOT EXISTS idx_keyword_definitions_project ON keyword_definitions(project_id);
CREATE INDEX IF NOT EXISTS idx_goal_custom_classifications_goal ON goal_custom_classifications(goal_id);

-- Auto-create a profile row for every new Supabase Auth signup. Starts 'pending'
-- with no role until the user completes onboarding and an admin approves them.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, status)
  VALUES (NEW.id, NEW.email, 'pending')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security: our Express API is the only intended way to read or write
-- this data. It connects with the `postgres` role, which has BYPASSRLS, so RLS
-- has no effect on Express and needs no policies here. What it does do is close
-- off Supabase's auto-generated PostgREST REST API, which otherwise exposes every
-- public table to anyone holding the publishable/anon key (embedded in the
-- client bundle by design). Enabling RLS with zero policies makes that path
-- deny-by-default while leaving the app itself completely unaffected.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_subject_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_document_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE classification_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE classification_type_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_custom_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
