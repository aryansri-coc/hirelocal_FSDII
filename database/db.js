/**
 * Database Layer for HireLocal
 * Unified PostgreSQL 18 + Relational Store
 * When DB_CLIENT=postgres, persists directly into PostgreSQL tables with full ACID compliance.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pgPool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_DIR = path.resolve(__dirname, 'storage');
const DB_FILE = path.join(STORAGE_DIR, 'hirelocal_db.json');
const SEED_FILE = path.resolve(__dirname, 'seed', 'seedData.json');

class DatabaseStore {
  constructor() {
    this.isPostgres = process.env.DB_CLIENT === 'postgres' || !!process.env.DATABASE_URL;
    this.data = {
      users: [],
      service_categories: [],
      workers: [],
      jobs: [],
      ratings: [],
      call_logs: [],
      notifications: [],
      audit_logs: []
    };
    this.init();
  }

  async init() {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }

    if (this.isPostgres) {
      try {
        console.log('🐘 Connecting HireLocal to PostgreSQL 18...');
        await this.loadFromPostgres();
        console.log('✓ Successfully loaded and synchronized with PostgreSQL 18!');
        return;
      } catch (err) {
        console.warn('! PostgreSQL connection failed, falling back to local storage:', err.message);
      }
    }

    // File-backed fallback
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users || [],
          service_categories: parsed.service_categories || [],
          workers: parsed.workers || [],
          jobs: parsed.jobs || [],
          ratings: parsed.ratings || [],
          call_logs: parsed.call_logs || [],
          notifications: parsed.notifications || [],
          audit_logs: parsed.audit_logs || []
        };
        console.log('✓ HireLocal database loaded from disk storage.');
      } catch (err) {
        this.seed();
      }
    } else {
      this.seed();
    }
  }

  async loadFromPostgres() {
    const usersRes = await pool.query('SELECT * FROM users');
    const categoriesRes = await pool.query('SELECT * FROM service_categories WHERE active = true');
    const workersRes = await pool.query(`
      SELECT w.*, COALESCE(u.name, 'Worker') AS name, COALESCE(u.phone, '') AS phone
      FROM workers w
      LEFT JOIN users u ON w.user_id = u.user_id
    `);
    const jobsRes = await pool.query('SELECT * FROM jobs ORDER BY created_at DESC');
    const ratingsRes = await pool.query('SELECT * FROM ratings ORDER BY created_at DESC');
    const callLogsRes = await pool.query('SELECT * FROM call_logs ORDER BY start_time DESC');
    const notifsRes = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
    const auditRes = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC');

    this.data.users = usersRes.rows;
    this.data.service_categories = categoriesRes.rows;
    this.data.workers = workersRes.rows.map((w) => ({
      ...w,
      skills: typeof w.skills === 'string' ? JSON.parse(w.skills) : w.skills,
      languages: typeof w.languages === 'string' ? JSON.parse(w.languages) : w.languages,
      working_days: typeof w.working_days === 'string' ? JSON.parse(w.working_days) : w.working_days,
      location: {
        name: w.location_name,
        lat: parseFloat(w.latitude) || 23.2332,
        lng: parseFloat(w.longitude) || 77.4343
      },
      rating: parseFloat(w.rating) || 5.0,
      daily_rate: parseFloat(w.daily_rate) || 500
    }));
    this.data.jobs = jobsRes.rows.map((j) => ({
      ...j,
      latitude: parseFloat(j.latitude),
      longitude: parseFloat(j.longitude),
      estimated_cost: parseFloat(j.estimated_cost)
    }));
    this.data.ratings = ratingsRes.rows;
    this.data.call_logs = callLogsRes.rows;
    this.data.notifications = notifsRes.rows;
    this.data.audit_logs = auditRes.rows;

    this.persist();
  }

  seed() {
    if (fs.existsSync(SEED_FILE)) {
      const raw = fs.readFileSync(SEED_FILE, 'utf-8');
      const seedObj = JSON.parse(raw);
      this.data = {
        users: seedObj.users || [],
        service_categories: seedObj.service_categories || [],
        workers: seedObj.workers || [],
        jobs: seedObj.jobs || [],
        ratings: seedObj.ratings || [],
        call_logs: seedObj.call_logs || [],
        notifications: seedObj.notifications || [],
        audit_logs: seedObj.audit_logs || []
      };
      this.persist();
    }
  }

  persist() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  // --- Collection Query Helpers ---
  getCollection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return this.data[name];
  }

  find(collectionName, predicate = () => true) {
    return this.getCollection(collectionName).filter(predicate);
  }

  findOne(collectionName, predicate) {
    return this.getCollection(collectionName).find(predicate) || null;
  }

  findById(collectionName, idField, idValue) {
    return this.findOne(collectionName, (item) => String(item[idField]) === String(idValue));
  }

  insert(collectionName, record) {
    this.getCollection(collectionName).push(record);
    this.persist();

    // Asynchronously sync to PostgreSQL if connected
    if (this.isPostgres) {
      this.syncInsertToPostgres(collectionName, record).catch((err) => {
        console.error(`[PostgreSQL Sync Error] Failed to insert into ${collectionName}:`, err.message);
      });
    }

    return record;
  }

  async syncInsertToPostgres(collectionName, record) {
    try {
      if (collectionName === 'users') {
        await pool.query(
          `INSERT INTO users (user_id, name, phone, email, address, role, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, address = EXCLUDED.address`,
          [record.user_id, record.name, record.phone, record.email || null, record.address || '', record.role, record.status || 'active']
        );
      } else if (collectionName === 'workers') {
        await pool.query(
          `INSERT INTO workers (
            worker_id, user_id, profession, skills, experience, language, languages,
            location_name, latitude, longitude, service_radius, communication_type,
            rating, reliability, completed_jobs, total_accepted_jobs, daily_rate,
            status, verification_status, account_status, working_days, bio
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          ON CONFLICT (worker_id) DO UPDATE SET
            profession = EXCLUDED.profession, skills = EXCLUDED.skills, experience = EXCLUDED.experience,
            daily_rate = EXCLUDED.daily_rate, status = EXCLUDED.status, service_radius = EXCLUDED.service_radius`,
          [
            record.worker_id,
            record.user_id,
            record.profession,
            JSON.stringify(record.skills || []),
            record.experience || 0,
            record.language || 'hi',
            JSON.stringify(record.languages || ['hi']),
            record.location?.name || record.location_name || 'Bhopal, MP',
            record.location?.lat || record.latitude || 23.2332,
            record.location?.lng || record.longitude || 77.4343,
            record.service_radius || 15.0,
            record.communication_type || 'smartphone',
            record.rating || 5.0,
            record.reliability,
            record.completed_jobs || 0,
            record.total_accepted_jobs || 0,
            record.daily_rate || 500,
            record.status || 'available',
            record.verification_status || 'verified',
            record.account_status || 'active',
            JSON.stringify(record.working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
            record.bio || ''
          ]
        );
      } else if (collectionName === 'jobs') {
        await pool.query(
          `INSERT INTO jobs (
            job_id, customer_id, customer_name, customer_phone, worker_id, worker_name,
            service_type, address, latitude, longitude, required_date, preferred_time,
            description, status, estimated_cost
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (job_id) DO UPDATE SET status = EXCLUDED.status`,
          [
            record.job_id,
            record.customer_id,
            record.customer_name || 'Customer',
            record.customer_phone || '',
            record.worker_id,
            record.worker_name,
            record.service_type,
            record.address,
            record.latitude || 23.2332,
            record.longitude || 77.4343,
            record.required_date,
            record.preferred_time || 'flexible',
            record.description,
            record.status,
            record.estimated_cost || 500
          ]
        );
      } else if (collectionName === 'ratings') {
        await pool.query(
          `INSERT INTO ratings (rating_id, job_id, customer_id, customer_name, worker_id, rating, review, moderation_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (rating_id) DO NOTHING`,
          [record.rating_id, record.job_id, record.customer_id, record.customer_name, record.worker_id, record.rating, record.review, record.moderation_status || 'approved']
        );
      } else if (collectionName === 'call_logs') {
        await pool.query(
          `INSERT INTO call_logs (call_id, worker_id, job_id, call_type, language, start_time, duration, response, status, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (call_id) DO NOTHING`,
          [record.call_id, record.worker_id, record.job_id, record.call_type || 'job_notification', record.language || 'hi', record.start_time || new Date().toISOString(), record.duration || 0, record.response, record.status, record.metadata]
        );
      } else if (collectionName === 'notifications') {
        await pool.query(
          `INSERT INTO notifications (notification_id, user_id, title, message, type, entity_type, entity_id, read)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (notification_id) DO NOTHING`,
          [record.notification_id, record.user_id, record.title, record.message, record.type || 'info', record.entity_type, record.entity_id, record.read || false]
        );
      } else if (collectionName === 'audit_logs') {
        await pool.query(
          `INSERT INTO audit_logs (log_id, actor_id, actor_name, action, entity_type, entity_id, source, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (log_id) DO NOTHING`,
          [record.log_id, record.actor_id, record.actor_name, record.action, record.entity_type, record.entity_id, record.source || 'web', record.metadata]
        );
      }
    } catch (err) {
      console.error(`PostgreSQL sync error on ${collectionName}:`, err.message);
    }
  }

  update(collectionName, predicate, updates) {
    const coll = this.getCollection(collectionName);
    let updatedCount = 0;
    for (let i = 0; i < coll.length; i++) {
      if (predicate(coll[i])) {
        coll[i] = {
          ...coll[i],
          ...updates,
          updated_at: new Date().toISOString()
        };
        updatedCount++;

        // Async PostgreSQL update
        if (this.isPostgres) {
          this.syncUpdateToPostgres(collectionName, coll[i]).catch(console.error);
        }
      }
    }
    if (updatedCount > 0) {
      this.persist();
    }
    return updatedCount;
  }

  async syncUpdateToPostgres(collectionName, item) {
    try {
      if (collectionName === 'jobs') {
        await pool.query(
          `UPDATE jobs SET status = $1, worker_id = $2, worker_name = $3, rejection_reason = $4, updated_at = CURRENT_TIMESTAMP WHERE job_id = $5`,
          [item.status, item.worker_id, item.worker_name, item.rejection_reason || null, item.job_id]
        );
      } else if (collectionName === 'workers') {
        await pool.query(
          `UPDATE workers SET
            rating = $1, reliability = $2, completed_jobs = $3, total_accepted_jobs = $4,
            status = $5, daily_rate = $6, verification_status = $7, updated_at = CURRENT_TIMESTAMP
           WHERE worker_id = $8`,
          [item.rating, item.reliability, item.completed_jobs, item.total_accepted_jobs, item.status, item.daily_rate, item.verification_status || 'verified', item.worker_id]
        );
      } else if (collectionName === 'users') {
        await pool.query(
          `UPDATE users SET name = $1, email = $2, address = $3, status = $4, role = $5, updated_at = CURRENT_TIMESTAMP WHERE user_id = $6`,
          [item.name, item.email, item.address, item.status || 'active', item.role, item.user_id]
        );
      } else if (collectionName === 'notifications') {
        await pool.query(
          `UPDATE notifications SET read = $1 WHERE notification_id = $2`,
          [item.read, item.notification_id]
        );
      }
    } catch (err) {
      console.error(`PostgreSQL update sync error on ${collectionName}:`, err.message);
    }
  }

  delete(collectionName, predicate) {
    const originalLen = this.getCollection(collectionName).length;
    this.data[collectionName] = this.getCollection(collectionName).filter((item) => !predicate(item));
    const deletedCount = originalLen - this.data[collectionName].length;
    if (deletedCount > 0) {
      this.persist();
    }
    return deletedCount;
  }

  // --- Audit Log Helpers ---
  addAuditLog({ actorId = 'system', actorName = 'System', action, entityType, entityId, source = 'web', metadata = {} }) {
    const logRecord = {
      log_id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      actor_id: actorId,
      actor_name: actorName,
      action,
      entity_type: entityType,
      entity_id: entityId,
      source,
      metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : String(metadata)
    };
    this.insert('audit_logs', logRecord);
    return logRecord;
  }

  // --- Notification Helpers ---
  addNotification({ userId, title, message, type = 'info', entityType = null, entityId = null }) {
    if (!userId) return null;
    const notif = {
      notification_id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      title,
      message,
      type,
      entity_type: entityType,
      entity_id: entityId,
      read: false,
      created_at: new Date().toISOString()
    };
    this.insert('notifications', notif);
    return notif;
  }

  resetToSeed() {
    this.seed();
    return { success: true, message: 'Database reset to initial seed state.' };
  }
}

export const db = new DatabaseStore();
