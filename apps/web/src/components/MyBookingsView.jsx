import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { JOB_STATUS, PREFERRED_TIME_LABELS } from '../../../../packages/shared/statusVocabulary.js';
import {
  Calendar,
  Clock,
  Phone,
  PhoneCall,
  MapPin,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wrench,
  Zap,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  X,
  User,
  Check,
  MessageSquare
} from 'lucide-react';

// Demo initial bookings matching the user screenshot perfectly
const INITIAL_DEMO_BOOKINGS = [
  {
    job_id: 'bk_1',
    worker_id: 'wrk_elec_1',
    worker_name: 'Mukesh Sharma',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    profession: 'Electrician',
    service_type: 'House Wiring',
    status: 'CONFIRMED',
    displayStatus: 'Confirmed',
    statusColor: 'confirmed',
    dateLabel: 'Tomorrow, Sep 29',
    required_date: '2026-09-29',
    preferred_time: 'morning_9_12',
    address: 'Plot 42, Near Hanuman Temple, Govindpura, Bihar',
    estimated_cost: 550,
    phone: '+91 98765 43210',
    communication_type: 'non_smartphone',
    description: 'Main distribution board wiring and switchboard replacement'
  },
  {
    job_id: 'bk_2',
    worker_id: 'wrk_elec_2',
    worker_name: 'Sunil Verma',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
    profession: 'Electrician',
    service_type: 'Fan Installation',
    status: 'PENDING',
    displayStatus: 'Pending',
    statusColor: 'pending',
    dateLabel: 'Wed, Sep 30',
    required_date: '2026-09-30',
    preferred_time: 'afternoon_12_4',
    address: 'Flat 304, Green Heights, Govindpura, Bihar',
    estimated_cost: 450,
    phone: '+91 98765 43211',
    communication_type: 'smartphone',
    description: 'Install 2 ceiling fans and speed regulator switch'
  },
  {
    job_id: 'bk_3',
    worker_id: 'wrk_elec_5',
    worker_name: 'Rakesh Singh',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&auto=format&fit=crop&q=80',
    profession: 'Electrician',
    service_type: 'MCB Installation',
    status: 'CONFIRMED',
    displayStatus: 'Confirmed',
    statusColor: 'confirmed',
    dateLabel: 'Fri, Oct 3',
    required_date: '2026-10-03',
    preferred_time: 'morning_9_12',
    address: 'House 12, Sector 4, Govindpura, Bihar',
    estimated_cost: 480,
    phone: '+91 98765 43214',
    communication_type: 'non_smartphone',
    description: 'Single phase MCB tripping issue and circuit breaker inspection'
  },
  {
    job_id: 'bk_4',
    worker_id: 'wrk_elec_6',
    worker_name: 'Vijay Prasad',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&auto=format&fit=crop&q=80',
    profession: 'Electrician',
    service_type: 'Lighting',
    status: 'COMPLETED',
    displayStatus: 'Completed',
    statusColor: 'completed',
    dateLabel: 'Completed on Sep 28',
    required_date: '2026-09-28',
    preferred_time: 'evening_4_7',
    address: 'Shop 8, Main Market, Govindpura, Bihar',
    estimated_cost: 650,
    phone: '+91 98765 43215',
    communication_type: 'smartphone',
    description: 'LED panel lights installation and concealed conduit wiring',
    has_rated: false
  }
];

