-- Self-service join requests for projects and user groups. Any active user can
-- browse all projects/groups (see services/projects.js, services/userGroups.js)
-- and request to join one; an admin or project manager decides. Approving a
-- project request inserts a normal project_members row (unrestricted access —
-- the same as being added directly); approving a group request just sets the
-- requester's profiles.user_group_id, same as the existing PM-assigns-a-group
-- flow.

CREATE TABLE IF NOT EXISTS project_join_requests (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  decided_by UUID REFERENCES profiles(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, requested_by)
);

CREATE TABLE IF NOT EXISTS user_group_join_requests (
  id SERIAL PRIMARY KEY,
  user_group_id INTEGER NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  decided_by UUID REFERENCES profiles(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_group_id, requested_by)
);

CREATE INDEX IF NOT EXISTS idx_project_join_requests_project ON project_join_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_project_join_requests_status ON project_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_group_join_requests_group ON user_group_join_requests(user_group_id);
CREATE INDEX IF NOT EXISTS idx_user_group_join_requests_status ON user_group_join_requests(status);

ALTER TABLE project_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_group_join_requests ENABLE ROW LEVEL SECURITY;
