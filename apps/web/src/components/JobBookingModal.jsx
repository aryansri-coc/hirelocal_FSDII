import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  Phone,
  Smartphone,
  X,
  PhoneCall,
  ArrowRight
} from 'lucide-react';

export default function JobBookingModal({ worker, defaultService, onClose, onJobCreated }) {
  const { user, showToast } = useAuth();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const isCallbot = worker?.communication_type === 'non_smartphone';
  const firstName = worker?.name ? worker.name.split(' ')[0] : 'Worker';
  const dailyRate = Number(worker?.daily_rate) || 550;

  const [serviceType, setServiceType] = useState(
    worker?.skills?.[0] || defaultService || worker?.profession || 'House Wiring'
  );
  const [requiredDate, setRequiredDate] = useState(tomorrowStr);
  const [duration, setDuration] = useState('1 Day');
  const [address, setAddress] = useState(
    user?.address || 'Flat 402, Shalimar Heights, MP Nagar Zone 2, Bhopal'
  );
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Real or high-resolution worker avatar
  const avatarUrl = worker?.avatar || (
    worker?.name?.includes('Mukesh')
      ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80'
      : worker?.name?.includes('Sunil')
      ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80'
      : worker?.name?.includes('Rohit')
      ? 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=160&auto=format&fit=crop&q=80'
      : worker?.name?.includes('Amit')
      ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&auto=format&fit=crop&q=80'
      : worker?.name?.includes('Rakesh')
      ? 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&auto=format&fit=crop&q=80'
      : worker?.name?.includes('Vijay')
      ? 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&auto=format&fit=crop&q=80'
  );

  const handleConfirm = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        worker_id: worker?.worker_id || null,
        service_type: serviceType,
        address,
        required_date: requiredDate,
        preferred_time: 'flexible',
        description: `${serviceType} service requested (${duration})`,
        estimated_cost: dailyRate
      };

      const res = await api.createJob(payload);
      if (res.success) {
        setConfirmed(true);
        if (showToast) {
          showToast(
            isCallbot
              ? `Booking confirmed! CallBot is dialing ${worker.name}.`
              : `Booking confirmed! Request sent to ${worker?.name || 'worker'}.`,
            'success'
          );
        }
        if (onJobCreated && res.data?.job) {
          // Delay closing so user sees confirmation state
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit booking request.');
      setSubmitting(false);
    }
  };

  const handleFinish = () => {
    if (onJobCreated) onJobCreated();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1250 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '100%',
          borderRadius: '20px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 48px -12px rgba(21, 26, 36, 0.18)'
        }}
      >
        {/* Top Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF'
        }}>
          <div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              {confirmed
                ? 'Booking Confirmed'
                : isCallbot
                ? 'Confirm via phone call'
                : 'Confirm Booking'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
              {confirmed
                ? 'Your service is scheduled'
                : isCallbot
                ? `We'll call ${firstName} to confirm the booking.`
                : `Instant confirmation with ${firstName}.`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {errorMsg && (
            <div style={{
              backgroundColor: 'var(--error-light)',
              color: '#991B1B',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '16px',
              border: '1px solid #FECACA'
            }}>
              {errorMsg}
            </div>
          )}

          {confirmed ? (
            /* ==================================================
               SECTION 18: POST-CONFIRMATION SUCCESS STATE
               ================================================== */
            <div style={{ textAlign: 'center', padding: '16px 8px 8px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--success-light)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '2px solid #BBF7D0'
              }}>
                <CheckCircle size={36} strokeWidth={2.5} />
              </div>

              <h4 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px' }}>
                Booking Confirmed
              </h4>

              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 24px' }}>
                {isCallbot
                  ? "You'll receive a confirmation call shortly once Mukesh confirms over the phone."
                  : `${firstName} has received your booking and will arrive tomorrow.`}
              </p>

              {/* Booking Summary Box */}
              <div style={{
                backgroundColor: '#FCFAF7',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '16px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Worker:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{worker?.name || 'Local Artisan'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Service:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{serviceType}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Date & Duration:</span>
                  <strong style={{ color: 'var(--text-main)' }}>Tomorrow · 1 Day</strong>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border)'
                }}>
                  <span style={{ fontWeight: 600 }}>Amount:</span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)' }}>
                    ₹{dailyRate}/day
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleFinish}
                style={{ width: '100%', padding: '12px 20px', fontWeight: 700 }}
              >
                <span>View My Bookings</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            /* ==================================================
               SECTION 17: INSTANT BOOKING DETAILS
               ================================================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Worker & Service Card */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px',
                borderRadius: '14px',
                backgroundColor: '#FCFAF7',
                border: '1px solid var(--border)'
              }}>
                <img
                  src={avatarUrl}
                  alt={worker?.name}
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '12px',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80';
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {worker?.name || 'Local Artisan'}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                    {worker?.profession || 'Electrician'} · {worker?.experience || 11} yrs exp
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                    ₹{dailyRate}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/day</div>
                </div>
              </div>

              {/* Service Selection */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  Service
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['House Wiring', 'MCB Installation', 'Fan Installation', 'Lighting'].map((srv) => (
                    <button
                      key={srv}
                      type="button"
                      onClick={() => setServiceType(srv)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        backgroundColor: serviceType === srv ? 'var(--primary-light)' : '#FFFFFF',
                        color: serviceType === srv ? 'var(--primary)' : 'var(--text-main)',
                        border: `1.5px solid ${serviceType === srv ? 'var(--primary)' : 'var(--border)'}`,
                        cursor: 'pointer'
                      }}
                    >
                      {srv}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Duration Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    min={tomorrowStr}
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '14px', padding: '10px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="form-select"
                    style={{ fontSize: '14px', padding: '10px 12px' }}
                  >
                    <option value="1 Day">1 Day (8 hrs)</option>
                    <option value="Half Day">Half Day (4 hrs)</option>
                    <option value="2 Days">2 Days</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  Service Address
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '36px', fontSize: '13.5px' }}
                    placeholder="House / Flat, Street, Locality"
                  />
                </div>
              </div>

              {/* Booking Method Box */}
              <div style={{
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: isCallbot ? 'var(--primary-light)' : '#EFF6FF',
                border: `1px solid ${isCallbot ? '#FFE4D6' : '#BFDBFE'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {isCallbot ? (
                  <>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--primary)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Phone size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#C2410C' }}>
                        Booking Method: Phone Call
                      </div>
                      <div style={{ fontSize: '12px', color: '#9A3412', marginTop: '1px' }}>
                        HireLocal CallBot calls {firstName} in Hindi to confirm within minutes.
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E40AF' }}>
                        Booking Method: App Confirmation
                      </div>
                      <div style={{ fontSize: '12px', color: '#3B82F6', marginTop: '1px' }}>
                        Instant app notification dispatched directly to {firstName}'s smartphone.
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={submitting}
                  style={{ flex: 1, padding: '12px', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirm}
                  disabled={submitting}
                  style={{ flex: 1.5, padding: '12px', fontWeight: 700 }}
                >
                  {submitting
                    ? 'Connecting...'
                    : isCallbot
                    ? 'Call & Confirm'
                    : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
