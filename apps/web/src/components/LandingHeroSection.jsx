import React, { useState, useEffect } from 'react';
import PincodeAddressSelector from './PincodeAddressSelector';
import PincodeGeographicMapCard from './PincodeGeographicMapCard';
import {
  Search,
  MapPin,
  ChevronDown,
  ShieldCheck,
  Tag,
  Phone,
  Users,
  Handshake,
  Check
} from 'lucide-react';

export default function LandingHeroSection({
  onSearch,
  onSelectLocation,
  currentLocation = 'MP Nagar (462011)'
}) {
  const [searchInput, setSearchInput] = useState('');
  const [pincodeInput, setPincodeInput] = useState(
    typeof currentLocation === 'object' && currentLocation?.pincode
      ? currentLocation.pincode
      : (typeof currentLocation === 'string' && currentLocation.match(/\d{6}/) ? currentLocation.match(/\d{6}/)[0] : '462011')
  );
  const [selectedLoc, setSelectedLoc] = useState(
    typeof currentLocation === 'object' && currentLocation?.pincode
      ? `${currentLocation.locality || currentLocation.name} (${currentLocation.pincode})`
      : (typeof currentLocation === 'string' ? currentLocation : 'MP Nagar (462011)')
  );
  const [isLocDropdownOpen, setIsLocDropdownOpen] = useState(false);

  useEffect(() => {
    if (currentLocation) {
      if (typeof currentLocation === 'object' && currentLocation.pincode) {
        setSelectedLoc(`${currentLocation.locality || currentLocation.name} (${currentLocation.pincode})`);
        setPincodeInput(currentLocation.pincode);
      } else if (typeof currentLocation === 'string') {
        setSelectedLoc(currentLocation);
        const match = currentLocation.match(/\d{6}/);
        if (match) setPincodeInput(match[0]);
      }
    }
  }, [currentLocation]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    let q = (searchInput || '').trim();
    let loc = selectedLoc;

    // Check if user entered a 6-digit PINcode directly in the service search bar
    const pinInQuery = q.match(/\b(\d{6})\b/);
    if (pinInQuery) {
      loc = pinInQuery[1];
      setPincodeInput(loc);
      q = q.replace(pinInQuery[0], '').trim();
    } else if (pincodeInput && /^\d{6}$/.test(pincodeInput.trim())) {
      loc = pincodeInput.trim();
    }

    if (onSearch) {
      onSearch(q, loc);
    }
  };

  const handleAddressPick = (addr) => {
    const label = `${addr.name || addr.locality} (${addr.pincode})`;
    setSelectedLoc(label);
    setPincodeInput(addr.pincode);
    setIsLocDropdownOpen(false);
    if (onSelectLocation) {
      onSelectLocation(addr);
    }
  };

  return (
    <section className="hl-landing-hero-section">
      <div className="container">
        <div className="hl-landing-hero-grid">
          {/* =========================================================
              LEFT COLUMN: Title, Subtitle, Search Bar, Benefit Pills
              ========================================================= */}
          <div>
            {/* Main Headline */}
            <h1 className="hl-hero-title-main" style={{ fontSize: 'clamp(38px, 4.2vw, 54px)', lineHeight: 1.12, letterSpacing: '-0.03em' }}>
              Find trusted local workers.<br />
              <span className="hl-hero-text-orange" style={{ color: 'var(--primary)' }}>Get the job done.</span>
            </h1>

            {/* Subtitle */}
            <p className="hl-hero-sub-text" style={{ fontSize: '16.5px', color: 'var(--text-secondary)', margin: '0 0 24px 0', lineHeight: 1.55 }}>
              Electricians, plumbers, carpenters, AC technicians and more — available in any Indian PINCODE.
            </p>

            {/* Integrated Search Box */}
            <form onSubmit={handleSearchSubmit} className="hl-hero-unified-search">
              {/* Input Area */}
              <div className="hl-unified-input-col">
                <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  type="text"
                  className="hl-unified-input"
                  placeholder="What service do you need? (e.g. Electrician, Plumber)..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>

              {/* Divider */}
              <div className="hl-unified-divider"></div>

              {/* Direct PINCODE / Location Input */}
              <div style={{ position: 'relative' }}>
                <div
                  className="hl-unified-loc-col"
                  style={{ cursor: 'text', minWidth: '180px' }}
                >
                  <MapPin size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <input
                    type="text"
                    value={pincodeInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPincodeInput(val);
                      if (val.length >= 3) {
                        setIsLocDropdownOpen(true);
                      }
                    }}
                    onFocus={() => setIsLocDropdownOpen(true)}
                    placeholder="PINCODE (e.g. 824101, 143410)"
                    maxLength={6}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      width: '130px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <ChevronDown
                    size={14}
                    style={{
                      color: 'var(--text-muted)',
                      transform: isLocDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s ease',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLocDropdownOpen(!isLocDropdownOpen);
                    }}
                  />
                </div>

                {/* PINCODE Locality Popover Dropdown */}
                {isLocDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '115%',
                    right: 0,
                    zIndex: 100,
                    minWidth: '340px'
                  }}>
                    <PincodeAddressSelector
                      selectedPincode={pincodeInput || '824101'}
                      onSelect={handleAddressPick}
                      onClose={() => setIsLocDropdownOpen(false)}
                      variant="popover"
                      title="All Addresses for PINCODE (API)"
                    />
                  </div>
                )}
              </div>

              {/* Search Button */}
              <button type="submit" className="hl-unified-search-btn">
                Find Workers
              </button>
            </form>

            {/* Quick PINCODE Shortcuts for instant testing (824101, 143410, etc.) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '-10px',
              marginBottom: '22px',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontWeight: 700, color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <MapPin size={12} /> Search PINCODE:
              </span>
              {[
                { pin: '824101', name: 'Bihar (824101)' },
                { pin: '143410', name: 'Punjab (143410)' },
                { pin: '462011', name: 'Bhopal (462011)' },
                { pin: '110001', name: 'Delhi (110001)' },
                { pin: '400058', name: 'Mumbai (400058)' }
              ].map((item) => (
                <button
                  key={item.pin}
                  type="button"
                  onClick={() => {
                    setPincodeInput(item.pin);
                    setSelectedLoc(item.name);
                    if (onSelectLocation) {
                      onSelectLocation({ pincode: item.pin, locality: item.name, label: item.name });
                    }
                    if (onSearch) {
                      onSearch(searchInput, item.pin);
                    }
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '999px',
                    backgroundColor: pincodeInput === item.pin ? '#EA580C' : '#F1F5F9',
                    color: pincodeInput === item.pin ? '#FFFFFF' : '#334155',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    transition: 'all 0.15s ease'
                  }}
                >
                  📍 {item.name}
                </button>
              ))}
            </div>

            {/* Subtle Search Suggestions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginTop: '-12px',
              marginBottom: '24px',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontWeight: 600 }}>Try:</span>
              {['fan installation', 'MCB repair', 'plumbing', 'switchboard'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setSearchInput(item);
                    if (onSearch) onSearch(item, selectedLoc);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* 4 Trust & Benefit Badges */}
            <div className="hl-hero-benefits-strip">
              {/* Badge 1: Verified Workers */}
              <div className="hl-benefit-chip">
                <div className="hl-benefit-icon-circle green">
                  <ShieldCheck size={14} strokeWidth={2.5} />
                </div>
                <span>Verified Workers</span>
              </div>

              {/* Badge 2: Affordable Rates */}
              <div className="hl-benefit-chip">
                <div className="hl-benefit-icon-circle orange">
                  <Tag size={13} strokeWidth={2.5} />
                </div>
                <span>Affordable Rates</span>
              </div>

              {/* Badge 3: Phone Booking Available */}
              <div className="hl-benefit-chip">
                <div className="hl-benefit-icon-circle orange">
                  <Phone size={13} strokeWidth={2.5} />
                </div>
                <span>Phone Booking Available</span>
              </div>

              {/* Badge 4: Local & Reliable */}
              <div className="hl-benefit-chip">
                <div className="hl-benefit-icon-circle orange">
                  <Handshake size={14} strokeWidth={2.5} />
                </div>
                <span>Local & Reliable</span>
              </div>
            </div>
          </div>

          {/* =========================================================
              RIGHT COLUMN: Geographic View & Hyperlocal Pro Radar Map
              Replaces static photo with dynamic area map of searched PINCODE
              ========================================================= */}
          <div className="hl-hero-visual-col">
            <PincodeGeographicMapCard
              pincode={pincodeInput || '824101'}
              locationLabel={selectedLoc}
              onSelectLocality={(addr) => {
                handleAddressPick(addr);
              }}
              onExplorePros={(pin) => {
                if (onSearch) {
                  onSearch(searchInput, pin);
                } else {
                  const el = document.getElementById('find-workers-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              activeTradeName={searchInput || 'Electrician'}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
