// One-time convenience script: creates a small set of pre-approved demo accounts
// (one per role) directly in Supabase's auth schema, so the app can be tried out
// immediately without going through the sign-up/approval flow every time. Not run
// automatically — invoke with `node db/seedDemoUsers.js` whenever you want them
// (re-running is safe; existing accounts are left untouched).
const { pool, query, withTransaction } = require('./connection');

const INSTANCE_ID = '00000000-0000-0000-0000-000000000000';
const DEMO_PASSWORD = 'Demo@1234';

const ACCOUNTS = [
  { email: 'admin@sprat.dev', name: 'Demo Admin', role: 'admin' },
  { email: 'manager@sprat.dev', name: 'Demo Project Manager', role: 'project_manager' },
  { email: 'analyst@sprat.dev', name: 'Demo Analyst', role: 'analyst' },
  { email: 'guest@sprat.dev', name: 'Demo Guest', role: 'guest' },
];

async function createDemoUser({ email, name, role }) {
  const existing = await query('SELECT id FROM auth.users WHERE email = $1', [email]);
  if (existing.length > 0) {
    console.log(`Skipping ${email} — already exists.`);
    return;
  }

  await withTransaction(async (tx) => {
    const user = await tx.queryOne(
      `INSERT INTO auth.users (
         instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
         confirmation_token, recovery_token, email_change_token_new, email_change,
         raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
       ) VALUES (
         $1, gen_random_uuid(), 'authenticated', 'authenticated', $2,
         extensions.crypt($3, extensions.gen_salt('bf')), now(),
         '', '', '', '',
         '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, now(), now()
       )
       RETURNING id`,
      [INSTANCE_ID, email, DEMO_PASSWORD]
    );

    await tx.query(
      `INSERT INTO auth.identities (
         id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
       ) VALUES (
         gen_random_uuid(), $1, $2,
         jsonb_build_object('sub', $3::text, 'email', $4::text, 'email_verified', true, 'phone_verified', false),
         'email', now(), now(), now()
       )`,
      [user.id, user.id, String(user.id), email]
    );

    // The handle_new_user trigger already created a 'pending' profile row for us —
    // just promote it straight to active with its intended role.
    await tx.query(
      `UPDATE profiles SET name = $1, role = $2, status = 'active', updated_at = now() WHERE id = $3`,
      [name, role, user.id]
    );
  });

  console.log(`Created ${role.padEnd(16)} ${email} / ${DEMO_PASSWORD}`);
}

async function main() {
  for (const account of ACCOUNTS) {
    await createDemoUser(account);
  }
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
