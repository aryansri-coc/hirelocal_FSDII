import React, { useState, useEffect } from 'react';
import PincodeAddressSelector from './PincodeAddressSelector';
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
      } else if (typeof currentLocation === 'string') {
        setSelectedLoc(currentLocation);
      }
    }
  }, [currentLocation]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (onSearch) {
      onSearch(searchInput, selectedLoc);
    }
  };

  const handleAddressPick = (addr) => {
    const label = `${addr.name || addr.locality} (${addr.pincode})`;
    setSelectedLoc(label);
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
              Electricians, plumbers, carpenters, AC technicians and more — available near you.
            </p>

            {/* Integrated Search Box */}
            <form onSubmit={handleSearchSubmit} className="hl-hero-unified-search">
              {/* Input Area */}
              <div className="hl-unified-input-col">
                <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  type="text"
                  className="hl-unified-input"
                  placeholder="What do you need help with?"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>

              {/* Divider */}
              <div className="hl-unified-divider"></div>

              {/* Location Selector */}
              <div style={{ position: 'relative' }}>
                <div
                  className="hl-unified-loc-col"
                  onClick={() => setIsLocDropdownOpen(!isLocDropdownOpen)}
                  title="Search location by PINCODE"
                >
                  <MapPin size={15} style={{ color: 'var(--primary)' }} />
                  <span>{selectedLoc || 'Select PINCODE'}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      color: 'var(--text-muted)',
                      transform: isLocDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s ease'
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
                      selectedPincode="462011"
                      onSelect={handleAddressPick}
                      onClose={() => setIsLocDropdownOpen(false)}
                      variant="popover"
                      title="Find Workers by PINCODE"
                    />
                  </div>
                )}
              </div>

              {/* Search Button */}
              <button type="submit" className="hl-unified-search-btn">
                Find Workers
              </button>
            </form>

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
              RIGHT COLUMN: Hero Electrician Photo Card
              ========================================================= */}
          <div className="hl-hero-visual-col">
            <div className="hl-hero-img-card">
              <img
                src="/electrician_hero.jpg"
                alt="Skilled Local Indian Electrician"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80';
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
