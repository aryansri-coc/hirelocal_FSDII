import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import PincodeAddressSelector from './PincodeAddressSelector';
import {
  Home,
  MapPin,
  ChevronDown,
  Wrench,
  Menu,
  X,
  User,
  LogOut,
  CheckCircle,
  Briefcase,
  Calendar,
  MessageSquare,
  LayoutDashboard,
  Check,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenLogin,
  onOpenSignup,
  onOpenWorkerOnboard,
  selectedCity = 'Bhopal',
  onSelectCity,
  selectedLocation,
  onSelectLocation
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
  const [isLocDropdownOpen, setIsLocDropdownOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [currentLocLabel, setCurrentLocLabel] = useState(
    selectedLocation?.pincode
      ? `${selectedLocation.locality || selectedLocation.name} (${selectedLocation.pincode})`
      : 'MP Nagar (462011)'
  );

  const locDropdownRef = useRef(null);
  const profileMenuRef = useRef(null);

  const role = user?.role || 'public';

  // Sync location label if selectedLocation or selectedCity changes
  useEffect(() => {
    if (selectedLocation) {
      const pin = selectedLocation.pincode ? ` (${selectedLocation.pincode})` : '';
      const name = selectedLocation.locality || selectedLocation.name || selectedLocation.district || 'Location';
      setCurrentLocLabel(`${name}${pin}`);
    } else if (selectedCity) {
      setCurrentLocLabel(`${selectedCity}`);
    }
  }, [selectedLocation, selectedCity]);

  // Click outside listener to dismiss popovers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locDropdownRef.current && !locDropdownRef.current.contains(event.target)) {
        setIsLocDropdownOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navigateTo = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  const handleSelectLoc = (loc) => {
    const pin = loc.pincode ? ` (${loc.pincode})` : '';
    const name = loc.locality || loc.name || loc.district || 'Location';
    setCurrentLocLabel(`${name}${pin}`);
    setIsLocDropdownOpen(false);
    if (onSelectLocation) {
      onSelectLocation(loc);
    }
    if (onSelectCity) {
      onSelectCity(loc.district || loc.city || 'Bhopal');
    }
  };

  const scrollToSection = (sectionId) => {
    if (activeTab === 'landing') {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigateTo('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  };

  return (
    <>
      {/* Dev Mode Persona Switcher - Only visible when toggled */}
      {demoMode && (
        <div className="hl-testing-banner">
          <div className="hl-testing-banner-left">
            <span className="hl-testing-badge">
              <Wrench size={13} />
              Testing Mode Active:
            </span>
            <span className="hl-testing-label">Switch Persona:</span>
            <select
              className="hl-testing-select"
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
            className="hl-testing-exit-btn"
          >
            Exit Testing Mode
          </button>
        </div>
      )}

      {/* Main Sticky Navbar (70px height, blur surface, crisp border) */}
      <header className="hl-main-header">
        <div className="container hl-header-inner">
          {/* LEFT: Logo & Wordmark */}
          <div
            className="hl-brand-logo"
            onClick={() => navigateTo(isAuthenticated && role === 'worker' ? 'worker_dashboard' : 'landing')}
            title="HireLocal Home"
          >
            <div className="hl-brand-icon">
              <Home size={20} strokeWidth={2.5} />
            </div>
            <div className="hl-brand-name">
              Hire<span>Local</span>
            </div>
            <span className="hl-brand-tagline">Hyperlocal</span>
          </div>

          {/* CENTER: Navigation Links Adaptive to Role */}
          <nav className="hl-center-nav">
            {/* Guest / Public Links */}
            {!isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={() => scrollToSection('find-workers-section')}
                  className="hl-nav-link"
                >
                  Find Workers
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('how-it-works-section')}
                  className="hl-nav-link"
                >
                  How It Works
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('popular-services-section')}
                  className="hl-nav-link"
                >
                  Services
                </button>
              </>
            )}

            {/* Customer Links */}
            {isAuthenticated && role === 'customer' && (
              <>
                <button
                  type="button"
                  onClick={() => navigateTo('explore')}
                  className={`hl-nav-link ${activeTab === 'explore' ? 'is-active' : ''}`}
                >
                  Find Workers
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
                <button
                  type="button"
                  onClick={() => navigateTo('customer_dashboard')}
                  className={`hl-nav-link ${activeTab === 'customer_dashboard' ? 'is-active' : ''}`}
                >
                  Dashboard
                </button>
              </>
            )}

            {/* Worker Links */}
            {isAuthenticated && role === 'worker' && (
              <>
                <button
                  type="button"
                  onClick={() => navigateTo('worker_dashboard')}
                  className={`hl-nav-link ${activeTab === 'worker_dashboard' ? 'is-active' : ''}`}
                >
                  Worker Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('messages')}
                  className={`hl-nav-link ${activeTab === 'messages' ? 'is-active' : ''}`}
                >
                  Messages
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('explore')}
                  className={`hl-nav-link ${activeTab === 'explore' ? 'is-active' : ''}`}
                >
                  Find Workers
                </button>
              </>
            )}

            {/* Admin Links */}
            {isAuthenticated && role === 'admin' && (
              <>
                <button
                  type="button"
                  onClick={() => navigateTo('admin_dashboard')}
                  className={`hl-nav-link ${activeTab === 'admin_dashboard' ? 'is-active' : ''}`}
                >
                  Admin Console
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('explore')}
                  className={`hl-nav-link ${activeTab === 'explore' ? 'is-active' : ''}`}
                >
                  Find Workers
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('messages')}
                  className={`hl-nav-link ${activeTab === 'messages' ? 'is-active' : ''}`}
                >
                  Messages
                </button>
              </>
            )}
          </nav>

          {/* RIGHT: Location, Auth / Profile, Testing Mode & Hamburger */}
          <div className="hl-nav-right-actions">
            {/* Location Selector Pill & Dropdown Popover */}
            <div className="hl-location-pill-wrap" ref={locDropdownRef}>
              <div
                className={`hl-location-pill ${isLocDropdownOpen ? 'is-open' : ''}`}
                onClick={() => setIsLocDropdownOpen(!isLocDropdownOpen)}
                title="Select Hub Location"
              >
                <MapPin size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>{currentLocLabel}</span>
                <ChevronDown
                  size={13}
                  style={{
                    color: 'var(--text-muted)',
                    transform: isLocDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease'
                  }}
                />
              </div>

              {/* Location Popover */}
              {isLocDropdownOpen && (
                <div className="hl-pincode-popover-container">
                  <PincodeAddressSelector
                    selectedPincode={selectedLocation?.pincode || '462011'}
                    selectedAddress={selectedLocation}
                    onSelect={handleSelectLoc}
                    onClose={() => setIsLocDropdownOpen(false)}
                    variant="popover"
                    title="Select Service Location by PINCODE"
                  />
                </div>
              )}
            </div>

            {/* When NOT Authenticated: Join as Worker + Sign In + Register */}
            {!isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="hl-worker-cta-btn"
                  onClick={onOpenWorkerOnboard}
                  title="Register as a local service professional"
                >
                  <Briefcase size={14} />
                  <span>Join as Pro</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenLogin}
                  style={{ padding: '6px 14px', height: '36px', fontWeight: 600 }}
                >
                  Sign In
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onOpenSignup}
                  style={{ padding: '6px 16px', height: '36px', fontWeight: 700 }}
                >
                  Register
                </button>
              </div>
            ) : (
              /* When Authenticated: Notification Bell + User Profile Chip & Dropdown */
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* For customer users: subtle quick CTA to become a worker if not yet */}
                {role === 'customer' && (
                  <button
                    type="button"
                    className="hl-worker-cta-btn"
                    onClick={onOpenWorkerOnboard}
                    title="Register as a skilled technician"
                  >
                    <Briefcase size={14} />
                    <span>Join as Pro</span>
                  </button>
                )}

                {/* Notifications Bell */}
                <NotificationDropdown
                  onSelectNotification={(n) => {
                    if (role === 'customer') navigateTo('customer_bookings');
                    else if (role === 'worker') navigateTo('worker_dashboard');
                    else navigateTo('admin_dashboard');
                  }}
                />

                {/* Interactive Profile Chip */}
                <div className="hl-profile-chip-wrap" ref={profileMenuRef}>
                  <div
                    className={`hl-profile-chip ${isProfileMenuOpen ? 'is-open' : ''}`}
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    title="Account Menu"
                  >
                    <div className="hl-profile-avatar-char">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>

                    <span className="hl-profile-name-text">
                      {user?.name ? user.name.split(' ')[0] : 'User'}
                    </span>

                    <span className={`hl-role-pill-tiny role-${role}`}>
                      {role === 'worker' ? 'Pro' : role}
                    </span>

                    <ChevronDown
                      size={13}
                      style={{
                        color: 'var(--text-muted)',
                        transform: isProfileMenuOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.15s ease'
                      }}
                    />
                  </div>

                  {/* Profile Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div className="hl-user-dropdown-menu">
                      <div className="hl-user-dropdown-header">
                        <div className="hl-user-dropdown-name">
                          <span>{user?.name || 'User'}</span>
                          <span className={`hl-role-pill-tiny role-${role}`}>
                            {role.toUpperCase()}
                          </span>
                        </div>
                        <div className="hl-user-dropdown-sub">
                          {user?.phone || user?.email || 'Logged In'}
                        </div>
                      </div>

                      {role === 'customer' && (
                        <>
                          <button
                            type="button"
                            className="hl-user-dropdown-item"
                            onClick={() => navigateTo('customer_dashboard')}
                          >
                            <LayoutDashboard size={15} style={{ color: 'var(--primary)' }} />
                            <span>Dashboard Overview</span>
                          </button>
                          <button
                            type="button"
                            className="hl-user-dropdown-item"
                            onClick={() => navigateTo('customer_bookings')}
                          >
                            <Calendar size={15} style={{ color: '#2563EB' }} />
                            <span>My Bookings</span>
                          </button>
                          <button
                            type="button"
                            className="hl-user-dropdown-item"
                            onClick={() => navigateTo('customer_profile')}
                          >
                            <User size={15} style={{ color: '#16A34A' }} />
                            <span>Profile & Settings</span>
                          </button>
                        </>
                      )}

                      {role === 'worker' && (
                        <>
                          <button
                            type="button"
                            className="hl-user-dropdown-item"
                            onClick={() => navigateTo('worker_dashboard')}
                          >
                            <LayoutDashboard size={15} style={{ color: 'var(--primary)' }} />
                            <span>Worker Dashboard</span>
                          </button>
                          <button
                            type="button"
                            className="hl-user-dropdown-item"
                            onClick={() => navigateTo('messages')}
                          >
                            <MessageSquare size={15} style={{ color: '#2563EB' }} />
                            <span>Customer Messages</span>
                          </button>
                        </>
                      )}

                      {role === 'admin' && (
                        <button
                          type="button"
                          className="hl-user-dropdown-item"
                          onClick={() => navigateTo('admin_dashboard')}
                        >
                          <ShieldCheck size={15} style={{ color: '#7E22CE' }} />
                          <span>Admin Console</span>
                        </button>
                      )}

                      <div className="hl-user-dropdown-divider" />

                      <button
                        type="button"
                        className="hl-user-dropdown-item danger"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          logout(true);
                        }}
                      >
                        <LogOut size={15} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Direct Logout Icon Button */}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => logout(true)}
                  title="Sign Out"
                  style={{ padding: '6px 10px', height: '36px' }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            )}

            {/* Dev Mode Toggle Wrench */}
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
                justifyContent: 'center',
                borderRadius: '6px'
              }}
            >
              <Wrench size={16} />
            </button>

            {/* Mobile Hamburger Menu Button */}
            <button
              className="mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="hl-mobile-menu-drawer">
            {/* Quick Hub Selector on Mobile */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '10px 12px',
              backgroundColor: 'var(--surface-alt)',
              borderRadius: '10px',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                  <MapPin size={14} style={{ color: 'var(--primary)' }} />
                  <span>PINCODE: {currentLocLabel}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLocDropdownOpen(!isLocDropdownOpen)}
                  style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '12px' }}
                >
                  {isLocDropdownOpen ? 'Close' : 'Change PINCODE'}
                </button>
              </div>

              {isLocDropdownOpen && (
                <div style={{ marginTop: '6px' }}>
                  <PincodeAddressSelector
                    selectedPincode={selectedLocation?.pincode || '462011'}
                    selectedAddress={selectedLocation}
                    onSelect={(addr) => {
                      handleSelectLoc(addr);
                      setMobileMenuOpen(false);
                    }}
                    onClose={() => setIsLocDropdownOpen(false)}
                    variant="inline"
                    title="Select PINCODE Locality"
                  />
                </div>
              )}
            </div>

            {/* Mobile Nav Links */}
            <div className="hl-mobile-nav-group">
              <button
                type="button"
                className="hl-mobile-nav-btn"
                onClick={() => {
                  scrollToSection('find-workers-section');
                  setMobileMenuOpen(false);
                }}
              >
                <span>Find Workers</span>
              </button>

              <button
                type="button"
                className={`hl-mobile-nav-btn ${activeTab === 'landing' ? 'is-active' : ''}`}
                onClick={() => scrollToSection('how-it-works-section')}
              >
                <span>How It Works</span>
              </button>

              {isAuthenticated && role === 'customer' && (
                <>
                  <button
                    type="button"
                    className={`hl-mobile-nav-btn ${activeTab === 'customer_bookings' ? 'is-active' : ''}`}
                    onClick={() => navigateTo('customer_bookings')}
                  >
                    <span>My Bookings</span>
                    <CheckCircle size={15} style={{ opacity: activeTab === 'customer_bookings' ? 1 : 0 }} />
                  </button>
                  <button
                    type="button"
                    className={`hl-mobile-nav-btn ${activeTab === 'messages' ? 'is-active' : ''}`}
                    onClick={() => navigateTo('messages')}
                  >
                    <span>Messages</span>
                    <CheckCircle size={15} style={{ opacity: activeTab === 'messages' ? 1 : 0 }} />
                  </button>
                  <button
                    type="button"
                    className={`hl-mobile-nav-btn ${activeTab === 'customer_dashboard' ? 'is-active' : ''}`}
                    onClick={() => navigateTo('customer_dashboard')}
                  >
                    <span>Dashboard</span>
                    <CheckCircle size={15} style={{ opacity: activeTab === 'customer_dashboard' ? 1 : 0 }} />
                  </button>
                </>
              )}

              {isAuthenticated && role === 'worker' && (
                <>
                  <button
                    type="button"
                    className={`hl-mobile-nav-btn ${activeTab === 'worker_dashboard' ? 'is-active' : ''}`}
                    onClick={() => navigateTo('worker_dashboard')}
                  >
                    <span>Worker Dashboard</span>
                    <CheckCircle size={15} style={{ opacity: activeTab === 'worker_dashboard' ? 1 : 0 }} />
                  </button>
                  <button
                    type="button"
                    className={`hl-mobile-nav-btn ${activeTab === 'messages' ? 'is-active' : ''}`}
                    onClick={() => navigateTo('messages')}
                  >
                    <span>Messages</span>
                    <CheckCircle size={15} style={{ opacity: activeTab === 'messages' ? 1 : 0 }} />
                  </button>
                </>
              )}
            </div>

            {/* Mobile Auth / Profile CTAs */}
            {!isAuthenticated ? (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    onOpenWorkerOnboard();
                    setMobileMenuOpen(false);
                  }}
                  style={{ width: '100%', gap: '8px', color: '#92400E', borderColor: '#FCD34D', backgroundColor: '#FEF3C7' }}
                >
                  <Briefcase size={16} />
                  <span>Join as Skilled Worker</span>
                </button>

                <div className="hl-mobile-auth-row">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      onOpenLogin();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      onOpenSignup();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Register
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="hl-profile-avatar-char">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>{user?.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{role.toUpperCase()}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout(true);
                    }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
}
