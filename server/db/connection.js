const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config();

// DB_FILE is specified relative to the server/ root (see .env.example), not this file's folder.
const SERVER_ROOT = path.resolve(__dirname, '..');
const dbFile = path.resolve(SERVER_ROOT, process.env.DB_FILE || 'db/sprat.sqlite3');

const db = new Database(dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
