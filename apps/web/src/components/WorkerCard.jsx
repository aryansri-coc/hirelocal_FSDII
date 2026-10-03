import React from 'react';
import {
  Star,
  MapPin,
  CheckCircle,
  Calendar,
  Phone,
  Smartphone,
  ShieldCheck
} from 'lucide-react';

export default function WorkerCard({
  worker,
  onSelectWorker,
  onBookWorker,
  isRecommended = false,
  themeColor
}) {
  const isCallbot = worker.communication_type === 'non_smartphone';
  const dailyRate = Number(worker.daily_rate) || 550;
  const recommended = isRecommended || worker.isRecommended;

  // Resolve profession theme color dynamically
  const prof = (worker.profession || '').toLowerCase();
  const activeColor = themeColor || (
    prof.includes('elec') ? '#2563EB' :
    prof.includes('plumb') ? '#0284C7' :
    prof.includes('mech') || prof.includes('ac') ? '#DC2626' :
    prof.includes('carp') ? '#D97706' :
    prof.includes('paint') ? '#16A34A' :
    prof.includes('appliance') ? '#7C3AED' :
    '#0D9488'
  );

  // Real worker avatar or high-quality contextual artisan photo
  const avatarUrl = worker.avatar || (
    worker.name?.includes('Mukesh')
      ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
      : worker.name?.includes('Sunil')
      ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'
      : worker.name?.includes('Rohit')
      ? 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80'
      : worker.name?.includes('Amit')
      ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80'
      : worker.name?.includes('Rakesh')
      ? 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80'
      : worker.name?.includes('Vijay')
      ? 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80'
  );

  const skills = worker.skills || ['Pipe Leaks', 'Sanitary Ware', 'Tap Fittings'];

  return (
    <div
      className={`hl-worker-card ${recommended ? 'is-recommended' : ''}`}
      style={{
        borderColor: recommended ? activeColor : 'var(--border)',
        boxShadow: recommended
          ? `0 12px 30px -4px ${activeColor}22, 0 2px 8px -2px rgba(15, 23, 42, 0.04)`
          : '0 4px 18px -2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)'
      }}
    >
      {/* 1. TOP UTILITY HEADER: Clean Trade Pill + Status Badge */}
      <div className="hl-card-top-bar">
        <div
          className="hl-trade-pill"
          style={{
            backgroundColor: `${activeColor}12`,
            color: activeColor,
            borderColor: `${activeColor}30`
          }}
        >
          <span className="hl-trade-pill-name">{worker.profession || 'Artisan'}</span>
        </div>

        {recommended ? (
          <div
            className="hl-recommended-badge"
            style={{
              backgroundColor: activeColor,
              boxShadow: `0 2px 8px ${activeColor}45`
            }}
          >
            <Star size={11} fill="#FFFFFF" color="#FFFFFF" />
            <span>Recommended</span>
          </div>
        ) : (
          <div className="hl-verified-pill">
            <ShieldCheck size={12} color="#16A34A" />
            <span>Verified Pro</span>
          </div>
        )}
      </div>

      <div className="hl-card-inner">
        {/* 2. WORKER IDENTITY: Avatar Squircle + Clean Name */}
        <div className="hl-identity-row">
          <div className="hl-avatar-container">
            <img
              src={avatarUrl}
              alt={worker.name}
              className="hl-avatar-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80';
              }}
            />
            <span className="hl-avatar-verified-mark" title="Verified Pro">
              <CheckCircle size={14} fill="#16A34A" color="#FFFFFF" />
            </span>
          </div>

          <div className="hl-identity-meta">
            <h3 className="hl-worker-name" title={worker.name}>
              {worker.name}
            </h3>
          </div>
        </div>

        {/* 3. CLEAN RATING & DISTANCE STRIP (No clutter, Rating + Jobs + Distance) */}
        <div className="hl-rating-strip">
          <div className="hl-rating-val">
            <Star size={13} fill="#F59E0B" color="#F59E0B" />
            <strong>{worker.rating ? Number(worker.rating).toFixed(1) : '4.9'}</strong>
            <span className="hl-rating-count">({worker.completed_jobs || 134} jobs)</span>
          </div>
          <div className="hl-distance-tag">
            <MapPin size={12} color="#64748B" />
            <span>{worker.distance_km || '1.8'} km away</span>
          </div>
        </div>

        {/* 4. SCULPTED AVAILABILITY CAPSULE */}
        <div className="hl-availability-capsule">
          <div className="hl-avail-left">
            <span className="hl-pulse-dot" />
            <span className="hl-avail-title">Available Tomorrow</span>
          </div>
          <span className="hl-avail-slot">Earliest Slot: 9:00 AM</span>
        </div>

        {/* 5. CURATED SKILL TAGS */}
        <div className="hl-skills-island">
          {skills.slice(0, 3).map((s, idx) => (
            <span key={idx} className="hl-skill-chip">
              {s}
            </span>
          ))}
          {skills.length > 3 && (
            <span className="hl-skill-chip hl-skill-chip-more">
              +{skills.length - 3} more
            </span>
          )}
        </div>

        {/* 6. SCULPTED PRICE & BOOKING ISLAND (Clean daily rate only, no ~₹69/hr) */}
        <div className="hl-booking-price-island">
          <div className="hl-bpi-left">
            {isCallbot ? (
              <div className="hl-channel-block phone">
                <div className="hl-channel-icon-wrap phone">
                  <Phone size={13.5} />
                </div>
                <div>
                  <div className="hl-channel-title">Phone Booking</div>
                  <div className="hl-channel-sub">Hindi Voice Bot • 30s</div>
                </div>
              </div>
            ) : (
              <div className="hl-channel-block app">
                <div className="hl-channel-icon-wrap app">
                  <Smartphone size={13.5} />
                </div>
                <div>
                  <div className="hl-channel-title">Instant Booking</div>
                  <div className="hl-channel-sub">Direct App Confirm</div>
                </div>
              </div>
            )}
          </div>

          <div className="hl-bpi-right">
            <div className="hl-bpi-rate">
              <span className="hl-rate-num">₹{dailyRate}</span>
              <span className="hl-rate-unit">/day</span>
            </div>
          </div>
        </div>

        {/* 7. SCULPTED ACTION BUTTONS */}
        <div className="hl-card-actions">
          <button
            type="button"
            className="hl-btn-view-profile"
            onClick={() => onSelectWorker ? onSelectWorker(worker) : null}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = activeColor;
              e.currentTarget.style.color = activeColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.color = '#334155';
            }}
          >
            View Profile
          </button>

          <button
            type="button"
            className="hl-btn-book-pro"
            style={{
              backgroundColor: activeColor,
              boxShadow: `0 4px 14px ${activeColor}40`
            }}
            onClick={() => onBookWorker ? onBookWorker(worker) : null}
          >
            <Calendar size={13.5} />
            <span>Book Pro</span>
          </button>
        </div>
      </div>
    </div>
  );
}
