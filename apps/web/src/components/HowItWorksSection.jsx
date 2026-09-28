import React from 'react';
import { Search, UserCheck, Calendar, CheckCircle } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    title: 'Choose a service',
    description: 'Select what you need done around your home or office — electrical, plumbing, carpentry, and more.',
    Icon: Search,
    color: '#F45B0A',
    bg: '#FFF1E8'
  },
  {
    number: '02',
    title: 'Find a worker',
    description: 'Browse verified local professionals with transparent day rates, punctuality metrics, and genuine reviews.',
    Icon: UserCheck,
    color: '#16A34A',
    bg: '#EAF8EF'
  },
  {
    number: '03',
    title: 'Book a time',
    description: 'Confirm a convenient slot in seconds online or via simple automated Hindi voice call.',
    Icon: Calendar,
    color: '#D97706',
    bg: '#FEF3C7'
  },
  {
    number: '04',
    title: 'Get the job done',
    description: 'Your craftsman arrives on time. Inspect the work and pay directly with zero platform markup.',
    Icon: CheckCircle,
    color: '#2563EB',
    bg: '#EFF6FF'
  }
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works-section" style={{
      padding: '72px 0',
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)'
    }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 12px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            fontSize: '12.5px',
            fontWeight: 700,
            marginBottom: '12px'
          }}>
            Simple & Transparent
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--dark)', marginBottom: '10px' }}>
            How HireLocal Works
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
            Direct connection between homeowners and local craftsmen without middlemen or inflated fees.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '24px'
        }} className="hl-how-it-works-grid">
          {STEPS.map((step) => {
            const Icon = step.Icon;
            return (
              <div
                key={step.number}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  padding: '28px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                className="hl-step-card"
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: step.bg,
                    color: step.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={22} strokeWidth={2.3} />
                  </div>
                  <span style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: '#DCD6CD',
                    letterSpacing: '-0.02em'
                  }}>
                    {step.number}
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--dark)', marginBottom: '8px' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
