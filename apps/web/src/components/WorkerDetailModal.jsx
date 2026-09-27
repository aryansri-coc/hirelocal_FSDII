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
  ShieldCheck
} from 'lucide-react';

export default function WorkerDetailModal({ worker, onClose, onBookWorker }) {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const isCallbot = worker?.communication_type === 'non_smartphone';
  const reliability = worker?.reliability_info || {
    score: worker?.reliability,
    isNewWorker: worker?.reliability === null,
    label: worker?.reliability === null ? 'New Worker' : `${worker?.reliability}% Dependability`
  };

  useEffect(() => {
    if (worker?.worker_id) {
      setLoadingReviews(true);
      api.getWorkerRatings(worker.worker_id)
        .then((res) => {
          if (res.success) setReviews(res.data);
        })
        .catch(console.error)
        .finally(() => setLoadingReviews(false));
    }
  }, [worker]);

  if (!worker) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        {/* Navigation / Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 10px', gap: '4px' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Workers</span>
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '12px',
                backgroundColor: 'var(--primary-light)',
                border: '1px solid #BFDBFE',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 800,
                flexShrink: 0
              }}>
                {worker.name.charAt(0)}
              </div>

              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '2px', color: 'var(--text-main)' }}>
                  {worker.name}
                </h2>
                <div style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {worker.profession}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span className="tag">
                    <MapPin size={12} />
                    <span>{worker.location?.name || worker.location_name || 'Bhopal'}</span>
                  </span>
                  {isCallbot ? (
                    <span className="tag">
                      <PhoneCall size={12} style={{ color: 'var(--primary)' }} />
                      <span>CallBot Voice Worker</span>
                    </span>
                  ) : (
                    <span className="tag">
                      <Smartphone size={12} style={{ color: 'var(--primary)' }} />
                      <span>App Worker</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)' }}>
                ₹{worker.daily_rate}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Daily Rate (Day-based)</div>
              <button
                className="btn btn-primary"
                style={{ marginTop: '10px', width: '100%' }}
                onClick={() => onBookWorker(worker)}
              >
                Request Service
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginTop: '20px',
            padding: '12px',
            backgroundColor: 'var(--surface-alt)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Star size={16} style={{ fill: '#F59E0B', color: '#F59E0B' }} />
                <span style={{ fontSize: '16px', fontWeight: 700 }}>{worker.rating ? worker.rating.toFixed(1) : '5.0'}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Quality Rating</div>
            </div>

            <div style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                {worker.completed_jobs || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Completed Jobs</div>
            </div>

            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                {worker.experience} Years
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Trade Experience</div>
            </div>
          </div>
        </div>

        {/* Profile Content Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section: About */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>About</h4>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {worker.bio || `${worker.name} is a verified skilled ${worker.profession} with ${worker.experience} years of field experience in residential and commercial repair, installation, and maintenance.`}
            </p>
          </div>

          {/* Section: Skills */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px' }}>Skills & Services</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(worker.skills || ['General Maintenance', 'Inspection', 'Standard Fitting']).map((skill, idx) => (
                <span key={idx} className="tag" style={{ padding: '6px 12px', fontSize: '13px' }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Section: Availability & Schedule */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px' }}>Working Days</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                const isWorking = (worker.working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).includes(day);
                return (
                  <span
                    key={day}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: isWorking ? 'var(--primary-light)' : 'var(--surface-alt)',
                      color: isWorking ? 'var(--primary)' : 'var(--text-muted)',
                      border: `1px solid ${isWorking ? '#BFDBFE' : 'var(--border)'}`
                    }}
                  >
                    {day}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Section: Service Area */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Service Area</h4>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
              Based in <strong>{worker.location?.name || worker.location_name || 'Bhopal'}</strong>, serving within a <strong>{worker.service_radius || 15} km</strong> operational radius.
            </p>
          </div>

          {/* Section: Reviews & Customer Feedback */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
              Customer Reviews ({reviews.length})
            </h4>

            {loadingReviews ? (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div style={{
                padding: '20px',
                backgroundColor: 'var(--surface-alt)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px'
              }}>
                No written customer reviews yet. This worker maintains a verified baseline rating.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reviews.map((rev) => (
                  <div key={rev.rating_id} style={{
                    padding: '14px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--surface)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{rev.customer_name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
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
                      "{rev.review || 'Completed job promptly and with good craftsmanship.'}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--surface-alt)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Daily rate: <strong>₹{worker.daily_rate}</strong> (Day-based booking)
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={() => onBookWorker(worker)}>
              Request Service
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
