import React from 'react';
import {
  Zap,
  Droplets,
  Hammer,
  Wind,
  Paintbrush,
  Layers,
  Wrench,
  LayoutGrid,
  ArrowRight
} from 'lucide-react';

export const POPULAR_SERVICES_8 = [
  {
    id: 'electrician',
    name: 'Electrician',
    desc: 'Wiring, MCB & switches',
    Icon: Zap,
    color: '#F45B0A',
    bg: '#FFF1E8'
  },
  {
    id: 'plumber',
    name: 'Plumber',
    desc: 'Pipes, leakage & taps',
    Icon: Droplets,
    color: '#0284C7',
    bg: '#F0F9FF'
  },
  {
    id: 'carpenter',
    name: 'Carpenter',
    desc: 'Woodwork & furniture',
    Icon: Hammer,
    color: '#D97706',
    bg: '#FEF3C7'
  },
  {
    id: 'ac_mechanic',
    name: 'AC Mechanic',
    desc: 'Cooling, gas & service',
    Icon: Wind,
    color: '#0D9488',
    bg: '#F0FDFA'
  },
  {
    id: 'painter',
    name: 'Painter',
    desc: 'Interior & exterior walls',
    Icon: Paintbrush,
    color: '#EA580C',
    bg: '#FFF7ED'
  },
  {
    id: 'mason',
    name: 'Mason',
    desc: 'Brickwork & plastering',
    Icon: Layers,
    color: '#C2410C',
    bg: '#FFF1E8'
  },
  {
    id: 'appliance_repair',
    name: 'Appliance Repair',
    desc: 'Washing machines & geysers',
    Icon: Wrench,
    color: '#475569',
    bg: '#F8FAFC'
  },
  {
    id: 'more_services',
    name: 'More Services',
    desc: 'Browse all 18+ categories',
    Icon: LayoutGrid,
    color: '#475569',
    bg: '#F8FAFC'
  }
];

export default function PopularServicesGrid({
  onSelectService,
  onViewAll
}) {
  return (
    <section className="hl-popular-services-section">
      <div className="container">
        {/* Header Row: Title on Left, View All link on Right */}
        <div className="hl-services-header-row">
          <div>
            <h2 className="hl-services-main-title">Popular Services</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Handpicked verified professionals available for booking today
            </p>
          </div>
          <button
            type="button"
            className="hl-services-view-all-link"
            onClick={onViewAll}
          >
            <span>View All</span>
            <ArrowRight size={15} />
          </button>
        </div>

        {/* 8 Cards Grid (4x2) */}
        <div className="hl-services-8grid">
          {POPULAR_SERVICES_8.map((item) => {
            const Icon = item.Icon;
            return (
              <div
                key={item.id}
                className="hl-service-item-card"
                onClick={() => {
                  if (item.id === 'more_services') {
                    if (onViewAll) onViewAll();
                  } else if (onSelectService) {
                    onSelectService(item.name);
                  }
                }}
              >
                <div
                  className="hl-service-icon-box"
                  style={{ backgroundColor: item.bg, color: item.color }}
                >
                  <Icon size={22} strokeWidth={2.2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="hl-service-card-label">
                    {item.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
