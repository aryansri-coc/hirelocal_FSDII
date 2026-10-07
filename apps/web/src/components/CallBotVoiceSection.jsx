import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  CalendarCheck,
  Volume2,
  Smartphone,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

const FLOW_STEPS = [
  {
    step: '01',
    shortLabel: 'Book',
    title: 'Customer books online',
    desc: 'Homeowner selects craft, locality & preferred time slot in 30 seconds.',
    icon: CalendarCheck,
    tag: 'Web / App',
    color: '#F45B0A',
    bg: '#FFF1E8',
    preview: (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '9px 12px',
        borderRadius: '8px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #ECE7E0',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        flexWrap: 'wrap'
      }}>
        <span>📍 <strong>Andheri West, Mumbai</strong></span>
        <span style={{ color: 'var(--border-strong)' }}>•</span>
        <span>🛠️ <strong>Master Electrician</strong></span>
        <span style={{ color: 'var(--border-strong)' }}>•</span>
        <span style={{ color: '#16A34A', fontWeight: 600 }}>⏰ Today 3:00 PM</span>
      </div>
    )
  },
  {
    step: '02',
    shortLabel: 'Call',
    title: 'HireLocal calls worker phone',
    desc: 'Instant automated outbound call placed to worker’s standard 2G / basic phone.',
    icon: PhoneCall,
    tag: 'Instant Ring',
    color: '#2563EB',
    bg: '#EFF6FF',
    preview: (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '9px 12px',
        borderRadius: '8px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #DBEAFE',
        fontSize: '12px',
        flexWrap: 'wrap',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#2563EB',
            boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.25)',
            display: 'inline-block'
          }} />
          <span style={{ color: 'var(--dark)', fontWeight: 600 }}>Dials: +91 98201 XXXXX</span>
        </div>
        <span style={{ color: '#2563EB', fontWeight: 700, fontSize: '11px', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '4px' }}>
          2G GSM Network • Sub-10s
        </span>
      </div>
    )
  },
  {
    step: '03',
    shortLabel: 'Voice',
    title: 'Worker hears Hindi voice prompt',
    desc: 'Natural Hindi audio clearly explains location, time & guaranteed day rate.',
    icon: Volume2,
    tag: 'Hindi Audio',
    color: '#D97706',
    bg: '#FEF3C7',
    preview: (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '9px 12px',
        borderRadius: '8px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #FDE68A',
        fontSize: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ color: '#92400E', fontWeight: 600, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🗣️</span>
          <span>"नमस्ते, अंधेरी वेस्ट में ₹850 का नया काम है..."</span>
        </div>
        {/* Animated Sound Equalizer Bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '16px' }}>
          <span className="hl-eq-bar hl-eq-1" />
          <span className="hl-eq-bar hl-eq-2" />
          <span className="hl-eq-bar hl-eq-3" />
          <span className="hl-eq-bar hl-eq-4" />
        </div>
      </div>
    )
  },
  {
    step: '04',
    shortLabel: 'Keypad',
    title: 'Craftsman presses 1 to accept',
    desc: 'Instant DTMF keypad tone verification locks the dispatch in sub-second time.',
    icon: Smartphone,
    tag: 'Keypad Lock',
    color: '#7C3AED',
    bg: '#F5F3FF',
    preview: (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '9px 12px',
        borderRadius: '8px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #DDD6FE',
        fontSize: '12px',
        flexWrap: 'wrap',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: '#7C3AED',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '12.5px',
            boxShadow: '0 2px 6px rgba(124, 58, 237, 0.35)'
          }}>
            1
          </div>
          <span style={{ color: 'var(--dark)', fontWeight: 600 }}>Key '1' Pressed on Dialpad</span>
        </div>
        <span style={{ color: '#7C3AED', fontWeight: 700, fontSize: '11px', backgroundColor: '#F5F3FF', padding: '2px 8px', borderRadius: '4px' }}>
          DTMF Tone Verified • Instant Lock
        </span>
      </div>
    )
  },
  {
    step: '05',
    shortLabel: 'Matched',
    title: 'Job confirmed & dispatched!',
    desc: 'Both homeowner & craftsman get instant SMS confirmation and contact details.',
    icon: CheckCircle2,
    tag: 'Confirmed',
    color: '#16A34A',
    bg: '#EAF8EF',
    preview: (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '9px 12px',
        borderRadius: '8px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #BBF7D0',
        fontSize: '12px',
        flexWrap: 'wrap',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#16A34A', fontWeight: 700 }}>✓ SMS Sent: Ramesh is on the way (ETA 3 PM)</span>
        </div>
        <span style={{ color: '#16A34A', fontWeight: 700, fontSize: '11px', backgroundColor: '#EAF8EF', padding: '2px 8px', borderRadius: '4px' }}>
          100% Dispatched
        </span>
      </div>
    )
  }
];

const DURATION_MS = 5000;
const TICK_INTERVAL_MS = 50;

export default function CallBotVoiceSection({ onOpenCallbot }) {
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Auto-advance loop every 5 seconds (5000ms) with smooth progress bar
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveStep((curr) => (curr + 1) % FLOW_STEPS.length);
          return 0;
        }
        return prev + (TICK_INTERVAL_MS / DURATION_MS) * 100;
      });
    }, TICK_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isPaused, activeStep]);

  const currentItem = FLOW_STEPS[activeStep];

  return (
    <section
      id="voice-callbot-section"
      style={{
        padding: '76px 0',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        position: 'relative'
      }}
    >
      <div className="container">
        <div className="hl-callbot-layout">
          {/* Left Column: Product Story & Dynamic Scroll-Up Stepper */}
          <div className="hl-callbot-content">
            <h2 style={{
              fontSize: 'clamp(28px, 3.2vw, 40px)',
              fontWeight: 800,
              lineHeight: 1.18,
              color: 'var(--dark)',
              marginTop: 0,
              marginBottom: '14px',
              letterSpacing: '-0.025em'
            }}>
              No smartphone? No problem.
            </h2>

            <p style={{
              fontSize: '15.5px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '24px',
              maxWidth: '560px'
            }}>
              Craftsmen receive job offers directly on standard 2G/basic keypad phones and confirm within seconds via natural Hindi voice audio. Zero internet required, zero literacy barriers.
            </p>

            {/* Dynamic Scroll-Up Viewport */}
            <div
              className="hl-stage-viewport"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Subtle Progress Bar atop the viewport */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '3px',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                zIndex: 10
              }}>
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: currentItem.color,
                  transition: 'width 0.05s linear'
                }} />
              </div>
              <div
                className="hl-stage-slider"
                style={{
                  transform: `translateY(-${activeStep * 100}%)`,
                  transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {FLOW_STEPS.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = activeStep === idx;

                  return (
                    <div
                      key={item.step}
                      className="hl-stage-card"
                      style={{
                        padding: '20px 22px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxSizing: 'border-box',
                        height: '100%'
                      }}
                    >
                      {/* Top Header Row */}
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '11px',
                              backgroundColor: item.bg,
                              color: item.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: `0 4px 12px -2px ${item.color}33`
                            }}>
                              <Icon size={19} strokeWidth={2.3} />
                            </div>

                            <div>
                              <div style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                letterSpacing: '0.04em',
                                color: item.color,
                                textTransform: 'uppercase'
                              }}>
                                STEP {item.step} OF 05
                              </div>
                              <h3 style={{
                                fontSize: '16.5px',
                                fontWeight: 800,
                                color: 'var(--dark)',
                                margin: '2px 0 0 0',
                                lineHeight: 1.2
                              }}>
                                {item.title}
                              </h3>
                            </div>
                          </div>

                          <span style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: item.color,
                            backgroundColor: item.bg,
                            padding: '3px 9px',
                            borderRadius: '6px',
                            whiteSpace: 'nowrap'
                          }}>
                            {item.tag}
                          </span>
                        </div>

                        <p style={{
                          fontSize: '13.5px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                          margin: '0 0 14px 0'
                        }}>
                          {item.desc}
                        </p>
                      </div>

                      {/* Interactive Micro-Preview Box */}
                      <div>
                        {item.preview}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            {onOpenCallbot && (
              <div style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onOpenCallbot}
                  style={{
                    padding: '0 26px',
                    height: '46px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 700,
                    boxShadow: '0 6px 18px -4px rgba(244, 91, 10, 0.35)'
                  }}
                >
                  <PhoneCall size={16} />
                  <span>Try Voice CallBot Demo</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Mobile Video Showcase */}
          <div className="hl-callbot-preview">
            <div 
              className="hl-video-container"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '460px',
                height: '100%',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 24px 50px -12px rgba(21, 26, 36, 0.18), 0 0 0 1px var(--border)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <video
                src="/callbot_voice_feature.mp4"
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hl-callbot-layout {
          display: grid;
          grid-template-columns: 1.08fr 0.92fr;
          gap: 52px;
          align-items: stretch;
        }

        .hl-callbot-content {
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
        }

        .hl-callbot-preview {
          display: flex;
          justifyContent: center;
          align-items: stretch;
          height: 100%;
        }

        .hl-stage-viewport {
          height: 228px;
          overflow: hidden;
          position: relative;
          border-radius: 16px;
          background-color: #FCFAF7;
          border: 1.5px solid var(--border);
          box-shadow: 0 4px 20px -4px rgba(21, 26, 36, 0.05);
        }

        .hl-stage-slider {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .hl-stage-card {
          flex-shrink: 0;
          height: 228px;
        }

        @keyframes hlEq {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }

        .hl-eq-bar {
          width: 3px;
          background-color: #D97706;
          border-radius: 2px;
          animation: hlEq 0.8s ease-in-out infinite;
        }
        .hl-eq-1 { animation-delay: 0s; }
        .hl-eq-2 { animation-delay: 0.2s; }
        .hl-eq-3 { animation-delay: 0.4s; }
        .hl-eq-4 { animation-delay: 0.15s; }

        @media (max-width: 960px) {
          .hl-callbot-layout {
            grid-template-columns: 1fr;
            gap: 40px;
            align-items: start;
          }
          .hl-callbot-preview {
            order: -1;
            height: auto !important;
          }
          .hl-callbot-preview .hl-video-container {
            height: 360px !important;
            max-width: 100% !important;
          }
        }

        @media (max-width: 640px) {
          .hl-stage-viewport,
          .hl-stage-card {
            height: 250px;
          }
        }
      `}</style>
    </section>
  );
}
