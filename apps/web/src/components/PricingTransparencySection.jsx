import React from 'react';
import { Zap, Droplets, Hammer, Wind, Check, ArrowRight } from 'lucide-react';

const PRICING_CARDS = [
  {
    service: 'Electrician',
    range: '₹450 – ₹600',
    unit: '/day',
    desc: 'Wiring, MCBs, fixtures & appliance repairs',
    Icon: Zap,
    color: '#F45B0A',
    bg: '#FFF1E8'
  },
  {
    service: 'Plumber',
    range: '₹550 – ₹750',
    unit: '/day',
    desc: 'Pipe leakages, sanitary fittings & water tanks',
    Icon: Droplets,
    color: '#0284C7',
    bg: '#F0F9FF'
  },
  {
    service: 'Carpenter',
    range: '₹700 – ₹900',
    unit: '/day',
    desc: 'Furniture repairs, door fitting & woodwork',
    Icon: Hammer,
    color: '#D97706',
    bg: '#FEF3C7'
  },
  {
    service: 'AC Mechanic',
    range: '₹750 – ₹950',
    unit: '/day',
    desc: 'Seasonal servicing, cooling checks & installations',
    Icon: Wind,
    color: '#0D9488',
    bg: '#F0FDFA'
  }
];

export default function PricingTransparencySection({ onFindWorker }) {
  return (
    <section style={{
      padding: '72px 0',
      backgroundColor: 'var(--bg-main)',
      borderTop: '1px solid var(--border)'
    }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 12px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: '#EAF8EF',
            color: '#16A34A',
            fontSize: '12.5px',
            fontWeight: 700,
            marginBottom: '12px'
          }}>
            100% Direct Rates
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--dark)', marginBottom: '8px' }}>
            Know the price before you book.
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: 0 }}>
            Clear day-based pricing with no hidden platform fees. Pay your craftsman directly.
          </p>
        </div>

        {/* 4 Clean Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          marginBottom: '28px'
        }} className="hl-pricing-grid">
          {PRICING_CARDS.map((card) => {
            const Icon = card.Icon;
            return (
              <div
                key={card.service}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: card.bg,
                    color: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px'
                  }}>
                    <Icon size={20} strokeWidth={2.3} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--dark)', marginBottom: '6px' }}>
                    {card.service}
                  </h3>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--dark)', marginBottom: '8px' }}>
                    {card.range}
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>
                      {card.unit}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                    {card.desc}
                  </p>
                </div>

                <div style={{
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid #F3ECE2',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12.5px',
                  color: '#16A34A',
                  fontWeight: 600
                }}>
                  <Check size={14} strokeWidth={2.5} />
                  <span>No commission added</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footnote */}
        <div style={{
          textAlign: 'center',
          fontSize: '13px',
          color: 'var(--text-muted)'
        }}>
          Prices vary by job scope and location. Confirm exact estimate directly with your craftsman.
        </div>
      </div>
    </section>
  );
}
