import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import { Wrench, Menu, X, User, LogOut, CheckCircle, ShieldCheck, Briefcase } from 'lucide-react';

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
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              textDecoration: 'none'
            }}
            onClick={() => navigateTo(isAuthenticated ? (role === 'worker' ? 'worker_dashboard' : role === 'admin' ? 'admin_dashboard' : 'customer_dashboard') : 'landing')}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Wrench size={20} strokeWidth={2.2} />
            </div>
            <span style={{
              fontSize: '20px',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em'
            }}>
              HireLocal
            </span>
          </div>

          {/* CENTER: Navigation Links */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px'
          }} className="desktop-nav">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => navigateTo('explore')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-family)',
                    fontSize: '15px',
                    fontWeight: activeTab === 'explore' ? 600 : 500,
                    color: activeTab === 'explore' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Find Workers
                </button>
                <button
                  onClick={() => navigateTo('landing')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-family)',
                    fontSize: '15px',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  How It Works
                </button>
                <button
                  onClick={onOpenWorkerOnboard}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-family)',
                    fontSize: '15px',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  For Workers
                </button>
                <button
                  onClick={() => navigateTo('callbot_info')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-family)',
                    fontSize: '15px',
                    fontWeight: activeTab === 'callbot_info' ? 600 : 500,
                    color: activeTab === 'callbot_info' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  CallBot
                </button>
              </>
            ) : role === 'customer' ? (
              <>
                <button
                  onClick={() => navigateTo('customer_dashboard')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-family)',
                    fontSize: '15px',
                    fontWeight: activeTab === 'customer_dashboard' ? 600 : 500,
                    color: activeTab === 'customer_dashboard' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigateTo('explore')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-family)',
                    fontSize: '15px',
                    fontWeight: activeTab === 'explore' ? 600 : 500,
                    color: activeTab === 'explore' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Find Workers
                </button>
                <button
                  onClick={() => navigateTo('customer_bookings')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-family)',
                    fontSize: '15px',
                    fontWeight: activeTab === 'customer_bookings' ? 600 : 500,
                    color: activeTab === 'customer_bookings' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  My Bookings
                </button>
                <button
                  onClick={() => navigateTo('customer_profile')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-family)',
                    fontSize: '15px',
                    fontWeight: activeTab === 'customer_profile' ? 600 : 500,
                    color: activeTab === 'customer_profile' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Profile
                </button>
              </>
            ) : role === 'worker' ? (
              <>
                <button
                  onClick={() => navigateTo('worker_dashboard')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-family)',
                    fontSize: '15px',
                    fontWeight: activeTab === 'worker_dashboard' ? 600 : 500,
                    color: activeTab === 'worker_dashboard' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigateTo('worker_requests')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-family)',
                    fontSize: '15px',
                    fontWeight: activeTab === 'worker_requests' ? 600 : 500,
                    color: activeTab === 'worker_requests' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Job Requests
                </button>
                <button
                  onClick={() => navigateTo('worker_jobs')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-family)',
                    fontSize: '15px',
                    fontWeight: activeTab === 'worker_jobs' ? 600 : 500,
                    color: activeTab === 'worker_jobs' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  My Jobs
                </button>
                <button
                  onClick={() => navigateTo('worker_profile')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-family)',
                    fontSize: '15px',
                    fontWeight: activeTab === 'worker_profile' ? 600 : 500,
                    color: activeTab === 'worker_profile' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Rates & Profile
                </button>
              </>
            ) : role === 'admin' ? (
              <>
                <button
                  onClick={() => navigateTo('admin_dashboard')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-family)',
                    fontSize: '15px',
                    fontWeight: activeTab === 'admin_dashboard' ? 600 : 500,
                    color: activeTab === 'admin_dashboard' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Admin Overview
                </button>
                <button
                  onClick={() => navigateTo('admin_users')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-family)',
                    fontSize: '15px',
                    fontWeight: activeTab === 'admin_users' ? 600 : 500,
                    color: activeTab === 'admin_users' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Users
                </button>
                <button
                  onClick={() => navigateTo('admin_workers')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-family)',
                    fontSize: '15px',
                    fontWeight: activeTab === 'admin_workers' ? 600 : 500,
                    color: activeTab === 'admin_workers' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Workers
                </button>
                <button
                  onClick={() => navigateTo('admin_jobs')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-family)',
                    fontSize: '15px',
                    fontWeight: activeTab === 'admin_jobs' ? 600 : 500,
                    color: activeTab === 'admin_jobs' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Jobs
                </button>
              </>
            ) : null}
          </nav>

          {/* RIGHT: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!isAuthenticated ? (
              <>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenLogin}
                >
                  Log In
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={onOpenSignup}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <NotificationDropdown onSelectNotification={(n) => {
                  if (role === 'customer') navigateTo('customer_bookings');
                  else if (role === 'worker') navigateTo('worker_requests');
                }} />

                {/* Clean User Profile Tag */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 10px 4px 6px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface-alt)'
                }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700
                  }}>
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {user?.name?.split(' ')[0]}
                  </span>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => logout(true)}
                  title="Sign Out"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </>
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
              onClick={() => navigateTo('callbot_info')}
              style={{ justifyContent: 'flex-start' }}
            >
              CallBot
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
