const fs = require('fs');
const path = require('path');
const db = require('./connection');

db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const migrationsDir = path.join(__dirname, 'migrations');
const applied = new Set(
  db.prepare('SELECT name FROM schema_migrations').all().map((row) => row.name)
);

const files = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort();

let ranAny = false;
for (const file of files) {
  if (applied.has(file)) continue;
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  console.log(`Applying migration: ${file}`);
  db.exec(sql);
  db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(file);
  ranAny = true;
}

console.log(ranAny ? 'Migrations complete.' : 'No pending migrations.');
