import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import { Home, MapPin, Bell, ChevronDown, Wrench, Menu, X, User, LogOut, CheckCircle, ShieldCheck, Briefcase } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenLogin,
  onOpenSignup,
  onOpenWorkerOnboard
}) {
  const {
    user,
    worker,
    isAuthenticated,
    demoMode,
    toggleDemoMode,
    demoAccounts,
    selectDemoAccount,
    logout
  } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = user?.role || 'public';

  const navigateTo = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Dev Mode Persona Switcher - Only visible when toggled by developer/evaluator */}
      {demoMode && (
        <div style={{
          backgroundColor: '#FFFBEB',
          color: '#92400E',
          padding: '8px 24px',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #FCD34D'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 700 }}>Testing Mode Active:</span>
            <span>Switch Persona:</span>
            <select
              style={{
                backgroundColor: '#FFFFFF',
                color: '#111827',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
              value={user?.user_id || ''}
              onChange={(e) => {
                const acc = demoAccounts.find((d) => d.user_id === e.target.value);
                if (acc) selectDemoAccount(acc);
              }}
            >
              {demoAccounts.map((d) => (
                <option key={d.user_id} value={d.user_id}>
                  {d.name} ({d.role === 'worker' ? `${d.profession} • ${d.communication_type === 'non_smartphone' ? 'CallBot' : 'App'}` : d.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={toggleDemoMode}
            style={{
              background: 'none',
              border: 'none',
              color: '#B45309',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            Exit Testing Mode
          </button>
        </div>
      )}

      {/* Main Clean Navbar (64-72px height, white surface, subtle bottom border) */}
      <header style={{
        height: '68px',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="container" style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* LEFT: Logo + Wordmark */}
          <div
            className="hl-brand-logo"
            onClick={() => navigateTo('landing')}
          >
            <div className="hl-brand-icon">
              <Home size={19} strokeWidth={2.5} />
            </div>
            <span className="hl-brand-name">
              Hire<span>Local</span>
            </span>
          </div>

          {/* CENTER: Navigation Links */}
          <nav className="hl-center-nav desktop-nav">
            <button
              type="button"
              onClick={() => navigateTo('explore')}
              className={`hl-nav-link ${activeTab === 'explore' ? 'is-active' : ''}`}
            >
              Find Workers
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'landing') {
                  const el = document.getElementById('how-it-works-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  navigateTo('landing');
                  setTimeout(() => {
                    const el = document.getElementById('how-it-works-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }
              }}
              className="hl-nav-link"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => navigateTo('customer_bookings')}
              className={`hl-nav-link ${activeTab === 'customer_bookings' ? 'is-active' : ''}`}
            >
              My Bookings
            </button>
            <button
              type="button"
              onClick={() => navigateTo('messages')}
              className={`hl-nav-link ${activeTab === 'messages' ? 'is-active' : ''}`}
            >
              Messages
            </button>
          </nav>

          {/* RIGHT: Location, Notifications, Profile */}
          <div className="hl-nav-right-actions">
            {/* Location Selector */}
            <div
              className="hl-location-pill"
              onClick={() => navigateTo('explore')}
              title="Change search location"
            >
              <MapPin size={14} style={{ color: 'var(--primary)' }} />
              <span>Govindpura, Bihar</span>
              <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
            </div>

            {/* Notification Bell */}
            <NotificationDropdown onSelectNotification={(n) => {
              if (role === 'customer') navigateTo('customer_bookings');
              else if (role === 'worker') navigateTo('worker_requests');
            }} />

            {/* User Profile Chip */}
            <div
              className="hl-profile-chip"
              onClick={() => {
                if (!isAuthenticated) onOpenLogin();
                else navigateTo(role === 'worker' ? 'worker_dashboard' : role === 'admin' ? 'admin_dashboard' : 'customer_profile');
              }}
              title={isAuthenticated ? 'Account Profile' : 'Click to Log In'}
            >
              <div className="hl-profile-avatar-char">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--dark)' }}>
                {user?.name ? user.name.split(' ')[0] : 'Aryan'}
              </span>
              <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
            </div>

            {isAuthenticated && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => logout(true)}
                title="Sign Out"
                style={{ padding: '6px 10px', height: '34px' }}
              >
                <LogOut size={14} />
              </button>
            )}

            {/* Subtle Dev Testing Button */}
            <button
              onClick={toggleDemoMode}
              title={demoMode ? 'Exit Testing Mode' : 'Toggle Testing Mode'}
              style={{
                background: 'none',
                border: 'none',
                color: demoMode ? 'var(--warning)' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Wrench size={16} />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              className="mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-main)',
                cursor: 'pointer',
                display: 'none',
                padding: '6px'
              }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '68px',
            left: 0,
            right: 0,
            backgroundColor: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: 'var(--shadow-md)'
          }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigateTo('explore')}
              style={{ justifyContent: 'flex-start' }}
            >
              Find Workers
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigateTo('landing')}
              style={{ justifyContent: 'flex-start' }}
            >
              How It Works
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => { onOpenWorkerOnboard(); setMobileMenuOpen(false); }}
              style={{ justifyContent: 'flex-start' }}
            >
              For Workers
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigateTo('messages')}
              style={{ justifyContent: 'flex-start' }}
            >
              Messages
            </button>
          </div>
        )}
      </header>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