export default function MyBookingsView({
  onFindWorker,
  onOpenCallbotForJob
}) {
  const { user, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'completed' | 'cancelled'
  const [bookings, setBookings] = useState(INITIAL_DEMO_BOOKINGS);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);
  const [ratingBooking, setRatingBooking] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingText, setRatingText] = useState('');
  const [contactBooking, setContactBooking] = useState(null);

  // Fetch real jobs from backend and merge with initial demo items
  const loadBookings = async () => {
    try {
      const res = await api.getMyJobs();
      if (res.success && res.data && res.data.length > 0) {
        // Map backend jobs into screenshot visual format
        const backendJobs = res.data.map((job) => {
          const isCompleted = job.status === JOB_STATUS.COMPLETED;
          const isCancelled = job.status === JOB_STATUS.CANCELLED || job.status === JOB_STATUS.REJECTED;
          const isPending = job.status === JOB_STATUS.REQUESTED || job.status === JOB_STATUS.PENDING_WORKER_RESPONSE;
          
          let displayStatus = 'Confirmed';
          let statusColor = 'confirmed';
          if (isCompleted) {
            displayStatus = 'Completed';
            statusColor = 'completed';
          } else if (isCancelled) {
            displayStatus = 'Cancelled';
            statusColor = 'cancelled';
          } else if (isPending) {
            displayStatus = 'Pending';
            statusColor = 'pending';
          }

          let dateLabel = job.required_date || 'Upcoming';
          if (job.required_date) {
            const dateObj = new Date(job.required_date);
            if (!isNaN(dateObj)) {
              dateLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            }
          }
          if (isCompleted) {
            dateLabel = `Completed on ${dateLabel}`;
          }

          return {
            ...job,
            displayStatus,
            statusColor,
            dateLabel,
            avatar: job.worker_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
            profession: job.profession || 'Electrician'
          };
        });

        // Merge: keep mock items that aren't already represented
        const existingIds = new Set(backendJobs.map((b) => b.job_id));
        const keptDemos = INITIAL_DEMO_BOOKINGS.filter((d) => !existingIds.has(d.job_id));
        setBookings([...backendJobs, ...keptDemos]);
      }
    } catch (err) {
      console.warn('Could not fetch backend jobs, falling back to demo bookings:', err);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user]);

  // Tab categorization
  const filteredBookings = bookings.filter((b) => {
    const isCompleted = b.status === 'COMPLETED' || b.status === JOB_STATUS.COMPLETED;
    const isCancelled = b.status === 'CANCELLED' || b.status === 'REJECTED' || b.status === JOB_STATUS.CANCELLED || b.status === JOB_STATUS.REJECTED;
    const isUpcoming = !isCompleted && !isCancelled;

    if (activeTab === 'upcoming') return isUpcoming;
    if (activeTab === 'completed') return isCompleted;
    if (activeTab === 'cancelled') return isCancelled;
    return true;
  });

  const handleCancelBooking = async (booking) => {
    if (!window.confirm(`Are you sure you want to cancel your booking with ${booking.worker_name}?`)) return;

    try {
      if (booking.job_id.startsWith('bk_')) {
        // Update local state for mock
        setBookings((prev) =>
          prev.map((b) =>
            b.job_id === booking.job_id
              ? { ...b, status: 'CANCELLED', displayStatus: 'Cancelled', statusColor: 'cancelled' }
              : b
          )
        );
      } else {
        await api.updateJobStatus(booking.job_id, JOB_STATUS.CANCELLED);
        loadBookings();
      }
      showToast('Booking cancelled successfully', 'info');
      if (selectedBookingDetails?.job_id === booking.job_id) {
        setSelectedBookingDetails(null);
      }
    } catch (err) {
      showToast(err.message || 'Failed to cancel booking', 'danger');
    }
  };

  const handleRateSubmit = async (e) => {
    e.preventDefault();
    if (!ratingBooking) return;

    try {
      if (!ratingBooking.job_id.startsWith('bk_')) {
        await api.submitRating({
          job_id: ratingBooking.job_id,
          rating: ratingScore,
          review: ratingText
        });
      }
      setBookings((prev) =>
        prev.map((b) =>
          b.job_id === ratingBooking.job_id
            ? { ...b, has_rated: true, rating: ratingScore }
            : b
        )
      );
      showToast(`Thank you! Rated ${ratingBooking.worker_name} ${ratingScore} stars.`, 'success');
      setRatingBooking(null);
      setRatingText('');
    } catch (err) {
      showToast(err.message || 'Failed to submit rating', 'danger');
    }
  };

  return (
    <div className="hl-my-bookings-page">
      <div className="container" style={{ maxWidth: '980px', margin: '0 auto', padding: '32px 16px 80px' }}>
        {/* Page Title */}
        <h1 className="hl-bookings-title">My Bookings</h1>

        {/* Status Tabs: Upcoming (Active), Completed, Cancelled */}
        <div className="hl-bookings-tabs-bar">
          <button
            type="button"
            className={`hl-booking-tab ${activeTab === 'upcoming' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            <span>Upcoming</span>
          </button>

          <button
            type="button"
            className={`hl-booking-tab ${activeTab === 'completed' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            <span>Completed</span>
          </button>

          <button
            type="button"
            className={`hl-booking-tab ${activeTab === 'cancelled' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            <span>Cancelled</span>
          </button>
        </div>

        {/* Bookings List */}
        <div className="hl-bookings-list">
          {filteredBookings.length === 0 ? (
            <div className="hl-bookings-empty-card">
              <div className="hl-empty-icon-wrap">
                <Calendar size={32} style={{ color: '#9CA3AF' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1F2937', marginBottom: '8px' }}>
                No {activeTab} bookings
              </h3>
              <p style={{ fontSize: '14px', color: '#6B7280', maxWidth: '360px', margin: '0 auto 20px' }}>
                {activeTab === 'upcoming'
                  ? 'You do not have any active appointments scheduled right now.'
                  : `You have no ${activeTab} service bookings in your history.`}
              </p>
              {onFindWorker && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onFindWorker}
                  style={{ backgroundColor: '#EA580C', borderColor: '#EA580C' }}
                >
                  Find a Worker
                </button>
              )}
            </div>
          ) : (
            filteredBookings.map((booking) => {
              const isConfirmed = booking.statusColor === 'confirmed';
              const isPending = booking.statusColor === 'pending';
              const isCompleted = booking.statusColor === 'completed';
              const isCancelled = booking.statusColor === 'cancelled';

              return (
                <div key={booking.job_id} className="hl-booking-card">
                  {/* LEFT: Avatar + Worker Details */}
                  <div className="hl-booking-left">
                    <img
                      src={booking.avatar}
                      alt={booking.worker_name}
                      className="hl-booking-avatar"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80';
                      }}
                    />

                    <div className="hl-booking-info">
                      <h3 className="hl-booking-name">{booking.worker_name}</h3>
                      <div className="hl-booking-prof">{booking.profession || 'Electrician'}</div>

                      {/* Service / Task row */}
                      <div className="hl-booking-service-row">
                        <Wrench size={13} className="hl-booking-service-icon" />
                        <span>{booking.service_type || 'General Service'}</span>
                      </div>

                      {/* Date / Time row */}
                      <div className="hl-booking-date-row">
                        <Clock size={13} className="hl-booking-date-icon" />
                        <span>{booking.dateLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Price + Status Badge + Action Buttons */}
                  <div className="hl-booking-right">
                    {/* Price Display */}
                    <div style={{ textAlign: 'right', marginRight: '8px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
                        ₹{booking.estimated_cost || 550}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        per day
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`hl-status-pill ${booking.statusColor}`}>
                      {booking.displayStatus}
                    </div>

                    {/* Action Buttons */}
                    <div className="hl-booking-actions">
                      <button
                        type="button"
                        className="hl-btn-view-details"
                        onClick={() => setSelectedBookingDetails(booking)}
                      >
                        View Details
                      </button>

                      {/* Contact Worker */}
                      {(isConfirmed || (!isCompleted && !isCancelled && !isPending)) && (
                        <button
                          type="button"
                          className="hl-btn-contact-worker"
                          onClick={() => setContactBooking(booking)}
                        >
                          Contact Worker
                        </button>
                      )}

                      {/* Cancel action */}
                      {!isCompleted && !isCancelled && (
                        <button
                          type="button"
                          className="hl-btn-cancel-req"
                          onClick={() => handleCancelBooking(booking)}
                        >
                          Cancel
                        </button>
                      )}

                      {isCompleted && (
                        <button
                          type="button"
                          className="hl-btn-rate-worker"
                          onClick={() => setRatingBooking(booking)}
                        >
                          <Star size={13} style={{ color: '#F59E0B' }} />
                          <span>{booking.has_rated ? 'Rated' : 'Rate Worker'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* =========================================================
          MODAL 1: VIEW DETAILS MODAL
          ========================================================= */}
      {selectedBookingDetails && (
        <div className="hl-modal-backdrop" onClick={() => setSelectedBookingDetails(null)}>
          <div className="hl-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="hl-modal-header">
              <div>
                <h2 style={{ fontSize: '19px', fontWeight: 800, margin: 0, color: '#111827' }}>
                  Booking Details
                </h2>
                <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                  ID: #{selectedBookingDetails.job_id}
                </div>
              </div>
              <button
                type="button"
                className="hl-modal-close-btn"
                onClick={() => setSelectedBookingDetails(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="hl-modal-body">
              {/* Worker Profile Strip */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px',
                backgroundColor: '#F9FAFB',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                marginBottom: '16px'
              }}>
                <img
                  src={selectedBookingDetails.avatar}
                  alt={selectedBookingDetails.worker_name}
                  style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>
                    {selectedBookingDetails.worker_name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280' }}>
                    {selectedBookingDetails.profession} • Government Verified
                  </div>
                </div>
                <div className={`hl-status-pill ${selectedBookingDetails.statusColor}`}>
                  {selectedBookingDetails.displayStatus}
                </div>
              </div>

              {/* Service & Schedule Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div className="hl-modal-info-box">
                  <div className="hl-modal-info-label">Service Required</div>
                  <div className="hl-modal-info-val">{selectedBookingDetails.service_type}</div>
                </div>
                <div className="hl-modal-info-box">
                  <div className="hl-modal-info-label">Schedule Slot</div>
                  <div className="hl-modal-info-val">
                    {selectedBookingDetails.dateLabel}
                  </div>
                </div>
                <div className="hl-modal-info-box">
                  <div className="hl-modal-info-label">Estimated Rate</div>
                  <div className="hl-modal-info-val" style={{ color: '#EA580C', fontWeight: 800 }}>
                    ₹{selectedBookingDetails.estimated_cost} / day
                  </div>
                </div>
                <div className="hl-modal-info-box">
                  <div className="hl-modal-info-label">Booking Channel</div>
                  <div className="hl-modal-info-val">
                    {selectedBookingDetails.communication_type === 'non_smartphone' ? '📞 Phone / CallBot' : '📱 App Booking'}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="hl-modal-info-box" style={{ marginBottom: '14px' }}>
                <div className="hl-modal-info-label">Service Address</div>
                <div className="hl-modal-info-val" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} style={{ color: '#EA580C', flexShrink: 0 }} />
                  <span>{selectedBookingDetails.address}</span>
                </div>
              </div>

              {/* Description */}
              {selectedBookingDetails.description && (
                <div className="hl-modal-info-box" style={{ marginBottom: '16px' }}>
                  <div className="hl-modal-info-label">Work Notes</div>
                  <div className="hl-modal-info-val">{selectedBookingDetails.description}</div>
                </div>
              )}
            </div>

            <div className="hl-modal-footer">
              {selectedBookingDetails.statusColor !== 'cancelled' && selectedBookingDetails.statusColor !== 'completed' && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#DC2626', borderColor: '#FECACA' }}
                  onClick={() => handleCancelBooking(selectedBookingDetails)}
                >
                  Cancel Booking
                </button>
              )}

              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: '#EA580C', borderColor: '#EA580C' }}
                onClick={() => {
                  setContactBooking(selectedBookingDetails);
                  setSelectedBookingDetails(null);
                }}
              >
                <Phone size={13} />
                <span>Contact Worker</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: CONTACT / CALLBOT MODAL
          ========================================================= */}
      {contactBooking && (
        <div className="hl-modal-backdrop" onClick={() => setContactBooking(null)}>
          <div className="hl-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="hl-modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#111827' }}>
                Contact {contactBooking.worker_name}
              </h2>
              <button
                type="button"
                className="hl-modal-close-btn"
                onClick={() => setContactBooking(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="hl-modal-body" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#FFF7ED',
                color: '#EA580C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '1.5px solid #FFEDD5'
              }}>
                <PhoneCall size={28} />
              </div>

              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>
                Voice Confirmation & Direct Call
              </h3>
              <p style={{ fontSize: '13.5px', color: '#6B7280', margin: '0 auto 20px', lineHeight: 1.5 }}>
                {contactBooking.worker_name} operates via{' '}
                <strong>
                  {contactBooking.communication_type === 'non_smartphone'
                    ? 'HireLocal Hindi AI Voice CallBot'
                    : 'Direct Voice Connection'}
                </strong>.
              </p>

              <div style={{
                backgroundColor: '#F9FAFB',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid #E5E7EB',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>Worker Direct Phone</div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#111827', letterSpacing: '0.02em' }}>
                  {contactBooking.phone || '+91 98765 43210'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a
                  href={`tel:${contactBooking.phone || '+919876543210'}`}
                  className="btn btn-primary"
                  style={{
                    backgroundColor: '#EA580C',
                    borderColor: '#EA580C',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px'
                  }}
                >
                  <Phone size={16} />
                  <span>Call Now (+91)</span>
                </a>

                {onOpenCallbotForJob && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      onOpenCallbotForJob(contactBooking);
                      setContactBooking(null);
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <MessageSquare size={16} />
                    <span>Open AI CallBot Assistant</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: RATE WORKER MODAL
          ========================================================= */}
      {ratingBooking && (
        <div className="hl-modal-backdrop" onClick={() => setRatingBooking(null)}>
          <div className="hl-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="hl-modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#111827' }}>
                Rate & Review
              </h2>
              <button
                type="button"
                className="hl-modal-close-btn"
                onClick={() => setRatingBooking(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRateSubmit}>
              <div className="hl-modal-body" style={{ textAlign: 'center', padding: '20px 16px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                  How was your experience with {ratingBooking.worker_name}?
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
                  {ratingBooking.service_type} • Completed Service
                </div>

                {/* Star Rating Selector */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingScore(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        transform: ratingScore >= star ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <Star
                        size={32}
                        fill={ratingScore >= star ? '#F59E0B' : '#E5E7EB'}
                        color={ratingScore >= star ? '#F59E0B' : '#D1D5DB'}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Share a few words about punctuality, work quality, and pricing (optional)..."
                  value={ratingText}
                  onChange={(e) => setRatingText(e.target.value)}
                  style={{ width: '100%', resize: 'none', fontSize: '13px' }}
                />
              </div>

              <div className="hl-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setRatingBooking(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ backgroundColor: '#EA580C', borderColor: '#EA580C' }}
                >
                  Submit Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
