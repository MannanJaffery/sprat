-- One-time bootstrap: promote the first admin account.
--
-- Admin accounts are never created through the app itself (by design — see
-- middleware/auth.js and services/users.js). To get your first admin:
--   1. Sign up normally through the app (POST /signup in the browser).
--   2. Run this statement in the Supabase SQL editor, with your own email:

UPDATE profiles
SET role = 'admin', status = 'active', requested_role = NULL
WHERE email = 'you@example.com';
