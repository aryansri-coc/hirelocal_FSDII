import React from 'react';
import { Home } from 'lucide-react';

export default function Footer({
  onFindWorker,
  onHowItWorks,
  onMyBookings,
  onJoinWorker,
  onWorkerDashboard,
  onVoiceBooking
}) {
  return (
    <footer style={{
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid var(--border)',
      padding: '56px 0 32px'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.8fr 1fr 1fr 1fr',
          gap: '48px',
          marginBottom: '40px'
        }} className="hl-footer-grid">
          {/* Column 1: Brand Info */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}>
                <Home size={17} strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--dark)' }}>
                Hire<span style={{ color: 'var(--primary)' }}>Local</span>
              </span>
            </div>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: '320px',
              margin: 0
            }}>
              A modern hyperlocal marketplace connecting verified local electricians, plumbers, and skilled wage craftsmen directly with households.
            </p>
          </div>

          {/* Column 2: For Customers */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dark)', marginBottom: '14px' }}>
              For Customers
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <button type="button" onClick={onFindWorker} style={{ textAlign: 'left', color: 'inherit' }}>
                Find Workers
              </button>
              <button type="button" onClick={onHowItWorks} style={{ textAlign: 'left', color: 'inherit' }}>
                How It Works
              </button>
              <button type="button" onClick={onMyBookings} style={{ textAlign: 'left', color: 'inherit' }}>
                My Bookings
              </button>
            </div>
          </div>

          {/* Column 3: For Workers */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dark)', marginBottom: '14px' }}>
              For Workers
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <button type="button" onClick={onJoinWorker} style={{ textAlign: 'left', color: 'inherit' }}>
                Join HireLocal
              </button>
              <button type="button" onClick={onWorkerDashboard} style={{ textAlign: 'left', color: 'inherit' }}>
                Worker Dashboard
              </button>
              <button type="button" onClick={onVoiceBooking} style={{ textAlign: 'left', color: 'inherit' }}>
                Voice Booking
              </button>
            </div>
          </div>

          {/* Column 4: Company */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dark)', marginBottom: '14px' }}>
              Company
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <button type="button" onClick={onFindWorker} style={{ textAlign: 'left', color: 'inherit' }}>
                About Us
              </button>
              <button type="button" onClick={onFindWorker} style={{ textAlign: 'left', color: 'inherit' }}>
                Contact
              </button>
              <button type="button" onClick={onFindWorker} style={{ textAlign: 'left', color: 'inherit' }}>
                Privacy Policy
              </button>
              <button type="button" onClick={onFindWorker} style={{ textAlign: 'left', color: 'inherit' }}>
                Terms of Service
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '13px',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>© {new Date().getFullYear()} HireLocal Technologies Pvt. Ltd. All rights reserved.</div>
          <div>Hyperlocal Community Services</div>
        </div>
      </div>
    </footer>
  );
}
