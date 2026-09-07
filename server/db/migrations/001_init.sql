-- SPRAT core schema
-- FR1 substrate: users, user_groups
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'project_manager', 'analyst', 'guest')),
  user_group_id INTEGER REFERENCES user_groups(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Projects & membership (substrate for FR-UA project scoping / NFR1)
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guest_restrictions TEXT, -- JSON array of allowed domain_ids, NULL = unrestricted
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (project_id, user_id)
);

-- Domains & documents/policies (substrate for FR-ADM, needed by FR2/FR3/FR6/FR7)
CREATE TABLE IF NOT EXISTS domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (project_id, name)
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  domain_id INTEGER REFERENCES domains(id),
  name TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  source_url TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- FR2: Manage Goals
CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  goal_code TEXT NOT NULL,
  description TEXT NOT NULL,
  taxonomy_category TEXT NOT NULL CHECK (taxonomy_category IN ('protection', 'vulnerability')),
  taxonomy_subtype TEXT NOT NULL,
  granularity TEXT NOT NULL CHECK (granularity IN ('policy', 'scenario')),
  observable INTEGER NOT NULL DEFAULT 1 CHECK (observable IN (0, 1)),
  actor TEXT,
  context_excerpt TEXT,
  relevant_legislation TEXT,
  replaced_by_goal_id INTEGER REFERENCES goals(id),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (project_id, goal_code)
);

-- FR-GSM4: multi-select subject classification
CREATE TABLE IF NOT EXISTS goal_subject_classifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  subject_classification TEXT NOT NULL,
  UNIQUE (goal_id, subject_classification)
);

-- FR3 (occurrence analytics) + FR6 (traceability): goal <-> document links
CREATE TABLE IF NOT EXISTS goal_document_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  UNIQUE (goal_id, document_id)
);

-- FR4: multi-analyst classification comparison
CREATE TABLE IF NOT EXISTS goal_classifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  analyst_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  classification_type TEXT NOT NULL CHECK (classification_type IN
    ('policy_vs_scenario', 'observable_vs_unobservable', 'protection_vs_vulnerability')),
  classification_value TEXT NOT NULL,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (goal_id, analyst_id, classification_type)
);

-- FR5: Manage Scenarios
CREATE TABLE IF NOT EXISTS scenarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scenario_goals (
  scenario_id INTEGER NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  PRIMARY KEY (scenario_id, goal_id)
);

-- SR-1: access/audit log
CREATE TABLE IF NOT EXISTS access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  object_type TEXT NOT NULL,
  object_id INTEGER,
  occurred_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_goals_project ON goals(project_id);
CREATE INDEX IF NOT EXISTS idx_goals_document ON goals(document_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_project ON scenarios(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs(user_id);
