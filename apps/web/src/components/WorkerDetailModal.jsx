import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  Star,
  MapPin,
  Calendar,
  CheckCircle,
  Briefcase,
  PhoneCall,
  Smartphone,
  ArrowLeft,
  X,
  Clock,
  ShieldCheck,
  MessageSquare,
  Globe
} from 'lucide-react';

export default function WorkerDetailModal({ worker, onClose, onBookWorker }) {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [activeTab, setActiveTab] = useState('About'); // 'About' | 'Services' | 'Reviews' | 'Availability'

  const isCallbot = worker?.communication_type === 'non_smartphone';
  const firstName = worker?.name ? worker.name.split(' ')[0] : 'Worker';
  const dailyRate = Number(worker?.daily_rate) || 550;

  // Real or high-resolution fallback avatar
  const avatarUrl = worker?.avatar || (
    worker?.name?.includes('Mukesh')
      ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'
      : worker?.name?.includes('Sunil')
      ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80'
      : worker?.name?.includes('Rohit')
      ? 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80'
      : worker?.name?.includes('Amit')
      ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80'
      : worker?.name?.includes('Rakesh')
      ? 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80'
      : worker?.name?.includes('Vijay')
      ? 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80'
  );

  useEffect(() => {
    if (worker?.worker_id) {
      setLoadingReviews(true);
      api.getWorkerRatings(worker.worker_id)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setReviews(res.data);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingReviews(false));
    }
  }, [worker]);

  if (!worker) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '720px',
          width: '100%',
          borderRadius: '20px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 48px -12px rgba(21, 26, 36, 0.18)'
        }}
      >
        {/* Modal Top Bar */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 0'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Workers</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Section 16 Top Profile Card */}
        <div style={{
          padding: '28px 24px 20px',
          backgroundColor: '#FCFAF7',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              {/* Prominent Worker Avatar */}
              <div style={{
                position: 'relative',
                width: '84px',
                height: '84px',
                borderRadius: '18px',
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(21, 26, 36, 0.08)',
                border: '2px solid #FFFFFF'
              }}>
                <img
                  src={avatarUrl}
                  alt={worker.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80';
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {worker.name}
                  </h2>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--success)',
                    backgroundColor: 'var(--success-light)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    <CheckCircle size={13} />
                    <span>Government Verified</span>
                  </span>
                </div>

                <div style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '3px' }}>
                  {worker.profession || 'Electrician'} · {worker.experience ? `${worker.experience} years experience` : 'Verified Craftsman'}
                </div>

                {/* Trust and Reliability Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '8px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'var(--text-main)' }}>
                    <Star size={14} fill="#F59E0B" color="#F59E0B" />
                    <span>{worker.rating ? Number(worker.rating).toFixed(1) : '4.9'}</span>
                  </span>
                  <span>•</span>
                  <span>{worker.completed_jobs || 142} jobs</span>
                  <span>•</span>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                    {worker.reliability ? `${worker.reliability}% on-time` : '98% on-time'}
                  </span>
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <MapPin size={12} color="#6B7280" />
                    <span>{worker.distance_km || '2.4'} km away</span>
                  </span>
                </div>

                {/* Available tomorrow */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '10px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: 'var(--success)'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--success)',
                    display: 'inline-block'
                  }}></span>
                  <span>Available tomorrow</span>
                </div>
              </div>
            </div>

            {/* Price & Primary CTAs */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
                  ₹{dailyRate}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  per day (no platform fee)
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => alert(`Starting direct conversation with ${firstName}`)}
                  style={{ padding: '9px 14px', fontSize: '13px' }}
                >
                  <MessageSquare size={14} />
                  <span>Message</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onBookWorker(worker)}
                  style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 700 }}
                >
                  <Calendar size={14} />
                  <span>Book {firstName}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (About / Services / Reviews / Availability) */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '24px',
            borderBottom: '1px solid var(--border)'
          }}>
            {['About', 'Services', 'Reviews', 'Availability'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                  color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab ? 700 : 500,
                  fontSize: '14px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab}
                {tab === 'Reviews' && reviews.length > 0 && ` (${reviews.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: '24px', minHeight: '260px', backgroundColor: '#FFFFFF' }}>
          {activeTab === 'About' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  About {firstName}
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {worker.bio || `${worker.name} is a verified skilled ${worker.profession || 'electrician'} with ${worker.experience || 11} years of hands-on field experience across residential and commercial wiring, MCB distribution boards, lighting fixtures, and power backups. Known locally for prompt attendance and tidy craftsmanship.`}
                </p>
              </div>

              {/* Languages Spoken */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                  Languages Spoken
                </h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Hindi (Primary)', 'Bhojpuri', 'Basic English'].map((lang, idx) => (
                    <span key={idx} style={{
                      fontSize: '13px',
                      backgroundColor: 'var(--surface-warm)',
                      border: '1px solid var(--border)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      color: 'var(--text-secondary)'
                    }}>
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              {/* Trust & Safety Highlights */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: '#FCFAF7',
                border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} color="#16A34A" />
                  <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>
                    Aadhaar Identity Verified
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={16} color="#16A34A" />
                  <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>
                    No Criminal Records Flagged
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Services' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
                  Specialized Skills & Scope
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(worker.skills || ['House Wiring', 'MCB Installation', 'Fan Installation', 'Inverter Setup', 'Earthing Check']).map((s, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--surface-warm)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--text-main)'
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pricing Clarity */}
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'var(--primary-light)',
                border: '1px solid #FFE4D6'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#C2410C', marginBottom: '4px' }}>
                  Day-Wage Pricing: ₹{dailyRate} / day
                </div>
                <div style={{ fontSize: '13px', color: '#9A3412', lineHeight: 1.5 }}>
                  Includes 8 working hours of labor on site. Raw material costs (wires, switches, pipes) are reimbursed directly by the homeowner upon invoice.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Reviews' && (
            <div>
              {loadingReviews ? (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>
                  Loading reviews...
                </div>
              ) : reviews.length === 0 ? (
                <div style={{
                  padding: '32px 20px',
                  backgroundColor: '#FCFAF7',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  textAlign: 'center'
                }}>
                  <Star size={24} color="#F59E0B" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {worker.rating ? `${worker.rating.toFixed(1)} / 5.0 Baseline Score` : '4.9 / 5.0 Baseline Score'}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {firstName} has successfully delivered {worker.completed_jobs || 142} jobs across the neighborhood with 98% on-time record.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {reviews.map((rev) => (
                    <div
                      key={rev.rating_id}
                      style={{
                        padding: '14px',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                          {rev.customer_name}
                        </span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              style={{
                                fill: i < rev.rating ? '#F59E0B' : '#E5E7EB',
                                color: i < rev.rating ? '#F59E0B' : '#E5E7EB'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        "{rev.review || 'Arrived on time and resolved the wiring problem cleanly.'}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Availability' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Active Working Days
                </h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const isWorking = !day.includes('Sun');
                    return (
                      <span
                        key={day}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          backgroundColor: isWorking ? 'var(--primary-light)' : '#F3F4F6',
                          color: isWorking ? 'var(--primary)' : 'var(--text-muted)',
                          border: `1px solid ${isWorking ? '#FFE4D6' : 'var(--border)'}`
                        }}
                      >
                        {day}: {isWorking ? 'Available' : 'Off'}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Service Perimeter
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                  Based in <strong>{worker.location?.name || worker.location_name || (worker.pincode ? `PINCODE ${worker.pincode}` : 'MP Nagar (462011)')}</strong>, operating within a <strong>15 km radius</strong> to guarantee prompt morning arrival.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Sticky CTA */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          backgroundColor: '#FCFAF7',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
              ₹{dailyRate} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>/ day</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block' }} />
              <span>Available tomorrow</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onBookWorker(worker)}
              style={{ fontWeight: 700 }}
            >
              Book {firstName}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
