/**
 * PostgreSQL Connection Pool for HireLocal
 * Connects to PostgreSQL using pg.Pool with configurable environment variables.
 * Supports local PostgreSQL, Docker, and Hosted Supabase / Cloud Postgres with SSL.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;

export const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1'))
        ? false
        : { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: process.env.NODE_ENV === 'test' ? 500 : 30000,
      connectionTimeoutMillis: 10000
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'hirelocal',
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: process.env.NODE_ENV === 'test' ? 500 : 30000,
      connectionTimeoutMillis: 5000
    };

export const pool = process.env.NODE_ENV === 'test'
  ? { query: async () => ({ rows: [] }), end: async () => {}, on: () => {} }
  : new Pool(connectionConfig);

if (process.env.NODE_ENV !== 'test') {
  pool.on('error', (err) => {
    console.error('[PostgreSQL Pool Error]: Unexpected error on idle client', err.message);
  });
}

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {

  }
  return res;
}
