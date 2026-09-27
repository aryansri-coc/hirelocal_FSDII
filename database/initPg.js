/**
 * PostgreSQL Database Initializer & Migration Runner for HireLocal
 * 1. Creates 'hirelocal' database if it doesn't already exist.
 * 2. Applies database/schema/schema.sql DDL (tables, foreign keys, indexes).
 * 3. Populates synthetic seed data from database/seed/seedData.json.
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Client } = pg;

const host = process.env.PGHOST || 'localhost';
const port = parseInt(process.env.PGPORT || '5432', 10);
const user = process.env.PGUSER || 'postgres';
const password = process.env.PGPASSWORD || 'postgres';
const targetDb = process.env.PGDATABASE || 'hirelocal';

const SCHEMA_FILE = path.resolve(__dirname, 'schema', 'schema.sql');
const SEED_FILE = path.resolve(__dirname, 'seed', 'seedData.json');

async function initPostgres() {
  console.log('==================================================');
  console.log('🐘 Initializing HireLocal on PostgreSQL 18');
  console.log(`Connecting to ${host}:${port} as user '${user}'...`);

  // Step 1: Connect to default postgres DB to ensure target database exists
  const rootClient = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres'
  });

  try {
    await rootClient.connect();
    console.log('✓ Connected to PostgreSQL server.');

    const checkDb = await rootClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDb]
    );

    if (checkDb.rows.length === 0) {
      console.log(`Creating database '${targetDb}'...`);
      await rootClient.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`✓ Database '${targetDb}' created successfully.`);
    } else {
      console.log(`✓ Database '${targetDb}' verified.`);
    }
  } catch (err) {
    console.error('Error verifying database existence:', err.message);
    throw err;
  } finally {
    await rootClient.end();
  }

  // Step 2: Connect to target 'hirelocal' database
  console.log(`\nConnecting to database '${targetDb}'...`);
  const appClient = new Client({
    host,
    port,
    user,
    password,
    database: targetDb
  });

  try {
    await appClient.connect();
    console.log(`✓ Connected to '${targetDb}'.`);

    // Clean previous legacy schema tables if users table had old schema
    const checkUsersCol = await appClient.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'user_id'
    `);

    const hasOldSchema = await appClient.query(`
      SELECT 1 FROM information_schema.tables WHERE table_name = 'worker_profiles'
    `);

    if (hasOldSchema.rows.length > 0 || (checkUsersCol.rows.length === 0 && (await appClient.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'users'`)).rows.length > 0)) {
      console.log('Detected legacy table structure. Resetting public schema to match new specification...');
      await appClient.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
      console.log('✓ Schema reset complete.');
    }

    const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf-8');
    console.log('Executing schema.sql DDL statements...');
    await appClient.query(schemaSql);
    console.log('✓ All tables, foreign keys, and indexes created in PostgreSQL!');

    // Step 3: Populate seed data if tables are empty
    console.log('\nChecking seed data...');
    const userCount = await appClient.query('SELECT count(*) FROM users');
    if (parseInt(userCount.rows[0].count, 10) === 0) {
      console.log('Populating seed data from seedData.json...');
      const seedData = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));

      // Service Categories
      for (const cat of seedData.service_categories || []) {
        await appClient.query(
          `INSERT INTO service_categories (service_id, name, slug, description, icon, active)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (service_id) DO NOTHING`,
          [cat.service_id, cat.name, cat.slug, cat.description, cat.icon, cat.active]
        );
      }

      // Users
      for (const u of seedData.users || []) {
        await appClient.query(
          `INSERT INTO users (user_id, name, phone, email, address, role, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (user_id) DO NOTHING`,
          [u.user_id, u.name, u.phone, u.email || null, u.address || '', u.role, u.status || 'active']
        );
      }

      // Workers
      for (const w of seedData.workers || []) {
        await appClient.query(
          `INSERT INTO workers (
            worker_id, user_id, profession, skills, experience, language, languages,
            location_name, latitude, longitude, service_radius, communication_type,
            rating, reliability, completed_jobs, total_accepted_jobs, daily_rate,
            status, verification_status, account_status, working_days, bio
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          ON CONFLICT (worker_id) DO NOTHING`,
          [
            w.worker_id,
            w.user_id,
            w.profession,
            JSON.stringify(w.skills || []),
            w.experience || 0,
            w.language || 'hi',
            JSON.stringify(w.languages || ['hi']),
            w.location?.name || 'Bhopal, MP',
            w.location?.lat || 23.2332,
            w.location?.lng || 77.4343,
            w.service_radius || 15.0,
            w.communication_type,
            w.rating || 5.0,
            w.reliability,
            w.completed_jobs || 0,
            w.total_accepted_jobs || 0,
            w.daily_rate || 500,
            w.status || 'available',
            w.verification_status || 'verified',
            w.account_status || 'active',
            JSON.stringify(w.working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
            w.bio || ''
          ]
        );
      }

      // Jobs
      for (const j of seedData.jobs || []) {
        await appClient.query(
          `INSERT INTO jobs (
            job_id, customer_id, customer_name, customer_phone, worker_id, worker_name,
            service_type, address, latitude, longitude, required_date, preferred_time,
            description, status, estimated_cost
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (job_id) DO NOTHING`,
          [
            j.job_id,
            j.customer_id,
            j.customer_name || 'Customer',
            j.customer_phone || '9876543210',
            j.worker_id,
            j.worker_name || 'Worker',
            j.service_type,
            j.address,
            j.latitude || 23.2332,
            j.longitude || 77.4343,
            j.required_date,
            j.preferred_time || 'flexible',
            j.description,
            j.status,
            j.estimated_cost || 500
          ]
        );
      }

      // Ratings
      for (const r of seedData.ratings || []) {
        await appClient.query(
          `INSERT INTO ratings (rating_id, job_id, customer_id, customer_name, worker_id, rating, review, moderation_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (rating_id) DO NOTHING`,
          [r.rating_id, r.job_id, r.customer_id, r.customer_name || 'Verified Customer', r.worker_id, r.rating, r.review, 'approved']
        );
      }

      // Call Logs
      for (const cl of seedData.call_logs || []) {
        await appClient.query(
          `INSERT INTO call_logs (call_id, worker_id, job_id, call_type, language, start_time, duration, response, status, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (call_id) DO NOTHING`,
          [cl.call_id, cl.worker_id, cl.job_id, cl.call_type || 'job_notification', cl.language || 'hi', cl.start_time || new Date().toISOString(), cl.duration || 30, cl.response, cl.status || 'completed', cl.metadata]
        );
      }

      // Initial Notification & Audit
      await appClient.query(
        `INSERT INTO notifications (notification_id, user_id, title, message, type, read)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (notification_id) DO NOTHING`,
        ['notif_pg_init', 'usr_cust_1', 'Welcome to HireLocal on PostgreSQL!', 'PostgreSQL database is now active and operational.', 'info', false]
      );

      await appClient.query(
        `INSERT INTO audit_logs (log_id, actor_id, actor_name, action, entity_type, entity_id, source, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (log_id) DO NOTHING`,
        ['aud_pg_init', 'system', 'PostgreSQL Setup', 'DATABASE_INITIALIZED', 'system', 'hirelocal_pg', 'system', 'Schema and initial seed records created in PostgreSQL 18']
      );

      console.log('✓ Synthetic seed data successfully populated in PostgreSQL!');
    } else {
      console.log(`✓ PostgreSQL database already contains ${userCount.rows[0].count} users.`);
    }

    console.log('==================================================');
    console.log('🎉 PostgreSQL setup complete!');
    console.log(`Database URL: postgresql://${user}:****@${host}:${port}/${targetDb}`);
    console.log('==================================================');
  } catch (err) {
    console.error('Error during PostgreSQL migration/seed:', err);
    throw err;
  } finally {
    await appClient.end();
  }
}

initPostgres().then(() => process.exit(0)).catch((e) => {
  console.error('Fatal initialization error:', e);
  process.exit(1);
});
