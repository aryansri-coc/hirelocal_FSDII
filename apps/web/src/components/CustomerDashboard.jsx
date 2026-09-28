import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import MyBookingsView from './MyBookingsView';
import { JOB_STATUS, PREFERRED_TIME_LABELS } from '../../../../packages/shared/statusVocabulary.js';
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  CheckCircle,
  AlertCircle,
  Search,
  PhoneCall,
  User,
  Bell,
  Briefcase,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';

export default function CustomerDashboard({
  onSelectService,
  onBookDirect,
  onOpenCallbotForJob,
  initialSubTab = 'overview',
  onBecomeWorker
}) {
  const { user, showToast } = useAuth();
  const [subTab, setSubTab] = useState(initialSubTab); // 'overview' | 'find_workers' | 'bookings' | 'notifications' | 'profile'
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Rating modal state
  const [activeRatingJob, setActiveRatingJob] = useState(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Alternative workers drawer
  const [selectedJobAlternatives, setSelectedJobAlternatives] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.getMyJobs();
      if (res.success) {
        setJobs(res.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load bookings.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      const res = await api.updateJobStatus(jobId, newStatus);
      if (res.success) {
        showToast(`Job status updated to ${newStatus.replace(/_/g, ' ')}`, 'success');
        fetchJobs();
      }
    } catch (err) {
      showToast(err.message || 'Status update failed', 'danger');
    }
  };

  const handleShowAlternatives = async (job) => {
    try {
      const res = await api.getAlternatives({
        current_worker_id: job.worker_id,
        service: job.service_type,
        date: job.required_date
      });
      if (res.success) {
        setSelectedJobAlternatives({
          job,
          alternatives: res.data
        });
      }
    } catch (err) {
      showToast('Could not fetch alternative workers', 'danger');
    }
  };

  const handleReassignWorker = async (jobId, altWorker) => {
    try {
      const res = await api.updateJobStatus(jobId, JOB_STATUS.PENDING_WORKER_RESPONSE, {
        alternative_worker_id: altWorker.worker_id
      });
      if (res.success) {
        showToast(`Job reassigned to ${altWorker.name}! Notification sent.`, 'success');
        setSelectedJobAlternatives(null);
        fetchJobs();
      }
    } catch (err) {
      showToast(err.message || 'Failed to reassign job', 'danger');
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (!activeRatingJob) return;

    setSubmittingRating(true);
    try {
      const res = await api.submitRating({
        job_id: activeRatingJob.job_id,
        rating: ratingVal,
        review: reviewText
      });
      if (res.success) {
        showToast('Review and rating submitted successfully!', 'success');
        setActiveRatingJob(null);
        setReviewText('');
        fetchJobs();
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit review.', 'danger');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Upcoming active booking
  const upcomingJob = jobs.find((j) => [
    JOB_STATUS.REQUESTED,
    JOB_STATUS.PENDING_WORKER_RESPONSE,
    JOB_STATUS.ACCEPTED,
    JOB_STATUS.CUSTOMER_AND_WORKER_CONNECTED,
    JOB_STATUS.IN_PROGRESS
  ].includes(j.status));

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR NAVIGATION */}
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
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700
          }}>
            {user?.name?.charAt(0) || 'C'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Customer Account</div>
          </div>
        </div>

        <nav>
          <button
            className={`sidebar-nav-item ${subTab === 'overview' ? 'active' : ''}`}
            onClick={() => setSubTab('overview')}
          >
            <Calendar size={18} />
            <span>Dashboard</span>
          </button>

          <button
            className={`sidebar-nav-item ${subTab === 'find_workers' ? 'active' : ''}`}
            onClick={() => {
              if (onSelectService) onSelectService('');
            }}
          >
            <Search size={18} />
            <span>Find Workers</span>
          </button>

          <button
            className={`sidebar-nav-item ${subTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setSubTab('bookings')}
          >
            <Clock size={18} />
            <span>My Bookings</span>
            {jobs.length > 0 && (
              <span className="tag" style={{ marginLeft: 'auto', fontSize: '11px', padding: '1px 6px' }}>
                {jobs.length}
              </span>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${subTab === 'profile' ? 'active' : ''}`}
            onClick={() => setSubTab('profile')}
          >
            <User size={18} />
            <span>Profile</span>
          </button>
        </nav>

        {/* Bottom Sidebar Action: Become a Worker */}
        <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Are you a skilled professional?
          </div>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={onBecomeWorker}
          >
            Become a Worker
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main>
        {/* VIEW 1: OVERVIEW */}
        {subTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header Greeting */}
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>
                {greeting}, {user?.name?.split(' ')[0]}
              </h1>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
                Manage your scheduled bookings, find trusted local trades, and track requests.
              </p>
            </div>

            {/* Quick Service Search Card */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Quick Search
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search for an Electrician, Plumber, AC Repair, Painter..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery && onSelectService) {
                        onSelectService(searchQuery);
                      }
                    }}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (onSelectService) onSelectService(searchQuery);
                  }}
                >
                  <Search size={16} />
                  <span>Search</span>
                </button>
              </div>

              {/* Service Badges */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                {['Electrician', 'Plumber', 'AC Repair & Service', 'Carpenter', 'Painter'].map((srv) => (
                  <button
                    key={srv}
                    onClick={() => {
                      if (onSelectService) onSelectService(srv);
                    }}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 10px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {srv}
                  </button>
                ))}
              </div>
            </div>

            {/* Upcoming Booking Card */}
            {upcomingJob ? (
              <div className="card" style={{ padding: '24px', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)' }}>
                    Upcoming Booking
                  </div>
                  <span className={`status-pill status-${upcomingJob.status}`}>
                    {upcomingJob.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                      {upcomingJob.service_type}
                    </h3>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      Worker: <strong>{upcomingJob.worker_name || 'Assigned Technician'}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} /> {upcomingJob.required_date}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} /> {PREFERRED_TIME_LABELS[upcomingJob.preferred_time] || 'Flexible'}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                      ₹{upcomingJob.estimated_cost}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Day-based fee</div>

                    {/* Simulation Outbound Call Button if CallBot worker */}
                    {onOpenCallbotForJob && (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: '10px' }}
                        onClick={() => onOpenCallbotForJob(upcomingJob)}
                      >
                        <PhoneCall size={13} style={{ color: 'var(--primary)' }} />
                        <span>Simulate CallBot Call</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>No upcoming bookings</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Need an electrician, plumber, or carpenter? Book verified professionals nearby.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => onSelectService && onSelectService('')}>
                  Find a Worker
                </button>
              </div>
            )}

            {/* Recent Bookings List */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Recent Bookings</h3>
                <button
                  onClick={() => setSubTab('bookings')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  View All ({jobs.length})
                </button>
              </div>

              {loading ? (
                <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading bookings...
                </div>
              ) : jobs.length === 0 ? (
                <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No bookings yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {jobs.slice(0, 3).map((job) => (
                    <div
                      key={job.job_id}
                      className="card"
                      style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '15px' }}>{job.service_type}</span>
                          <span className={`status-pill status-${job.status}`}>
                            {job.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Worker: {job.worker_name} • Date: {job.required_date}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 700, fontSize: '15px' }}>₹{job.estimated_cost}</span>
                        {job.status === JOB_STATUS.COMPLETED && !job.has_rated && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setActiveRatingJob(job);
                              setRatingVal(5);
                            }}
                          >
                            <Star size={13} style={{ color: '#F59E0B' }} />
                            <span>Rate Worker</span>
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

        {/* VIEW 2: ALL BOOKINGS */}
        {subTab === 'bookings' && (
          <MyBookingsView
            onFindWorker={() => onSelectService && onSelectService('')}
            onOpenCallbotForJob={onOpenCallbotForJob}
          />
        )}

        {/* VIEW 3: PROFILE */}
        {subTab === 'profile' && (
          <div className="card" style={{ padding: '24px', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Customer Profile</h2>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={user?.name || ''} readOnly />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" value={user?.phone || ''} readOnly />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <input className="form-input" value="Customer" readOnly />
            </div>
            <div className="form-group">
              <label className="form-label">Primary Address</label>
              <input className="form-input" value={user?.address || 'Arera Colony, Bhopal'} readOnly />
            </div>
          </div>
        )}
      </main>

      {/* RATING SUBMISSION MODAL */}
      {activeRatingJob && (
        <div className="modal-overlay" onClick={() => setActiveRatingJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Rate Workmanship</h3>
              <button
                onClick={() => setActiveRatingJob(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitRating} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  How satisfied were you with <strong>{activeRatingJob.worker_name}</strong>?
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRatingVal(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <Star
                        size={28}
                        style={{
                          fill: star <= ratingVal ? '#F59E0B' : 'none',
                          color: star <= ratingVal ? '#F59E0B' : '#D1D5DB'
                        }}
                      />
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                  {ratingVal} of 5 Stars
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Review Comments</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Describe punctuality, quality of work, clean finish, and polite behavior..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveRatingJob(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingRating}>
                  {submittingRating ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALTERNATIVE WORKERS MODAL */}
      {selectedJobAlternatives && (
        <div className="modal-overlay" onClick={() => setSelectedJobAlternatives(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Alternative Workers Nearby</h3>
              <button
                onClick={() => setSelectedJobAlternatives(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                The original worker was unavailable. Select another verified {selectedJobAlternatives.job.service_type} for {selectedJobAlternatives.job.required_date}:
              </p>

              {selectedJobAlternatives.alternatives.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                  No alternative workers currently available on this day.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedJobAlternatives.alternatives.map((alt) => (
                    <div
                      key={alt.worker_id}
                      className="card"
                      style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{alt.name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          ★ {alt.rating?.toFixed(1) || '5.0'} • ₹{alt.daily_rate}/day
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleReassignWorker(selectedJobAlternatives.job.job_id, alt)}
                      >
                        Reassign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
