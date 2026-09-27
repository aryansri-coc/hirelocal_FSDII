-- HireLocal Database Schema
-- Implements Section 18 of the Build Specification + Real RBAC, Notifications & Audit Logs

CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(100),
  address TEXT,
  role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'worker', 'admin')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_categories (
  service_id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workers (
  worker_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  profession VARCHAR(50) NOT NULL,
  skills TEXT NOT NULL, -- JSON Array of skill tags
  experience INT DEFAULT 0,
  language VARCHAR(30) DEFAULT 'hi',
  languages TEXT, -- JSON Array of spoken languages e.g. ["hi", "en"]
  location_name VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  service_radius DECIMAL(5, 2) DEFAULT 15.0, -- in km
  communication_type VARCHAR(20) NOT NULL CHECK (communication_type IN ('smartphone', 'non_smartphone')),
  rating DECIMAL(3, 2) DEFAULT 0.0,
  reliability INT DEFAULT NULL, -- percentage 0-100 or NULL if new
  completed_jobs INT DEFAULT 0,
  total_accepted_jobs INT DEFAULT 0,
  daily_rate DECIMAL(8, 2) DEFAULT 500.0,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline', 'unverified')),
  verification_status VARCHAR(20) DEFAULT 'verified' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended')),
  working_days TEXT, -- JSON Array of working days e.g. ["Mon", "Tue", "Wed"]
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jobs (
  job_id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  customer_name VARCHAR(100),
  customer_phone VARCHAR(15),
  worker_id VARCHAR(36),
  worker_name VARCHAR(100),
  service_type VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  required_date DATE NOT NULL,
  preferred_time VARCHAR(20) DEFAULT 'flexible' CHECK (preferred_time IN ('morning', 'afternoon', 'evening', 'flexible')),
  description TEXT NOT NULL,
  status VARCHAR(35) NOT NULL CHECK (
    status IN (
      'REQUESTED',
      'PENDING_WORKER_RESPONSE',
      'ACCEPTED',
      'REJECTED',
      'CUSTOMER_AND_WORKER_CONNECTED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED'
    )
  ),
  estimated_cost DECIMAL(8, 2),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(user_id),
  FOREIGN KEY (worker_id) REFERENCES workers(worker_id)
);

CREATE TABLE IF NOT EXISTS ratings (
  rating_id VARCHAR(36) PRIMARY KEY,
  job_id VARCHAR(36) NOT NULL UNIQUE,
  customer_id VARCHAR(36) NOT NULL,
  customer_name VARCHAR(100),
  worker_id VARCHAR(36) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  moderation_status VARCHAR(20) DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'flagged', 'hidden')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(job_id),
  FOREIGN KEY (customer_id) REFERENCES users(user_id),
  FOREIGN KEY (worker_id) REFERENCES workers(worker_id)
);

CREATE TABLE IF NOT EXISTS call_logs (
  call_id VARCHAR(36) PRIMARY KEY,
  worker_id VARCHAR(36) NOT NULL,
  job_id VARCHAR(36),
  call_type VARCHAR(30) DEFAULT 'job_notification',
  language VARCHAR(10) DEFAULT 'hi',
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration INT DEFAULT 0, -- in seconds
  response VARCHAR(50),
  status VARCHAR(20) DEFAULT 'initiated',
  metadata TEXT, -- JSON logs
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES workers(worker_id),
  FOREIGN KEY (job_id) REFERENCES jobs(job_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  entity_type VARCHAR(50),
  entity_id VARCHAR(36),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  log_id VARCHAR(36) PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actor_id VARCHAR(36),
  actor_name VARCHAR(100),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(36),
  source VARCHAR(30) DEFAULT 'web',
  metadata TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_workers_profession ON workers(profession);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);
CREATE INDEX IF NOT EXISTS idx_jobs_customer ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_worker ON jobs(worker_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_ratings_worker ON ratings(worker_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
