import React from 'react';
import { Star, MapPin, Briefcase, CheckCircle, Smartphone, PhoneCall } from 'lucide-react';

export default function WorkerCard({ worker, onSelectWorker, onBookWorker }) {
  const isCallbot = worker.communication_type === 'non_smartphone';
  const reliability = worker.reliability_info || {
    score: worker.reliability,
    isNewWorker: worker.reliability === null,
    label: worker.reliability === null ? 'New Worker' : `${worker.reliability}% Dependable`
  };

  return (
    <div className="card" style={{
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      backgroundColor: 'var(--surface)',
      position: 'relative'
    }}>
      <div>
        {/* Top Header: Avatar + Info */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            backgroundColor: 'var(--surface-alt)',
            border: '1px solid var(--border)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 700,
            flexShrink: 0
          }}>
            {worker.name.charAt(0)}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                {worker.name}
              </h3>
              {worker.match_score !== undefined && (
                <span className="tag" style={{ color: 'var(--primary)', borderColor: '#BFDBFE', backgroundColor: 'var(--primary-light)' }}>
                  {worker.match_score}% Match
                </span>
              )}
            </div>

            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '1px' }}>
              {worker.profession}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              {isCallbot ? (
                <span className="tag" style={{ color: 'var(--text-secondary)' }}>
                  <PhoneCall size={12} style={{ color: 'var(--primary)' }} />
                  <span>CallBot Voice Worker</span>
                </span>
              ) : (
                <span className="tag" style={{ color: 'var(--text-secondary)' }}>
                  <Smartphone size={12} style={{ color: 'var(--primary)' }} />
                  <span>App Worker</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Rating & Reliability Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          padding: '10px 12px',
          backgroundColor: 'var(--surface-alt)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '14px'
        }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Quality Rating
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Star size={14} style={{ fill: '#F59E0B', color: '#F59E0B' }} />
              <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                {worker.rating ? worker.rating.toFixed(1) : '5.0'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ 5</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Dependability
            </div>
            <div style={{ marginTop: '2px' }}>
              {reliability.isNewWorker ? (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>New on HireLocal</span>
              ) : (
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)' }}>
                  {reliability.score}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats: Experience, Jobs, Distance */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          marginBottom: '14px',
          textAlign: 'center'
        }}>
          <div style={{ borderRight: '1px solid var(--border)' }}>
            <span style={{ display: 'block', fontWeight: 700, color: 'var(--text-main)' }}>
              {worker.experience} yrs
            </span>
            <span style={{ color: 'var(--text-muted)' }}>Experience</span>
          </div>
          <div style={{ borderRight: '1px solid var(--border)' }}>
            <span style={{ display: 'block', fontWeight: 700, color: 'var(--text-main)' }}>
              {worker.completed_jobs}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>Jobs Done</span>
          </div>
          <div>
            <span style={{ display: 'block', fontWeight: 700, color: 'var(--text-main)' }}>
              {worker.distance_km || '3.2'} km
            </span>
            <span style={{ color: 'var(--text-muted)' }}>Distance</span>
          </div>
        </div>

        {/* Daily Rate Display */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: '16px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border)'
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Daily Rate:</span>
          <div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
              ₹{worker.daily_rate}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}> / day</span>
          </div>
        </div>
      </div>

      {/* Primary & Secondary Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className="btn btn-secondary btn-sm"
          style={{ flex: 1 }}
          onClick={() => onSelectWorker(worker)}
        >
          View Profile
        </button>
        <button
          className="btn btn-primary btn-sm"
          style={{ flex: 1 }}
          onClick={() => onBookWorker(worker)}
        >
          Request Service
        </button>
      </div>
    </div>
  );
}
