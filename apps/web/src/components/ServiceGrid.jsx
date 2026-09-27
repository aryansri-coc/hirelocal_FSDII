import React from 'react';
import { Zap, Droplets, Wrench, Hammer, Paintbrush, Sparkles, Tv, Layers } from 'lucide-react';

const SERVICE_ICONS = {
  'electrician': Zap,
  'plumber': Droplets,
  'ac-repair': Wrench,
  'carpenter': Hammer,
  'painter': Paintbrush,
  'cleaning': Sparkles,
  'appliance-repair': Tv
};

export default function ServiceGrid({ services, selectedService, onSelectService }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '2px' }}>Service Categories</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Select a trade to view available professionals and day-based pricing.
          </p>
        </div>
        {selectedService && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onSelectService(null)}
          >
            Show All
          </button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '12px'
      }}>
        {services.map((srv) => {
          const isSelected = selectedService === srv.name;
          const IconComponent = SERVICE_ICONS[srv.slug] || Layers;

          return (
            <div
              key={srv.service_id}
              onClick={() => onSelectService(isSelected ? null : srv.name)}
              className="card"
              style={{
                padding: '16px 14px',
                textAlign: 'left',
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                boxShadow: isSelected ? '0 0 0 1px var(--primary)' : 'var(--shadow-sm)'
              }}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface-alt)',
                color: isSelected ? '#FFFFFF' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px'
              }}>
                <IconComponent size={18} />
              </div>
              <div style={{
                fontWeight: 600,
                fontSize: '14px',
                color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                marginBottom: '2px'
              }}>
                {srv.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Verified pros
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
