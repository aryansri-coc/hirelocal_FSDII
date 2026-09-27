import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { JOB_STATUS, PREFERRED_TIME_LABELS } from '../../../../packages/shared/statusVocabulary.js';
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Check,
  X,
  PhoneCall,
  User,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Settings,
  TrendingUp,
  DollarSign
} from 'lucide-react';

export default function WorkerDashboard({ activeSubView = 'dashboard' }) {
  const { user, worker, showToast, refreshUser } = useAuth();
  const [workerJobs, setWorkerJobs] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('overview'); // 'overview' | 'requests' | 'my_jobs' | 'availability' | 'profile' | 'ratings'

  // Profile / Settings edit state
  const [dailyRate, setDailyRate] = useState(worker?.daily_rate || 500);
  const [statusVal, setStatusVal] = useState(worker?.status || 'available');
  const [commType, setCommType] = useState(worker?.communication_type || 'smartphone');
  const [profession, setProfession] = useState(worker?.profession || 'Electrician');
  const [skillsStr, setSkillsStr] = useState(worker?.skills ? worker.skills.join(', ') : '');
  const [workingDays, setWorkingDays] = useState(worker?.working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchWorkerData = async () => {
    setLoading(true);
    try {
      const [jobsRes, ratingsRes] = await Promise.all([
        api.getMyJobs(),
        worker?.worker_id ? api.getWorkerRatings(worker.worker_id) : Promise.resolve({ success: true, data: [] })
      ]);
      if (jobsRes.success) setWorkerJobs(jobsRes.data);
      if (ratingsRes.success) setRatings(ratingsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerData();
    if (worker) {
      setDailyRate(worker.daily_rate);
      setStatusVal(worker.status);
      setCommType(worker.communication_type);
      setProfession(worker.profession);
      setSkillsStr(worker.skills ? worker.skills.join(', ') : '');
      if (worker.working_days) setWorkingDays(worker.working_days);
    }
  }, [worker]);

  useEffect(() => {
    if (activeSubView === 'worker_requests') setCurrentTab('requests');
    else if (activeSubView === 'worker_jobs') setCurrentTab('my_jobs');
    else if (activeSubView === 'worker_profile') setCurrentTab('profile');
    else setCurrentTab('overview');
  }, [activeSubView]);

  const handleJobAction = async (jobId, newStatus) => {
    try {
      const res = await api.updateJobStatus(jobId, newStatus);
      if (res.success) {
        showToast(`Job updated to ${newStatus.replace(/_/g, ' ')}!`, 'success');
        fetchWorkerData();
        refreshUser();
      }
    } catch (err) {
      showToast(err.message || 'Action failed.', 'danger');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!worker?.worker_id) return;

    setSavingSettings(true);
    try {
      const parsedSkills = skillsStr.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await api.updateWorkerProfile(worker.worker_id, {
        daily_rate: Number(dailyRate),
        status: statusVal,
        communication_type: commType,
        profession,
        skills: parsedSkills,
        working_days: workingDays
      });
      if (res.success) {
        showToast('Settings and availability saved successfully!', 'success');
        refreshUser();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update settings.', 'danger');
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleDay = (day) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  // Filtered job lists
  const pendingRequests = workerJobs.filter((j) => [
    JOB_STATUS.REQUESTED,
    JOB_STATUS.PENDING_WORKER_RESPONSE
  ].includes(j.status));

  const upcomingJobs = workerJobs.filter((j) => [
    JOB_STATUS.ACCEPTED,
    JOB_STATUS.CUSTOMER_AND_WORKER_CONNECTED,
    JOB_STATUS.IN_PROGRESS
  ].includes(j.status));

  const completedJobs = workerJobs.filter((j) => j.status === JOB_STATUS.COMPLETED);

  const totalEarnings = completedJobs.length * (worker?.daily_rate || 500);

  return (
    <div className="dashboard-layout">
      {/* WORKER SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          paddingBottom: '16px',
          marginBottom: '16px',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700
          }}>
            {user?.name?.charAt(0) || 'W'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {worker?.profession || 'Skilled Worker'}
            </div>
          </div>
        </div>

        <nav>
          <button
            className={`sidebar-nav-item ${currentTab === 'overview' ? 'active' : ''}`}
            onClick={() => setCurrentTab('overview')}
          >
            <Calendar size={18} />
            <span>Dashboard</span>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'requests' ? 'active' : ''}`}
            onClick={() => setCurrentTab('requests')}
          >
            <Clock size={18} />
            <span>Job Requests</span>
            {pendingRequests.length > 0 && (
              <span className="tag" style={{ marginLeft: 'auto', backgroundColor: 'var(--primary)', color: '#FFFFFF', borderColor: 'var(--primary)' }}>
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'my_jobs' ? 'active' : ''}`}
            onClick={() => setCurrentTab('my_jobs')}
          >
            <Briefcase size={18} />
            <span>My Jobs</span>
            {upcomingJobs.length > 0 && (
              <span className="tag" style={{ marginLeft: 'auto' }}>
                {upcomingJobs.length}
              </span>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'availability' ? 'active' : ''}`}
            onClick={() => setCurrentTab('availability')}
          >
            <Calendar size={18} />
            <span>Availability</span>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'profile' ? 'active' : ''}`}
            onClick={() => setCurrentTab('profile')}
          >
            <User size={18} />
            <span>Profile & Rates</span>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'ratings' ? 'active' : ''}`}
            onClick={() => setCurrentTab('ratings')}
          >
            <Star size={18} />
            <span>Ratings & Reviews</span>
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main>
        {/* VIEW 1: OVERVIEW */}
        {currentTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '4px' }}>
                Worker Dashboard
              </h1>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
                Review incoming requests, upcoming visits, and track earnings.
              </p>
            </div>

            {/* Quick Metrics Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px'
            }}>
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Pending Requests
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: pendingRequests.length > 0 ? 'var(--warning)' : 'var(--text-main)', marginTop: '4px' }}>
                  {pendingRequests.length}
                </div>
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Active Scheduled Jobs
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                  {upcomingJobs.length}
                </div>
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Estimated Earnings
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                  ₹{totalEarnings}
                </div>
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Rating / Dependability
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                  <Star size={20} style={{ fill: '#F59E0B', color: '#F59E0B' }} />
                  <span style={{ fontSize: '22px', fontWeight: 800 }}>
                    {worker?.rating ? Number(worker.rating).toFixed(1) : '5.0'}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    ({worker?.reliability || 100}%)
                  </span>
                </div>
              </div>
            </div>

            {/* PRIORITIZE: PENDING REQUESTS */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
                  Incoming Job Requests ({pendingRequests.length})
                </h2>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No pending requests waiting for response.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingRequests.map((job) => (
                    <div
                      key={job.job_id}
                      className="card"
                      style={{ padding: '20px', borderLeft: '4px solid var(--warning)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 700 }}>
                            {job.service_type}
                          </div>
                          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Customer: <strong>{job.customer_name}</strong> • Phone: {job.customer_phone || 'Provided upon accept'}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                            ₹{job.estimated_cost}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Day rate</div>
                        </div>
                      </div>

                      <div style={{
                        backgroundColor: 'var(--surface-alt)',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        marginBottom: '14px'
                      }}>
                        <div><strong>Location:</strong> {job.address}</div>
                        <div><strong>Scheduled Date:</strong> {job.required_date} ({PREFERRED_TIME_LABELS[job.preferred_time] || 'Flexible'})</div>
                        {job.description && (
                          <div style={{ marginTop: '4px' }}><strong>Problem:</strong> {job.description}</div>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleJobAction(job.job_id, JOB_STATUS.REJECTED)}
                        >
                          Decline Request
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleJobAction(job.job_id, JOB_STATUS.CUSTOMER_AND_WORKER_CONNECTED)}
                        >
                          Accept Job
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* UPCOMING JOBS */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
                  Upcoming Scheduled Work ({upcomingJobs.length})
                </h2>
              </div>

              {upcomingJobs.length === 0 ? (
                <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No scheduled jobs at the moment.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {upcomingJobs.map((job) => (
                    <div key={job.job_id} className="card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 700 }}>{job.service_type}</span>
                            <span className={`status-pill status-${job.status}`}>
                              {job.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Customer: {job.customer_name} • {job.customer_phone}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '16px', fontWeight: 800 }}>₹{job.estimated_cost}</span>
                        </div>
                      </div>

                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                        <div><strong>Address:</strong> {job.address}</div>
                        <div><strong>Date:</strong> {job.required_date}</div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {job.status === JOB_STATUS.CUSTOMER_AND_WORKER_CONNECTED && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleJobAction(job.job_id, JOB_STATUS.IN_PROGRESS)}
                          >
                            Start Work
                          </button>
                        )}
                        {job.status === JOB_STATUS.IN_PROGRESS && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleJobAction(job.job_id, JOB_STATUS.COMPLETED)}
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: JOB REQUESTS ONLY */}
        {currentTab === 'requests' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>
              Pending Job Requests ({pendingRequests.length})
            </h1>
            {pendingRequests.length === 0 ? (
              <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No pending job requests.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {pendingRequests.map((job) => (
                  <div key={job.job_id} className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{job.service_type}</h3>
                      <span style={{ fontSize: '16px', fontWeight: 800 }}>₹{job.estimated_cost}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      <div><strong>Customer:</strong> {job.customer_name} ({job.customer_phone})</div>
                      <div><strong>Address:</strong> {job.address}</div>
                      <div><strong>Date:</strong> {job.required_date}</div>
                      <div><strong>Description:</strong> {job.description}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleJobAction(job.job_id, JOB_STATUS.REJECTED)}
                      >
                        Decline
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleJobAction(job.job_id, JOB_STATUS.CUSTOMER_AND_WORKER_CONNECTED)}
                      >
                        Accept Job
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: MY JOBS */}
        {currentTab === 'my_jobs' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>
              All Jobs ({workerJobs.length})
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {workerJobs.map((job) => (
                <div key={job.job_id} className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '15px' }}>{job.service_type}</span>
                        <span className={`status-pill status-${job.status}`}>
                          {job.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Customer: {job.customer_name} • Date: {job.required_date}
                      </div>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '16px' }}>₹{job.estimated_cost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: AVAILABILITY & WORKING DAYS */}
        {currentTab === 'availability' && (
          <div className="card" style={{ padding: '24px', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Working Days & Availability
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Select the days you are available to receive customer booking requests.
            </p>

            <form onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label className="form-label">Available Days of the Week</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                    const isSelected = workingDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-strong)'}`,
                          backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                          color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label className="form-label">Current Work Status</label>
                <select
                  className="form-select"
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                >
                  <option value="available">Available for Bookings</option>
                  <option value="busy">Temporarily Busy</option>
                  <option value="offline">Offline / Vacation</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: '16px' }}
                disabled={savingSettings}
              >
                {savingSettings ? 'Saving...' : 'Save Availability'}
              </button>
            </form>
          </div>
        )}

        {/* VIEW 5: PROFILE & RATES */}
        {currentTab === 'profile' && (
          <div className="card" style={{ padding: '24px', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Worker Profile & Rates
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Update your daily rate and communication preferences.
            </p>

            <form onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label className="form-label">Primary Trade</label>
                <input className="form-input" value={profession} onChange={(e) => setProfession(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Daily Rate (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  min={200}
                  max={5000}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Skills (Comma separated)</label>
                <input
                  className="form-input"
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Communication Mode</label>
                <select
                  className="form-select"
                  value={commType}
                  onChange={(e) => setCommType(e.target.value)}
                >
                  <option value="smartphone">Smartphone App Worker</option>
                  <option value="non_smartphone">Basic Phone (AI CallBot Voice Calls)</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: '16px' }}
                disabled={savingSettings}
              >
                {savingSettings ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        )}

        {/* VIEW 6: RATINGS */}
        {currentTab === 'ratings' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>
              Customer Ratings & Reviews ({ratings.length})
            </h1>
            {ratings.length === 0 ? (
              <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No reviews recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {ratings.map((r) => (
                  <div key={r.rating_id} className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{r.customer_name}</span>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            style={{
                              fill: i < r.rating ? '#F59E0B' : '#E5E7EB',
                              color: i < r.rating ? '#F59E0B' : '#E5E7EB'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                      "{r.review}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
