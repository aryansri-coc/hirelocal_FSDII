import React from 'react';
import { PhoneCall } from 'lucide-react';

const FLOW_STEPS = [
  { step: '1', title: 'Customer books', desc: 'Selects craft & time slot' },
  { step: '2', title: 'HireLocal calls', desc: 'Outbound ring to worker phone' },
  { step: '3', title: 'Hears Hindi audio', desc: 'Job location & day rate' },
  { step: '4', title: 'Presses 1 to accept', desc: 'Instant DTMF lock' },
  { step: '5', title: 'Confirmed!', desc: 'Both parties notified' }
];

export default function CallBotVoiceSection({ onOpenCallbot }) {
  return (
    <section style={{
      padding: '80px 0',
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 0.9fr',
          gap: '56px',
          alignItems: 'center'
        }} className="hl-callbot-split">
          {/* Left Column: Product Story */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: '12.5px',
              fontWeight: 700,
              marginBottom: '16px'
            }}>
              <PhoneCall size={14} />
              <span>HireLocal Voice Technology</span>
            </div>

            <h2 style={{
              fontSize: 'clamp(32px, 3.2vw, 42px)',
              fontWeight: 800,
              lineHeight: 1.15,
              color: 'var(--dark)',
              marginBottom: '16px',
              letterSpacing: '-0.025em'
            }}>
              No smartphone? No problem.
            </h2>

            <p style={{
              fontSize: '16.5px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '28px'
            }}>
              Workers can receive job offers on any basic phone and confirm using a natural Hindi voice call and keypad. No apps to download, no literacy barriers.
            </p>

            {/* Horizontal Step Flow */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '32px',
              overflowX: 'auto',
              paddingBottom: '8px'
            }} className="hl-flow-strip">
              {FLOW_STEPS.map((item, idx) => (
                <React.Fragment key={item.step}>
                  <div style={{
                    backgroundColor: 'var(--bg-main)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    minWidth: '130px',
                    flexShrink: 0
                  }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--primary)',
                      marginBottom: '4px'
                    }}>
                      STEP {item.step}
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--dark)' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.desc}
                    </div>
                  </div>
                  {idx < FLOW_STEPS.length - 1 && (
                    <span style={{ color: 'var(--border-strong)', fontSize: '16px', flexShrink: 0 }}>→</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Action Button */}
            {onOpenCallbot && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onOpenCallbot}
                style={{ padding: '0 24px', height: '46px' }}
              >
                <PhoneCall size={16} />
                <span>Try Voice CallBot Demo</span>
              </button>
            )}
          </div>

          {/* Right Column: Video cropped 20% from both sides */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '360px',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 24px 48px -12px rgba(21, 26, 36, 0.2), 0 0 0 1px var(--border)',
              backgroundColor: '#0F172A',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <video
                src="/callbot_voice_feature.mp4"
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: '166.67%',
                  minWidth: '166.67%',
                  display: 'block',
                  marginLeft: '-33.33%',
                  marginRight: '-33.33%',
                  objectFit: 'cover'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
