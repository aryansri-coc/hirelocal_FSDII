import React from 'react';
import {
  Star,
  MapPin,
  CheckCircle,
  Calendar,
  Phone,
  Smartphone
} from 'lucide-react';

export default function WorkerCard({
  worker,
  onSelectWorker,
  onBookWorker,
  isRecommended = false
}) {
  const isCallbot = worker.communication_type === 'non_smartphone';
  const dailyRate = Number(worker.daily_rate) || 550;
  const recommended = isRecommended || worker.isRecommended;

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

  const skills = worker.skills || ['House Wiring', 'MCB Installation', 'Fan Installation'];

  return (
    <div className={`hl-worker-card ${recommended ? 'is-recommended' : ''}`}>
      {/* Recommended Tag */}
      {recommended && (
        <div className="hl-recommended-pill">
          <Star size={11} fill="#FFFFFF" color="#FFFFFF" />
          <span>Recommended</span>
        </div>
      )}

      <div className="hl-card-inner">
        {/* 1. Worker Identity + Photo + Subtle Verified (Sections 10, 11, 12) */}
        <div className="hl-profile-header">
          <div className="hl-avatar-wrap">
            <img
              src={avatarUrl}
              alt={worker.name}
              className="hl-avatar-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80';
              }}
            />
          </div>

          <div className="hl-details-col">
            <div className="hl-name-badge-row">
              <h3 className="hl-worker-name" title={worker.name}>
                {worker.name}
              </h3>
              <span className="hl-verified-subtle" title="Government Verified Worker">
                <CheckCircle size={13} color="#16A34A" />
                <span>Verified</span>
              </span>
            </div>

            <div className="hl-profession-exp">
              {worker.profession || 'Electrician'} · {worker.experience ? `${worker.experience} years experience` : 'Verified Artisan'}
            </div>

            {/* Rating, Jobs, Reliability & Distance */}
            <div className="hl-metrics-row">
              <span className="hl-rating-badge">
                <Star size={12.5} fill="#F59E0B" color="#F59E0B" />
                <strong>{worker.rating ? Number(worker.rating).toFixed(1) : '4.9'}</strong>
                <span className="hl-jobs-count">({worker.completed_jobs || 142} jobs)</span>
              </span>
              <span className="hl-metric-sep">•</span>
              <span className="hl-ontime-text">
                {worker.reliability ? `${worker.reliability}% on-time` : '98% on-time'}
              </span>
            </div>

            <div className="hl-distance-row">
              <MapPin size={12} color="#6B7280" />
              <span>{worker.distance_km || '2.4'} km away</span>
            </div>
          </div>
        </div>

        {/* 2. Availability (Section 13) */}
        <div className="hl-avail-row">
          <span className="hl-avail-green-dot" />
          <span>Available tomorrow</span>
        </div>

        {/* 3. Services / Skill Chips */}
        <div className="hl-skills-wrap">
          {skills.slice(0, 3).map((s, idx) => (
            <span key={idx} className="hl-skill-pill">
              {s}
            </span>
          ))}
          {skills.length > 3 && (
            <span className="hl-skill-pill hl-skill-more">
              +{skills.length - 3}
            </span>
          )}
        </div>

        {/* 4. Booking Method (Section 14) + Price */}
        <div className="hl-method-price-row">
          <div className="hl-booking-method-note">
            {isCallbot ? (
              <div className="hl-method-item phone">
                <Phone size={14} className="hl-method-icon" />
                <div>
                  <div className="hl-method-title">Phone booking available</div>
                  <div className="hl-method-desc">Hindi voice confirmation</div>
                </div>
              </div>
            ) : (
              <div className="hl-method-item app">
                <Smartphone size={14} className="hl-method-icon" />
                <div>
                  <div className="hl-method-title">App booking available</div>
                  <div className="hl-method-desc">Instant confirmation</div>
                </div>
              </div>
            )}
          </div>

          <div className="hl-price-display">
            <span className="hl-price-amount">₹{dailyRate}</span>
            <span className="hl-price-period">/day</span>
          </div>
        </div>

        {/* 5. Clean Action Buttons (Section 26) */}
        <div className="hl-actions-row">
          <button
            type="button"
            className="hl-btn-profile"
            onClick={() => onSelectWorker ? onSelectWorker(worker) : null}
          >
            View Profile
          </button>
          <button
            type="button"
            className="hl-btn-book"
            onClick={() => onBookWorker ? onBookWorker(worker) : null}
          >
            <Calendar size={14} />
            <span>Book</span>
          </button>
        </div>
      </div>
    </div>
  );
}
