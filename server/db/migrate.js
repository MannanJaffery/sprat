const fs = require('fs');
const path = require('path');
const { pool, query } = require('./connection');

async function main() {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const appliedRows = await query('SELECT name FROM schema_migrations');
  const applied = new Set(appliedRows.map((row) => row.name));

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  let ranAny = false;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Applying migration: ${file}`);
    await query(sql);
    await query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
    ranAny = true;
  }

  console.log(ranAny ? 'Migrations complete.' : 'No pending migrations.');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
