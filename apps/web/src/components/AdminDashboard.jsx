import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Briefcase,
  Calendar,
  PhoneCall,
  Star,
  Bell,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

export default function AdminDashboard({ initialTab = 'overview' }) {
  const { showToast } = useAuth();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [callbotData, setCallbotData] = useState({ metrics: {}, logs: [] });
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [workerSearch, setWorkerSearch] = useState('');
  const [workerVerifFilter, setWorkerVerifFilter] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [
        metricsRes,
        usersRes,
        workersRes,
        jobsRes,
        ratingsRes,
        callbotRes,
        auditRes
      ] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminUsers({ search: userSearch, role: userRoleFilter }),
        api.getAdminWorkers({ search: workerSearch, verification_status: workerVerifFilter }),
        api.getAdminJobs({ status: jobStatusFilter }),
        api.getAdminRatings(),
        api.getAdminCallbot(),
        api.getAdminAuditLogs({ search: auditSearch })
      ]);

      if (metricsRes.success) setMetrics(metricsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (workersRes.success) setWorkers(workersRes.data);
      if (jobsRes.success) setJobs(jobsRes.data);
      if (ratingsRes.success) setRatings(ratingsRes.data);
      if (callbotRes.success) setCallbotData(callbotRes);
      if (auditRes.success) setAuditLogs(auditRes.data);
    } catch (err) {
      console.error(err);
      showToast('Error loading administrative data.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [userSearch, userRoleFilter, workerSearch, workerVerifFilter, jobStatusFilter, auditSearch]);

  const handleUpdateUserStatus = async (userId, newStatus) => {
    try {
      const res = await api.updateUserStatus(userId, newStatus);
      if (res.success) {
        showToast(`User status updated to ${newStatus}`, 'success');
        fetchAdminData();
      }
    } catch (err) {
      showToast(err.message || 'Status update failed', 'danger');
    }
  };

  const handleUpdateWorkerVerification = async (workerId, newStatus) => {
    try {
      const res = await api.updateWorkerVerification(workerId, newStatus);
      if (res.success) {
        showToast(`Worker verification updated to ${newStatus}`, 'success');
        fetchAdminData();
      }
    } catch (err) {
      showToast(err.message || 'Verification update failed', 'danger');
    }
  };

  const handleResetDb = async () => {
    if (!window.confirm('Reset database to clean seed data?')) return;
    try {
      const res = await api.resetDatabase();
      if (res.success) {
        showToast('Database reset to clean state!', 'success');
        fetchAdminData();
      }
    } catch (err) {
      showToast(err.message || 'Reset failed', 'danger');
    }
  };

  return (
    <div className="dashboard-layout">
      {/* ADMIN SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div style={{
          paddingBottom: '16px',
          marginBottom: '16px',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Administration
          </div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
            Control Center
          </div>
        </div>

        <nav>
          <button
            className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <TrendingUp size={18} />
            <span>Overview</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} />
            <span>Users</span>
            {users.length > 0 && <span className="tag" style={{ marginLeft: 'auto' }}>{users.length}</span>}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'workers' ? 'active' : ''}`}
            onClick={() => setActiveTab('workers')}
          >
            <Briefcase size={18} />
            <span>Workers</span>
            {workers.length > 0 && <span className="tag" style={{ marginLeft: 'auto' }}>{workers.length}</span>}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            <Calendar size={18} />
            <span>Jobs</span>
            {jobs.length > 0 && <span className="tag" style={{ marginLeft: 'auto' }}>{jobs.length}</span>}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'callbot' ? 'active' : ''}`}
            onClick={() => setActiveTab('callbot')}
          >
            <PhoneCall size={18} />
            <span>CallBot Logs</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'ratings' ? 'active' : ''}`}
            onClick={() => setActiveTab('ratings')}
          >
            <Star size={18} />
            <span>Ratings</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <FileText size={18} />
            <span>Audit Logs</span>
          </button>
        </nav>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', color: 'var(--error)', borderColor: '#FECACA' }}
            onClick={handleResetDb}
          >
            <RefreshCw size={14} />
            <span>Reset Demo DB</span>
          </button>
        </div>
      </aside>

      {/* MAIN ADMIN WORKSPACE */}
      <main>
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '4px' }}>
                Platform Overview
              </h1>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
                Marketplace health metrics, verification status, and transaction totals.
              </p>
            </div>

            {/* Metrics Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px'
            }}>
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Total Users
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>
                  {metrics?.total_users || users.length}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {metrics?.total_customers || 0} customers • {metrics?.total_workers || 0} workers
                </div>
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Verified Workers
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                  {metrics?.verified_workers || 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {metrics?.pending_workers || 0} pending review
                </div>
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Total Bookings
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                  {metrics?.total_jobs || jobs.length}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {metrics?.completed_jobs || 0} completed
                </div>
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  CallBot Calls Placed
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>
                  {metrics?.total_callbot_calls || callbotData.logs?.length || 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Voice telephony gateway
                </div>
              </div>
            </div>

            {/* Quick Status Breakdown */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>
                Operational Health
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Database Engine:</span>
                  <div style={{ fontWeight: 700, color: 'var(--success)' }}>PostgreSQL 18 (ACID Compliant)</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Role-Based Access:</span>
                  <div style={{ fontWeight: 700 }}>Enforced via Bearer Auth</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Deterministic Matching:</span>
                  <div style={{ fontWeight: 700 }}>Active (Formula Weighted)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Users Directory</h1>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search name or phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ width: '220px' }}
                />
                <select
                  className="form-select"
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  style={{ width: '130px' }}
                >
                  <option value="">All Roles</option>
                  <option value="customer">Customer</option>
                  <option value="worker">Worker</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td>{u.phone}</td>
                      <td>
                        <span className="tag" style={{ textTransform: 'capitalize' }}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill status-${u.status || 'active'}`}>
                          {u.status || 'active'}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        {u.role !== 'admin' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleUpdateUserStatus(u.user_id, u.status === 'suspended' ? 'active' : 'suspended')}
                          >
                            {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: WORKERS */}
        {activeTab === 'workers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Workers Management</h1>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search profession or name..."
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                  style={{ width: '220px' }}
                />
                <select
                  className="form-select"
                  value={workerVerifFilter}
                  onChange={(e) => setWorkerVerifFilter(e.target.value)}
                  style={{ width: '150px' }}
                >
                  <option value="">All Verification</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Worker</th>
                    <th>Trade</th>
                    <th>Rate</th>
                    <th>Channel</th>
                    <th>Verification</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((w) => (
                    <tr key={w.worker_id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{w.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{w.phone}</div>
                      </td>
                      <td>{w.profession}</td>
                      <td style={{ fontWeight: 600 }}>₹{w.daily_rate}/day</td>
                      <td>
                        <span className="tag">
                          {w.communication_type === 'non_smartphone' ? 'CallBot Voice' : 'Smartphone App'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill status-${w.verification_status || 'verified'}`}>
                          {w.verification_status || 'verified'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {w.verification_status !== 'verified' && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleUpdateWorkerVerification(w.worker_id, 'verified')}
                            >
                              Verify
                            </button>
                          )}
                          {w.verification_status !== 'rejected' && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleUpdateWorkerVerification(w.worker_id, 'rejected')}
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: JOBS */}
        {activeTab === 'jobs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Jobs & Bookings</h1>
              <select
                className="form-select"
                value={jobStatusFilter}
                onChange={(e) => setJobStatusFilter(e.target.value)}
                style={{ width: '180px' }}
              >
                <option value="">All Statuses</option>
                <option value="REQUESTED">Requested</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>Customer</th>
                    <th>Worker</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.job_id}>
                      <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{j.job_id.slice(-8)}</td>
                      <td>{j.customer_name}</td>
                      <td>{j.worker_name}</td>
                      <td>{j.service_type}</td>
                      <td>{j.required_date}</td>
                      <td>
                        <span className={`status-pill status-${j.status}`}>
                          {j.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>₹{j.estimated_cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: CALLBOT LOGS */}
        {activeTab === 'callbot' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>
              CallBot Telephony Logs
            </h1>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Call ID</th>
                    <th>Worker ID</th>
                    <th>Job ID</th>
                    <th>Duration</th>
                    <th>Response</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {(callbotData.logs || []).map((c) => (
                    <tr key={c.call_id}>
                      <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{c.call_id.slice(-8)}</td>
                      <td>{c.worker_id}</td>
                      <td>{c.job_id || 'N/A'}</td>
                      <td>{c.duration}s</td>
                      <td style={{ fontWeight: 600 }}>{c.response || 'Pending'}</td>
                      <td>
                        <span className="tag">{c.status}</span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(c.start_time).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {(callbotData.logs || []).length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        No CallBot telephony calls logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: RATINGS */}
        {activeTab === 'ratings' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>
              Customer Ratings
            </h1>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Worker ID</th>
                    <th>Rating</th>
                    <th>Review</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ratings.map((r) => (
                    <tr key={r.rating_id}>
                      <td style={{ fontWeight: 600 }}>{r.customer_name}</td>
                      <td>{r.worker_id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Star size={14} style={{ fill: '#F59E0B', color: '#F59E0B' }} />
                          <span style={{ fontWeight: 700 }}>{r.rating}</span>
                        </div>
                      </td>
                      <td style={{ maxWidth: '300px' }}>"{r.review}"</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800 }}>System Audit Trail</h1>
              <input
                type="text"
                className="form-input"
                placeholder="Search audit action..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                style={{ width: '220px' }}
              />
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.log_id}>
                      <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{log.log_id.slice(-8)}</td>
                      <td style={{ fontWeight: 600 }}>{log.actor_name}</td>
                      <td>
                        <span className="tag">{log.action}</span>
                      </td>
                      <td>{log.entity_type}: {log.entity_id}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
