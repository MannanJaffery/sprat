const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set in the environment (Supabase Postgres connection string).');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Thin query helper matching the shape services use: db.query(sql, params) -> rows.
async function query(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}

// Convenience for the common "expect zero or one row" case.
async function queryOne(text, params) {
  const rows = await query(text, params);
  return rows[0];
}

// Runs `fn(client)` inside a BEGIN/COMMIT transaction, rolling back on error.
// `client` exposes the same `.query(text, params)` shape as the pool itself.
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const scopedQuery = async (text, params) => (await client.query(text, params)).rows;
    const result = await fn({
      query: scopedQuery,
      queryOne: async (text, params) => (await scopedQuery(text, params))[0],
    });
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, queryOne, withTransaction };
