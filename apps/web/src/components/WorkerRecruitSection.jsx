import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const BENEFITS = [
  '0% platform commission',
  'Choose your daily rate',
  'Phone or app bookings',
  'Direct customer payments'
];

export default function WorkerRecruitSection({ onWorkAsWorker }) {
  return (
    <section style={{
      padding: '80px 0',
      backgroundColor: '#151A24',
      color: '#FFFFFF'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: '48px',
          alignItems: 'center'
        }} className="hl-worker-recruit-grid">
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 12px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(244, 91, 10, 0.15)',
              color: '#F45B0A',
              fontSize: '12.5px',
              fontWeight: 700,
              marginBottom: '16px',
              border: '1px solid rgba(244, 91, 10, 0.3)'
            }}>
              For Skilled Craftsmen
            </div>

            <h2 style={{
              fontSize: 'clamp(32px, 3.5vw, 44px)',
              fontWeight: 800,
              lineHeight: 1.15,
              color: '#FFFFFF',
              marginBottom: '16px',
              letterSpacing: '-0.025em'
            }}>
              Your skills. Your customers.<br />
              <span style={{ color: '#F45B0A' }}>Your earnings.</span>
            </h2>

            <p style={{
              fontSize: '16.5px',
              color: '#94A3B8',
              lineHeight: 1.6,
              marginBottom: '32px',
              maxWidth: '540px'
            }}>
              Join HireLocal and get direct bookings from customers nearby. Work independently on your terms, with zero commission taken from your daily rate.
            </p>

            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={onWorkAsWorker}
              style={{
                backgroundColor: '#F45B0A',
                borderColor: '#F45B0A',
                height: '48px',
                fontSize: '15px'
              }}
            >
              <span>Join HireLocal</span>
              <ArrowRight size={17} />
            </button>
          </div>

          {/* Benefits Grid on Dark Card */}
          <div style={{
            backgroundColor: '#1E2638',
            border: '1.5px solid #2D3748',
            borderRadius: '20px',
            padding: '32px 28px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '20px' }}>
              Why Craftsmen Choose HireLocal
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {BENEFITS.map((b) => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(22, 163, 74, 0.2)',
                    color: '#4ADE80',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <CheckCircle2 size={16} />
                  </div>
                  <span style={{ fontSize: '15px', color: '#E2E8F0', fontWeight: 500 }}>
                    {b}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
