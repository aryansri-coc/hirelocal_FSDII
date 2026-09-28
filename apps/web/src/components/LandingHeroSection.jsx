import React, { useState } from 'react';
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

const CITIES = [
  'Govindpura, Bihar',
  'Boring Road, Patna',
  'Kankarbagh, Patna',
  'Rajendra Nagar, Patna',
  'Muzaffarpur, Bihar',
  'Gaya, Bihar',
  'MP Nagar, Bhopal',
  'Vijay Nagar, Indore'
];

export default function LandingHeroSection({
  onSearch,
  onSelectLocation,
  currentLocation = 'Govindpura, Bihar'
}) {
  const [searchInput, setSearchInput] = useState('');
  const [selectedLoc, setSelectedLoc] = useState(currentLocation);
  const [isLocDropdownOpen, setIsLocDropdownOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (onSearch) {
      onSearch(searchInput, selectedLoc);
    }
  };

  const handleCityPick = (city) => {
    setSelectedLoc(city);
    setIsLocDropdownOpen(false);
    if (onSelectLocation) {
      onSelectLocation(city);
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
                >
                  <MapPin size={15} style={{ color: 'var(--primary)' }} />
                  <span>{selectedLoc || 'Your location'}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      color: 'var(--text-muted)',
                      transform: isLocDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s ease'
                    }}
                  />
                </div>

                {/* Locality Popover Dropdown */}
                {isLocDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '110%',
                    right: 0,
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid #E5E7EB',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12)',
                    minWidth: '220px',
                    zIndex: 50,
                    padding: '6px',
                    animation: 'hlFadeScale 0.15s ease'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', padding: '6px 10px', textTransform: 'uppercase' }}>
                      Select Location Hub
                    </div>
                    {CITIES.map((city) => (
                      <div
                        key={city}
                        onClick={() => handleCityPick(city)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: selectedLoc === city ? 700 : 500,
                          color: selectedLoc === city ? '#EA580C' : '#374151',
                          backgroundColor: selectedLoc === city ? '#FFF7ED' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.12s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={13} style={{ color: selectedLoc === city ? '#EA580C' : '#9CA3AF' }} />
                          <span>{city}</span>
                        </div>
                        {selectedLoc === city && <Check size={14} style={{ color: '#EA580C' }} />}
                      </div>
                    ))}
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
