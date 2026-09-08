-- SPRAT scope expansion: FR8 search, FR9 dynamic classification types,
-- FR10 group-to-project assignment, FR11 keyword definitions, NFR4 auditability hardening.

-- ---------------------------------------------------------------------------
-- FR9: dynamically added goal classification types + analyst-raised requests
-- (FR-GSM 5, FR-GSM 6). Built-in dimensions still live in goal_classifications;
-- these tables hold project-defined dimensions and their submitted values.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classification_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type_key TEXT NOT NULL,
  label TEXT NOT NULL,
  options TEXT NOT NULL,               -- JSON array of allowed values
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (project_id, type_key)
);

CREATE TABLE IF NOT EXISTS classification_type_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requested_by INTEGER NOT NULL REFERENCES users(id),
  label TEXT NOT NULL,
  options TEXT NOT NULL,               -- JSON array of allowed values
  rationale TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  decided_by INTEGER REFERENCES users(id),
  decided_at TEXT,
  created_type_id INTEGER REFERENCES classification_types(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS goal_custom_classifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  classification_type_id INTEGER NOT NULL REFERENCES classification_types(id) ON DELETE CASCADE,
  analyst_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (goal_id, classification_type_id, analyst_id)
);

-- ---------------------------------------------------------------------------
-- FR10: PM assigns whole user groups to a project (FR-UA 2e). Assigning a group
-- also materialises each member as a project_member so existing access checks
-- keep working unchanged.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_user_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_group_id INTEGER NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  added_by INTEGER REFERENCES users(id),
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (project_id, user_group_id)
);

-- ---------------------------------------------------------------------------
-- FR11: goal keyword definitions with lock/unlock (FR-GSM 14, FR-GSM 15).
-- A locked definition can only be edited or unlocked by the project manager
-- or the analyst who first created it.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS keyword_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  definition TEXT NOT NULL,
  locked INTEGER NOT NULL DEFAULT 0 CHECK (locked IN (0, 1)),
  created_by INTEGER NOT NULL REFERENCES users(id),
  locked_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (project_id, keyword)
);

-- ---------------------------------------------------------------------------
-- NFR4: auditability / accountability. Richer context on each entry, plus
-- database-level guarantees that the access log is append-only (tamper-evident).
-- ---------------------------------------------------------------------------
ALTER TABLE access_logs ADD COLUMN ip_address TEXT;
ALTER TABLE access_logs ADD COLUMN detail TEXT;

CREATE TRIGGER IF NOT EXISTS access_logs_no_update
BEFORE UPDATE ON access_logs
BEGIN
  SELECT RAISE(ABORT, 'access_logs is append-only (NFR4)');
END;

CREATE TRIGGER IF NOT EXISTS access_logs_no_delete
BEFORE DELETE ON access_logs
BEGIN
  SELECT RAISE(ABORT, 'access_logs is append-only (NFR4)');
END;

CREATE INDEX IF NOT EXISTS idx_access_logs_occurred ON access_logs(occurred_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_object ON access_logs(object_type);
CREATE INDEX IF NOT EXISTS idx_classification_types_project ON classification_types(project_id);
CREATE INDEX IF NOT EXISTS idx_keyword_definitions_project ON keyword_definitions(project_id);
CREATE INDEX IF NOT EXISTS idx_goal_custom_classifications_goal ON goal_custom_classifications(goal_id);
