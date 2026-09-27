import React, { useState, useEffect, useRef } from 'react';
import WorkerCard from './WorkerCard';
import { api } from '../api/client';
import { BHOPAL_PINCODES_DATA } from '../../../../packages/shared/constants.js';
import {
  Search,
  MapPin,
  Zap,
  Droplets,
  Hammer,
  Paintbrush,
  Tv,
  Wrench,
  PhoneCall,
  ShieldCheck,
  Star,
  Users,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  Check,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  FileText,
  Calendar,
  Award,
  Volume2,
  PhoneIncoming,
  AlertCircle,
  Smartphone,
  BadgeCheck,
  Loader2,
  Globe
} from 'lucide-react';

const POPULAR_SERVICES_CONFIG = [
  {
    name: 'Electrician',
    icon: Zap,
    key: 'electrician',
    accent: 'amber',
    tagColor: '#D97706',
    bgColor: '#FEF3C7',
    description: 'Wiring, MCB switches, fixture fitting, fan & inverter setups',
    typicalRate: '₹600 - ₹800'
  },
  {
    name: 'Plumber',
    icon: Droplets,
    key: 'plumber',
    accent: 'blue',
    tagColor: '#2563EB',
    bgColor: '#EEF4FF',
    description: 'Pipes, leakage, sanitary ware, tap fittings & tank cleaning',
    typicalRate: '₹550 - ₹750'
  },
  {
    name: 'AC Repair & Service',
    icon: Wrench,
    key: 'ac-repair',
    accent: 'teal',
    tagColor: '#0D9488',
    bgColor: '#F0FDFA',
    description: 'Seasonal maintenance, gas refills, cooling checks & installation',
    typicalRate: '₹750 - ₹950'
  },
  {
    name: 'Carpenter',
    icon: Hammer,
    key: 'carpenter',
    accent: 'terracotta',
    tagColor: '#C85A38',
    bgColor: '#FDF1EB',
    description: 'Furniture repairs, doors, locks, modular fittings & woodwork',
    typicalRate: '₹700 - ₹900'
  },
  {
    name: 'Painter',
    icon: Paintbrush,
    key: 'painter',
    accent: 'olive',
    tagColor: '#2E6B44',
    bgColor: '#EBF7EE',
    description: 'Interior & exterior walls, waterproofing, enamel & primer',
    typicalRate: '₹600 - ₹850'
  },
  {
    name: 'Appliance Repair',
    icon: Tv,
    key: 'appliance-repair',
    accent: 'purple',
    tagColor: '#7C3AED',
    bgColor: '#F5F3FF',
    description: 'Washing machines, microwaves, refrigerators & geysers',
    typicalRate: '₹650 - ₹850'
  }
];

const PAN_INDIA_POPULAR_HUBS = [
  { name: 'Connaught Place', district: 'Central Delhi', state: 'Delhi', pincode: '110001', label: 'Connaught Place, Delhi (110001)', city: 'Delhi' },
  { name: 'Andheri West', district: 'Mumbai', state: 'Maharashtra', pincode: '400058', label: 'Andheri West, Mumbai (400058)', city: 'Mumbai' },
  { name: 'Koramangala', district: 'Bengaluru', state: 'Karnataka', pincode: '560034', label: 'Koramangala, Bengaluru (560034)', city: 'Bengaluru' },
  { name: 'MP Nagar', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462011', label: 'MP Nagar, Bhopal (462011)', city: 'Bhopal' },
  { name: 'Vijay Nagar', district: 'Indore', state: 'Madhya Pradesh', pincode: '452010', label: 'Vijay Nagar, Indore (452010)', city: 'Indore' },
  { name: 'Gachibowli', district: 'Hyderabad', state: 'Telangana', pincode: '500032', label: 'Gachibowli, Hyderabad (500032)', city: 'Hyderabad' },
  { name: 'Hazratganj', district: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001', label: 'Hazratganj, Lucknow (226001)', city: 'Lucknow' },
  { name: 'Malviya Nagar', district: 'Jaipur', state: 'Rajasthan', pincode: '302017', label: 'Malviya Nagar, Jaipur (302017)', city: 'Jaipur' },
  { name: 'Kothrud', district: 'Pune', state: 'Maharashtra', pincode: '411038', label: 'Kothrud, Pune (411038)', city: 'Pune' },
  { name: 'Park Street', district: 'Kolkata', state: 'West Bengal', pincode: '700016', label: 'Park Street, Kolkata (700016)', city: 'Kolkata' },
  { name: 'Navrangpura', district: 'Ahmedabad', state: 'Gujarat', pincode: '380009', label: 'Navrangpura, Ahmedabad (380009)', city: 'Ahmedabad' },
  { name: 'Boring Road', district: 'Patna', state: 'Bihar', pincode: '800001', label: 'Boring Road, Patna (800001)', city: 'Patna' }
];

export default function LandingPage({
  onFindWorker,
  onWorkAsWorker,
  onLogin,
  onSignup,
  onSearchSubmit,
  onSelectService,
  onSelectWorker,
  onBookWorker,
  onOpenCallbot,
  workers = [],
  services = []
}) {
  const [selectedService, setSelectedService] = useState('');
  const [locationQuery, setLocationQuery] = useState('All-India Hubs');
  const [selectedPincode, setSelectedPincode] = useState('110001');
  const [bookingDate, setBookingDate] = useState('Tomorrow');
  const [openDropdown, setOpenDropdown] = useState(null); // 'service' | 'location' | 'date' | null
  const [locationSearchInput, setLocationSearchInput] = useState('');
  const [pincodeApiResults, setPincodeApiResults] = useState([]);
  const [isSearchingPincode, setIsSearchingPincode] = useState(false);
  const [activeTradeTab, setActiveTradeTab] = useState('All');
  const [activeWorkerFilter, setActiveWorkerFilter] = useState('All');
  const [callbotSimState, setCallbotSimState] = useState('idle'); // 'idle' | 'playing' | 'accepted' | 'declined'
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const dockRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dockRef.current && !dockRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounced Postal API lookup across all of India
  useEffect(() => {
    const q = locationSearchInput.trim();
    if (!q || q.length < 2) {
      setPincodeApiResults([]);
      setIsSearchingPincode(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingPincode(true);
      try {
        const res = await api.searchPincodes(q);
        if (res && res.success && Array.isArray(res.data)) {
          setPincodeApiResults(res.data);
        } else {
          setPincodeApiResults([]);
        }
      } catch (err) {
        console.error('Postal search failed:', err);
      } finally {
        setIsSearchingPincode(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [locationSearchInput]);

  // Compute real backend trust metrics from existing workers data
  const totalRegisteredWorkers = workers.length || 7;
  const totalCompletedJobs = workers.reduce((acc, w) => acc + (w.completed_jobs || 0), 0) || 48;
  const averageRating = workers.length > 0
    ? (workers.reduce((acc, w) => acc + (Number(w.rating) || 5), 0) / workers.length).toFixed(1)
    : '4.8';

  const handleSearch = (e) => {
    e?.preventDefault();
    setOpenDropdown(null);
    if (onSearchSubmit) {
      onSearchSubmit(selectedService, locationQuery, bookingDate);
    } else {
      onFindWorker();
    }
  };

  const handleQuickServiceClick = (srvName) => {
    setSelectedService(srvName);
    setActiveTradeTab(srvName);
    if (onSelectService) {
      onSelectService(srvName);
    } else {
      onFindWorker();
    }
  };

  const handleSelectPincode = (item) => {
    const label = item.label || `${item.name || item.locality}, ${item.district || item.city || ''} (${item.pincode})`;
    setLocationQuery(label);
    setSelectedPincode(item.pincode);
    setOpenDropdown(null);
  };

  // Filtered workers for the top workers showcase
  const topWorkersFromArea = workers.filter((w) => {
    if (activeTradeTab !== 'All' && !w.profession?.toLowerCase().includes(activeTradeTab.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', width: '100%', minHeight: '100vh' }}>
      {/* ==================================================
          1. HERO SECTION — FLUID 2-COLUMN WITH INTEGRATED SEARCH DOCK
          ================================================== */}
      <section style={{
        padding: 'clamp(36px, 4.5vw, 64px) 0 clamp(40px, 5vw, 72px)',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 'clamp(28px, 3.5vw, 48px)',
            alignItems: 'stretch'
          }} className="hero-grid">
            
            {/* LEFT COLUMN: Narrative, Floating Search Dock & Direct Trust Proof */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
              {/* Live Status Pill */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--surface-warm)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 600,
                width: 'fit-content'
              }}>
                <span className="pulse-dot"></span>
                <span>Live All-India Hyperlocal Network • 19,000+ PIN Codes</span>
              </div>

              {/* Hero Title */}
              <h1 style={{
                fontSize: 'clamp(36px, 3.5vw, 56px)',
                fontWeight: 800,
                lineHeight: 1.12,
                color: 'var(--text-main)',
                letterSpacing: '-0.035em',
                margin: 0
              }} className="hero-heading">
                Find skilled workers near you.
              </h1>

              {/* Subtitle */}
              <p style={{
                fontSize: 'clamp(16px, 1.15vw, 18px)',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                margin: 0,
                maxWidth: '600px'
              }}>
                Reliable local professionals for everyday work — electricians, plumbers, carpenters, and technicians with transparent day rates and verified reviews.
              </p>

              {/* UNIFIED BESPOKE SEARCH DOCK (Custom Non-Native Dropdowns & Pincode Lookup) */}
              <div style={{ marginTop: '8px', width: '100%', position: 'relative' }} ref={dockRef}>
                <form onSubmit={handleSearch} className={`search-dock ${openDropdown ? 'has-active-popover' : ''}`}>
                  {/* Segment 1: Service */}
                  <div
                    className={`search-dock-segment ${openDropdown === 'service' ? 'active-segment' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'service' ? null : 'service')}
                  >
                    <label>
                      <span>Trade / Craft</span>
                      <ChevronDown
                        size={12}
                        style={{
                          transform: openDropdown === 'service' ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.15s ease',
                          color: 'var(--text-muted)'
                        }}
                      />
                    </label>
                    <div className="dock-input-wrap">
                      <Wrench size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <span className="dock-display-val">
                        {selectedService || 'All Trades & Crafts'}
                      </span>
                    </div>

                    {/* Popover Menu: Trade */}
                    {openDropdown === 'service' && (
                      <div className="dock-dropdown-popover" style={{ minWidth: '340px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="dock-popover-header">
                          <span>Select Trade Specialization</span>
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{POPULAR_SERVICES_CONFIG.length} Categories</span>
                        </div>
                        <div className="dock-dropdown-list">
                          <div
                            className={`dock-dropdown-item ${!selectedService ? 'is-selected' : ''}`}
                            onClick={() => { setSelectedService(''); setOpenDropdown(null); }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--primary-light)',
                                color: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <Sparkles size={16} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '13.5px' }}>All Trades & Services</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Browse all local verified craftsmen</div>
                              </div>
                            </div>
                            {!selectedService && <Check size={16} style={{ color: 'var(--primary)' }} />}
                          </div>

                          {POPULAR_SERVICES_CONFIG.map((srv) => {
                            const SrvIcon = srv.icon;
                            const isSelected = selectedService === srv.name;
                            const srvCount = workers.filter((w) => w.profession?.toLowerCase().includes(srv.name.toLowerCase())).length || 1;
                            return (
                              <div
                                key={srv.key}
                                className={`dock-dropdown-item ${isSelected ? 'is-selected' : ''}`}
                                onClick={() => { setSelectedService(srv.name); setActiveTradeTab(srv.name); setOpenDropdown(null); }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '8px',
                                    backgroundColor: srv.bgColor,
                                    color: srv.tagColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}>
                                    <SrvIcon size={16} />
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{srv.name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>from {srv.typicalRate.split('-')[0].trim()} • {srvCount} available</div>
                                  </div>
                                </div>
                                {isSelected && <Check size={16} style={{ color: 'var(--primary)' }} />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="search-dock-divider"></div>

                  {/* Segment 2: Locality & Search Via Pincode */}
                  <div
                    className={`search-dock-segment ${openDropdown === 'location' ? 'active-segment' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'location' ? null : 'location')}
                  >
                    <label>
                      <span>City Hub / Locality & Pincode</span>
                      <ChevronDown
                        size={12}
                        style={{
                          transform: openDropdown === 'location' ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.15s ease',
                          color: 'var(--text-muted)'
                        }}
                      />
                    </label>
                    <div className="dock-input-wrap">
                      <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <span className="dock-display-val">
                        {locationQuery || 'Bhopal (462011)'}
                      </span>
                    </div>

                    {/* Popover Menu: Locality & Pan-India Postal Pincode Search */}
                    {openDropdown === 'location' && (
                      <div className="dock-dropdown-popover" style={{ minWidth: '400px', left: '-40px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="dock-popover-header">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Globe size={13} style={{ color: 'var(--primary)' }} />
                            <span>Search All-India Locality or 6-Digit PIN</span>
                          </span>
                          <span style={{ color: 'var(--olive)', fontWeight: 700, fontSize: '10.5px', backgroundColor: 'var(--olive-light)', padding: '2px 7px', borderRadius: '4px' }}>
                            🇮🇳 Postal PINcode API
                          </span>
                        </div>

                        {/* Search Input within Dropdown */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 11px',
                          backgroundColor: 'var(--surface-warm)',
                          border: '1.5px solid var(--border)',
                          borderRadius: '12px',
                          marginBottom: '10px'
                        }}>
                          {isSearchingPincode ? (
                            <Loader2 size={15} className="spin" style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          ) : (
                            <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          )}
                          <input
                            type="text"
                            value={locationSearchInput}
                            onChange={(e) => setLocationSearchInput(e.target.value)}
                            placeholder="Type any PIN code or City (e.g. 110001, 400058, Bengaluru)..."
                            style={{
                              border: 'none',
                              background: 'transparent',
                              outline: 'none',
                              fontSize: '13px',
                              width: '100%',
                              color: 'var(--text-main)',
                              fontWeight: 600
                            }}
                            autoFocus
                          />
                          {locationSearchInput && (
                            <button
                              type="button"
                              onClick={() => { setLocationSearchInput(''); setPincodeApiResults([]); }}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)' }}
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Quick Popular Pan-India Pincode Pills */}
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                            Major Indian Metro Hubs:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            {PAN_INDIA_POPULAR_HUBS.slice(0, 8).map((pin) => (
                              <button
                                key={pin.pincode}
                                type="button"
                                className={`pincode-pill-chip ${selectedPincode === pin.pincode ? 'is-active' : ''}`}
                                onClick={() => handleSelectPincode(pin)}
                              >
                                <span>{pin.pincode}</span>
                                <span style={{ opacity: 0.8 }}>({pin.city || pin.name.split(' ')[0]})</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Postal API Results or Curated Hubs List */}
                        <div className="dock-dropdown-list">
                          {isSearchingPincode && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                              <Loader2 size={16} className="spin" style={{ color: 'var(--primary)' }} />
                              <span>Querying official India Postal API...</span>
                            </div>
                          )}

                          {!isSearchingPincode && locationSearchInput.trim().length >= 2 && pincodeApiResults.length === 0 && (
                            <div style={{ padding: '16px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                              No postal records found for "{locationSearchInput}". Try another 6-digit Indian PIN or city name.
                            </div>
                          )}

                          {(locationSearchInput.trim().length >= 2 ? pincodeApiResults : PAN_INDIA_POPULAR_HUBS).map((item, idx) => {
                            const isSelected = selectedPincode === item.pincode;
                            return (
                              <div
                                key={`${item.pincode}-${idx}`}
                                className={`dock-dropdown-item ${isSelected ? 'is-selected' : ''}`}
                                onClick={() => handleSelectPincode(item)}
                              >
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '13.5px' }}>
                                      {item.name || item.locality}
                                    </span>
                                    <span style={{
                                      fontSize: '11px',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      backgroundColor: isSelected ? 'var(--primary)' : 'var(--primary-light)',
                                      color: isSelected ? '#FFFFFF' : 'var(--primary)',
                                      fontWeight: 700
                                    }}>
                                      {item.pincode}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {item.district ? `${item.district}, ` : ''}{item.state || 'India'}
                                  </div>
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--olive)', fontWeight: 600, backgroundColor: 'var(--olive-light)', padding: '2px 6px', borderRadius: '4px' }}>
                                  Verified Hub
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="search-dock-divider"></div>

                  {/* Segment 3: When */}
                  <div
                    className={`search-dock-segment ${openDropdown === 'date' ? 'active-segment' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
                  >
                    <label>
                      <span>Work Date</span>
                      <ChevronDown
                        size={12}
                        style={{
                          transform: openDropdown === 'date' ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.15s ease',
                          color: 'var(--text-muted)'
                        }}
                      />
                    </label>
                    <div className="dock-input-wrap">
                      <Calendar size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <span className="dock-display-val">
                        {bookingDate}
                      </span>
                    </div>

                    {/* Popover Menu: Date */}
                    {openDropdown === 'date' && (
                      <div className="dock-dropdown-popover" style={{ minWidth: '240px', right: 0, left: 'auto' }} onClick={(e) => e.stopPropagation()}>
                        <div className="dock-popover-header">
                          <span>Select Dispatch Schedule</span>
                        </div>
                        <div className="dock-dropdown-list">
                          {[
                            { label: 'Tomorrow', desc: 'Standard Morning (9:00 AM)', tag: 'Recommended' },
                            { label: 'Today (Urgent)', desc: 'Immediate Dispatch in < 60 mins', tag: '⚡ Urgent' },
                            { label: 'This Weekend', desc: 'Saturday or Sunday slot', tag: 'Weekend' },
                            { label: 'Flexible Date', desc: 'Any day in next 7 days', tag: 'Flexible' }
                          ].map((d) => (
                            <div
                              key={d.label}
                              className={`dock-dropdown-item ${bookingDate === d.label ? 'is-selected' : ''}`}
                              onClick={() => { setBookingDate(d.label); setOpenDropdown(null); }}
                            >
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '13px' }}>{d.label}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{d.desc}</div>
                              </div>
                              {bookingDate === d.label && <Check size={16} style={{ color: 'var(--primary)' }} />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button type="submit" className="search-dock-btn">
                    <Search size={16} />
                    <span>Find Workers</span>
                  </button>
                </form>

                {/* Quick-Filter Pills directly underneath search dock */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginTop: '12px',
                  fontSize: '12px'
                }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Quick pick:</span>
                  {[
                    { name: 'Electrician', icon: Zap },
                    { name: 'Plumber', icon: Droplets },
                    { name: 'AC Repair & Service', icon: Wrench },
                    { name: 'Carpenter', icon: Hammer },
                    { name: 'Painter', icon: Paintbrush }
                  ].map((p) => {
                    const Icon = p.icon;
                    const isSelected = selectedService === p.name;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handleQuickServiceClick(p.name)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                          backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                          color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Icon size={12} />
                        <span>{p.name}</span>
                      </button>
                    );
                  })}

                  <span style={{ color: 'var(--border)', margin: '0 4px' }}>|</span>

                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Pincodes:</span>
                  {PAN_INDIA_POPULAR_HUBS.slice(0, 5).map((pin) => {
                    const isSelected = selectedPincode === pin.pincode;
                    return (
                      <button
                        key={pin.pincode}
                        type="button"
                        onClick={() => handleSelectPincode(pin)}
                        className={`pincode-pill-chip ${isSelected ? 'is-active' : ''}`}
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                      >
                        <span>{pin.pincode}</span>
                        <span style={{ opacity: 0.75 }}>{pin.city || pin.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* INLINE TRUST STRIP (Seamless proof counters without box borders) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(16px, 2.5vw, 32px)',
                flexWrap: 'wrap',
                paddingTop: '20px',
                borderTop: '1px solid var(--border)',
                marginTop: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px'
                  }}>
                    {totalRegisteredWorkers}+
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
                      Verified Workers
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Background checked</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--olive-light)',
                    color: 'var(--olive)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px'
                  }}>
                    {totalCompletedJobs}+
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
                      Jobs Completed
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>In your local hub</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#FEF3C7',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px'
                  }}>
                    ★ {averageRating}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
                      Customer Rating
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verified community</div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Brand Animation Video (Framed with organic elevation) */}
            <div className="hero-video-wrap">
              <div className="hero-video-container">
                {!videoError ? (
                  <>
                    <video
                      src="/hero_showcase.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      controls={false}
                      onLoadedData={() => setVideoLoaded(true)}
                      onError={() => setVideoError(true)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                    {/* Floating live dispatch badge */}
                    <div style={{
                      position: 'absolute',
                      bottom: '20px',
                      left: '20px',
                      backgroundColor: 'rgba(255, 255, 255, 0.94)',
                      backdropFilter: 'blur(8px)',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-pill)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      boxShadow: 'var(--shadow-md)'
                    }}>
                      <span className="pulse-dot"></span>
                      <span>Zero Middleman Markup • 100% Direct Pay</span>
                    </div>
                  </>
                ) : (
                  <div style={{
                    padding: '48px 32px',
                    textAlign: 'center',
                    backgroundColor: 'var(--surface-alt)',
                    width: '100%'
                  }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}>
                      <Wrench size={28} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
                      HireLocal Hyperlocal Marketplace
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '320px', margin: '0 auto' }}>
                      Connecting homeowners with verified local electricians, plumbers, and craftsmen.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          2. TOP WORKERS FROM THAT AREA & ARTISANAL TRADE SPECIALIZATION
          ================================================== */}
      <section style={{
        padding: 'clamp(56px, 6vw, 84px) 0',
        backgroundColor: 'var(--bg-main)'
      }}>
        <div className="container">
          {/* Section Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--primary)',
                marginBottom: '8px'
              }}>
                <MapPin size={13} />
                <span>Verified Hyperlocal Talent • All-India Network ({selectedPincode || '462011'})</span>
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 2.6vw, 36px)', fontWeight: 800, margin: 0, letterSpacing: '-0.025em', color: 'var(--text-main)' }}>
                Top Rated Workers in Your Area
              </h2>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: '6px 0 0', maxWidth: '680px' }}>
                Handpicked, certified local craftsmen ready for immediate day-based bookings. Transparent fixed wages with verified customer track records.
              </p>
            </div>

            <button
              onClick={onFindWorker}
              className="btn btn-secondary"
              style={{ gap: '6px' }}
            >
              <span>Explore All Workers ({workers.length})</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* Artisanal Trade Specialization Navigator */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Filter by Trade Specialization:
              </span>
              <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>
                {activeTradeTab === 'All' ? 'Showing All Crafts' : `Showing: ${activeTradeTab}`}
              </span>
            </div>

            <div className="trade-spec-nav">
              {/* 'All Trades' Card */}
              <div
                className={`trade-spec-card ${activeTradeTab === 'All' ? 'is-active' : ''}`}
                onClick={() => setActiveTradeTab('All')}
              >
                <div>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px'
                  }}>
                    <Sparkles size={18} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)', marginBottom: '2px' }}>
                    All Crafts
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Complete verified roster
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '14px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border)'
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>{workers.length} Craftsmen</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>View All</span>
                </div>
              </div>

              {/* Individual Trade Cards */}
              {POPULAR_SERVICES_CONFIG.map((srv) => {
                const SrvIcon = srv.icon;
                const isSelected = activeTradeTab === srv.name;
                const count = workers.filter((w) => w.profession?.toLowerCase().includes(srv.name.toLowerCase())).length || 1;

                return (
                  <div
                    key={srv.key}
                    className={`trade-spec-card ${isSelected ? 'is-active' : ''}`}
                    onClick={() => setActiveTradeTab(srv.name)}
                  >
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '10px'
                      }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          backgroundColor: srv.bgColor,
                          color: srv.tagColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <SrvIcon size={18} />
                        </div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--olive)',
                          backgroundColor: 'var(--olive-light)',
                          padding: '2px 7px',
                          borderRadius: 'var(--radius-pill)'
                        }}>
                          {count} Nearby
                        </span>
                      </div>

                      <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)', marginBottom: '2px' }}>
                        {srv.name}
                      </div>
                      <div style={{
                        fontSize: '11.5px',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {srv.description.split(',')[0]}
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '14px',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border)'
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>From</span>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-main)' }}>{srv.typicalRate.split('-')[0].trim()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Workers Grid for That Area */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '22px'
          }}>
            {topWorkersFromArea.slice(0, 6).map((worker) => {
              const isCallbot = worker.communication_type === 'non_smartphone';
              return (
                <div key={worker.worker_id} className="top-artisan-card">
                  <div>
                    {/* Card Header: Avatar + Identity + Verified Badge */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        backgroundColor: 'var(--surface-warm)',
                        border: '1.5px solid var(--border)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 800,
                        flexShrink: 0,
                        position: 'relative'
                      }}>
                        {worker.name.charAt(0)}
                        <span style={{
                          position: 'absolute',
                          bottom: '-2px',
                          right: '-2px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--success)',
                          border: '2px solid #FFFFFF'
                        }}></span>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '16.5px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                            {worker.name}
                          </h3>
                          <span className="top-artisan-badge" style={{ backgroundColor: 'var(--olive-light)', color: 'var(--olive)' }}>
                            <ShieldCheck size={11} strokeWidth={2.5} />
                            <span>Govt ID Verified</span>
                          </span>
                        </div>

                        <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
                          {worker.profession} • {worker.experience ? `${worker.experience} yrs exp` : 'Verified Artisan'}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          <MapPin size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {worker.location?.name || 'Bhopal (462011)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reliability & Rating Bar */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1.1fr 1fr',
                      gap: '8px',
                      padding: '10px 12px',
                      backgroundColor: 'var(--surface-warm)',
                      borderRadius: '12px',
                      marginBottom: '14px',
                      border: '1px solid var(--border)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          backgroundColor: '#FEF3C7',
                          color: '#B45309',
                          padding: '3px 7px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '13px'
                        }}>
                          <Star size={13} style={{ fill: '#F59E0B', color: '#F59E0B' }} />
                          <span>{worker.rating ? worker.rating.toFixed(1) : '4.9'}</span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                          ({worker.completed_jobs || 42} jobs done)
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                          Dependability
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--olive)' }}>
                          {worker.reliability ? `${worker.reliability}% on-time` : '96% on-time'}
                        </div>
                      </div>
                    </div>

                    {/* Communication Mode Indicator */}
                    <div style={{ marginBottom: '14px' }}>
                      {isCallbot ? (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--terracotta-light)',
                          color: 'var(--terracotta)',
                          fontSize: '11.5px',
                          fontWeight: 600
                        }}>
                          <PhoneCall size={12} />
                          <span>Keypad Phone • Dispatched via Hindi AI CallBot</span>
                        </div>
                      ) : (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          fontSize: '11.5px',
                          fontWeight: 600
                        }}>
                          <Smartphone size={12} />
                          <span>Direct Smartphone App Dispatch</span>
                        </div>
                      )}
                    </div>

                    {/* Skill Tags */}
                    {worker.skills && worker.skills.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '16px' }}>
                        {worker.skills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--surface-alt)',
                              color: 'var(--text-secondary)',
                              fontWeight: 500
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Pricing + Direct Booking Action */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border)',
                    marginTop: '4px'
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                        Fixed Day Wage
                      </span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
                          ₹{worker.daily_rate || 650}
                        </span>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>/ 8-hr day</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => onSelectWorker ? onSelectWorker(worker) : onFindWorker()}
                        className="btn btn-secondary"
                        style={{ padding: '8px 14px', fontSize: '13px' }}
                      >
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => onBookWorker ? onBookWorker(worker) : onFindWorker()}
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontSize: '13px', gap: '4px' }}
                      >
                        <span>⚡ Book</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guarantee Strip Reassuring Users */}
          <div className="hyperlocal-guarantee-strip">
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '14.5px', color: 'var(--text-main)', marginBottom: '2px' }}>
                  100% Background-Checked
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Every artisan is verified with government ID, address proof, trade credentials, and verified local community references.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'var(--olive-light)',
                color: 'var(--olive)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Award size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '14.5px', color: 'var(--text-main)', marginBottom: '2px' }}>
                  Direct Day-Wage Settlement
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  No surge pricing, hidden platform markups, or commission cuts. Pay the artisan directly via UPI or cash upon work inspection.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'var(--ochre-light)',
                color: 'var(--ochre)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <PhoneCall size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '14.5px', color: 'var(--text-main)', marginBottom: '2px' }}>
                  Dual-Channel Dispatch
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Smartphone workers accept via app; non-smartphone craftsmen receive automated Hindi phone calls via our multilingual AI CallBot.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          5. CALLBOT TELEPHONY USP — INTERACTIVE STORYTELLING
          ================================================== */}
      <section style={{
        padding: 'clamp(64px, 7vw, 96px) 0',
        backgroundColor: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.85fr',
            gap: 'clamp(36px, 5vw, 72px)',
            alignItems: 'center'
          }} className="callbot-split">
            {/* Left Column: The Societal Story & Inclusion USP */}
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--primary-light)',
                border: '1px solid #BFDBFE',
                color: 'var(--primary)',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '16px'
              }}>
                <PhoneCall size={14} />
                <span>Inclusive Telephony USP • Hindi & English Voice</span>
              </div>

              <h2 style={{
                fontSize: 'clamp(28px, 2.8vw, 40px)',
                fontWeight: 800,
                lineHeight: 1.2,
                color: 'var(--text-main)',
                letterSpacing: '-0.025em',
                marginBottom: '16px'
              }}>
                Connecting skilled workers on any phone. No smartphone required.
              </h2>

              <p style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: '24px'
              }}>
                Over 40% of skilled wage craftsmen in Tier 2 and Tier 3 cities rely on simple keypad phones (like JioBharat or Nokia). While traditional apps leave them behind, HireLocal's automated voice gateway dials their number in Hindi, explains the job, and lets them accept in seconds.
              </p>

              {/* 3 Practical Bullets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--olive-light)',
                    color: 'var(--olive)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <Check size={14} strokeWidth={2.5} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>Automated Outbound Voice Calls</strong>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                      Worker’s phone rings immediately when a matching job is requested in their neighborhood.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--olive-light)',
                    color: 'var(--olive)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <Check size={14} strokeWidth={2.5} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>Regional Hindi Voice Synthesis</strong>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                      Natural voice explains customer locality, exact trade needs, scheduled day, and agreed daily rate.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--olive-light)',
                    color: 'var(--olive)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <Check size={14} strokeWidth={2.5} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>Simple 1-Touch Keypad Confirmation</strong>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                      Workers press digit 1 or speak "हाँ" to instantly lock the job. No digital literacy barrier.
                    </div>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={onOpenCallbot || onFindWorker}
                style={{ padding: '12px 24px' }}
              >
                <PhoneCall size={16} />
                <span>Launch Interactive CallBot Simulator</span>
              </button>
            </div>

            {/* Right Column: Interactive Keypad Phone Handset Experience */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: '24px',
                padding: '24px',
                boxShadow: '0 20px 40px -10px rgba(29, 36, 33, 0.12), 0 0 0 1px var(--border)',
                width: '100%',
                maxWidth: '420px',
                position: 'relative'
              }}>
                {/* Phone Speaker Top */}
                <div style={{
                  width: '60px',
                  height: '4px',
                  backgroundColor: 'var(--border-strong)',
                  borderRadius: '2px',
                  margin: '0 auto 16px'
                }}></div>

                {/* Call Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '14px',
                  borderBottom: '1px solid var(--border)',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--primary)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <PhoneIncoming size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                        HireLocal Dispatch
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        +91 755 2400100 (Bhopal)
                      </div>
                    </div>
                  </div>

                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--success)',
                    backgroundColor: 'var(--success-light)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-pill)'
                  }}>
                    <span className="pulse-dot"></span>
                    <span>Connected</span>
                  </span>
                </div>

                {/* Sound wave visualizer */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  height: '32px',
                  backgroundColor: 'var(--surface-warm)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  padding: '0 16px'
                }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginRight: '8px' }}>
                    Voice Synthesizer:
                  </span>
                  <div className="sound-bar" style={{ animationDelay: '0.1s' }}></div>
                  <div className="sound-bar" style={{ animationDelay: '0.3s' }}></div>
                  <div className="sound-bar" style={{ animationDelay: '0.2s' }}></div>
                  <div className="sound-bar" style={{ animationDelay: '0.4s' }}></div>
                  <div className="sound-bar" style={{ animationDelay: '0.15s' }}></div>
                </div>

                {/* Job Information Card inside the handset */}
                <div style={{
                  backgroundColor: 'var(--surface-alt)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '14px',
                  fontSize: '13px'
                }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Incoming Job Dispatch
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                    Electrician • Wiring & Switchboard
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>
                    Location: MP Nagar Zone II, Bhopal (3.2 km away)
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border)'
                  }}>
                    <span>Schedule: <strong>Tomorrow</strong></span>
                    <span>Daily Rate: <strong style={{ color: 'var(--primary)' }}>₹600</strong></span>
                  </div>
                </div>

                {/* Real Voice Transcript */}
                <div style={{
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#EEF4FF',
                  border: '1px solid #BFDBFE',
                  fontSize: '12px',
                  color: '#1E40AF',
                  lineHeight: 1.5,
                  marginBottom: '16px'
                }}>
                  "नमस्ते! HireLocal से नया काम उपलब्ध है। MP नगर में इलेक्ट्रीशियन सेवा। कल के लिए ₹600। काम स्वीकार करने के लिए 1 दबाएं।"
                </div>

                {/* Interactive Feedback State */}
                {callbotSimState === 'accepted' ? (
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--success-light)',
                    color: 'var(--success)',
                    fontSize: '13px',
                    fontWeight: 700,
                    textAlign: 'center',
                    marginBottom: '10px'
                  }}>
                    ✓ काम स्वीकार कर लिया गया! (Job Accepted & Confirmed)
                  </div>
                ) : callbotSimState === 'declined' ? (
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--error-light)',
                    color: 'var(--error)',
                    fontSize: '13px',
                    fontWeight: 700,
                    textAlign: 'center',
                    marginBottom: '10px'
                  }}>
                    ✕ काम अस्वीकार किया गया (Job Offered to Next Available Worker)
                  </div>
                ) : null}

                {/* Interactive DTMF Phone Keypad Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setCallbotSimState('declined')}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--error)', borderColor: '#FECACA' }}
                  >
                    2. अस्वीकार (Decline)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCallbotSimState('accepted')}
                    className="btn btn-primary btn-sm"
                    style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                  >
                    1. स्वीकार करें (Accept)
                  </button>
                </div>

                <div style={{
                  textAlign: 'center',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  marginTop: '12px'
                }}>
                  Tested on JioBharat, Nokia 105, & standard 2G/4G feature phones
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          6. FAIR RATE TRANSPARENCY MATRIX (Educational & Useful)
          ================================================== */}
      <section style={{
        padding: 'clamp(64px, 7vw, 96px) 0',
        backgroundColor: 'var(--bg-main)'
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 40px' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--primary)',
              marginBottom: '6px'
            }}>
              Pricing Integrity
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
              Know what a fair rate looks like
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: 0 }}>
              HireLocal eliminates mid-job haggling through clear day-based rates. Here is the prevailing benchmark for your city.
            </p>
          </div>

          {/* Interactive Comparison Table */}
          <div className="data-table-container" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trade / Specialization</th>
                  <th>Prevailing Market Day Rate</th>
                  <th>Statutory Reference Baseline</th>
                  <th>Typical Work Day Scope</th>
                  <th>Standard Guarantee</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    trade: 'Electrician',
                    market: '₹600 - ₹800 / day',
                    baseline: '₹450 / day',
                    scope: 'Full-day wiring, switchboards, MCBs, fixtures & appliance repairs',
                    guarantee: 'Tested on-site with multimeter'
                  },
                  {
                    trade: 'Plumber',
                    market: '₹550 - ₹750 / day',
                    baseline: '₹450 / day',
                    scope: 'Pipes, sanitary installations, drainage, tap replacements & pump check',
                    guarantee: 'Zero pressure-leak sign-off'
                  },
                  {
                    trade: 'Carpenter',
                    market: '₹700 - ₹900 / day',
                    baseline: '₹500 / day',
                    scope: 'Door hinges, locks, furniture alignment, custom shelving & woodwork',
                    guarantee: 'All structural fittings verified'
                  },
                  {
                    trade: 'AC Mechanic',
                    market: '₹750 - ₹950 / day',
                    baseline: '₹500 / day',
                    scope: 'Seasonal servicing, condenser coil wash, gas recharge & installation',
                    guarantee: 'Cooling delta temperature test'
                  },
                  {
                    trade: 'Painter',
                    market: '₹600 - ₹850 / day',
                    baseline: '₹450 / day',
                    scope: 'Wall putty, primer coat, two finish coats, clean edge masking',
                    guarantee: 'Even coat & clean cleanup'
                  }
                ].map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong style={{ color: 'var(--text-main)' }}>{row.trade}</strong>
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: 'var(--primary)',
                        backgroundColor: 'var(--primary-light)',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)'
                      }}>
                        {row.market}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        {row.baseline} (MP Labour Dept)
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {row.scope}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        color: 'var(--olive)',
                        fontWeight: 600
                      }}>
                        <CheckCircle size={13} />
                        <span>{row.guarantee}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginTop: '20px',
            fontSize: '13px',
            color: 'var(--text-secondary)'
          }}>
            <ShieldCheck size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <div>
              <strong>Why Day-Based Rates?</strong> Hourly billing creates incentives for technicians to work slowly, while piece-rate billing encourages cutting corners. Transparent full-day and half-day wages align worker livelihood with quality results for homeowners.
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          7. HYPERLOCAL COVERAGE & CITY HUBS
          ================================================== */}
      <section style={{
        padding: 'clamp(56px, 6vw, 84px) 0',
        backgroundColor: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div className="container">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--primary)',
                marginBottom: '6px'
              }}>
                Geographic Proximity
              </div>
              <h2 style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Local workers. Close to your doorstep.
              </h2>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
                HireLocal pairs you strictly within a 15 km perimeter to eliminate transit delays.
              </p>
            </div>

            {/* City Hub Chips */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="tag" style={{ color: 'var(--primary)', borderColor: '#BFDBFE', backgroundColor: 'var(--primary-light)' }}>
                📍 Bhopal Hub (Active)
              </span>
              <span className="tag" style={{ color: 'var(--text-secondary)' }}>
                📍 Indore Hub
              </span>
              <span className="tag" style={{ color: 'var(--text-secondary)' }}>
                📍 Lucknow Hub
              </span>
              <span className="tag" style={{ color: 'var(--text-secondary)' }}>
                📍 Jaipur Hub
              </span>
            </div>
          </div>

          {/* 3 Core Tenets in a Clean, Open 3-Column Spread */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '28px'
          }}>
            <div style={{
              backgroundColor: 'var(--bg-main)',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <MapPin size={22} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
                City Hubs & Sub-Localities
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                Active neighborhood coverage across MP Nagar, Arera Colony, Kolar Road, Vijay Nagar, Hazratganj, and Malviya Nagar.
              </p>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-main)',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'var(--olive-light)',
                color: 'var(--olive)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <Clock size={22} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
                15 km Maximum Perimeter
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                Technicians operate near their local base, avoiding long cross-city commutes and arriving promptly for the agreed morning slot.
              </p>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-main)',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: '#FEF3C7',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <Users size={22} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
                Local Community Accountability
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                Local word-of-mouth meets verified ratings. Workers take pride in building repeat relationships with neighborhood households.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          8. FOR WORKERS BANNER — WARM ARTISANAL BANNER
          ================================================== */}
      <section style={{
        padding: 'clamp(64px, 7vw, 96px) 0',
        backgroundColor: 'var(--bg-main)'
      }}>
        <div className="container">
          <div style={{
            backgroundColor: '#1E293B',
            color: '#FFFFFF',
            borderRadius: '24px',
            padding: 'clamp(36px, 5vw, 64px)',
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: 'clamp(32px, 4vw, 56px)',
            alignItems: 'center',
            boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.3)'
          }} className="for-workers-split">
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#93C5FD',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '16px'
              }}>
                <Sparkles size={14} />
                <span>For Skilled Craftsmen & Wage Workers</span>
              </div>

              <h2 style={{
                fontSize: 'clamp(28px, 2.8vw, 42px)',
                fontWeight: 800,
                lineHeight: 1.18,
                color: '#FFFFFF',
                letterSpacing: '-0.025em',
                marginBottom: '16px'
              }}>
                Turn your skills into steady, direct daily income.
              </h2>

              <p style={{
                fontSize: '16px',
                color: '#94A3B8',
                lineHeight: 1.6,
                marginBottom: '28px'
              }}>
                Join verified electricians, plumbers, and mechanics receiving regular daily bookings across your city. Keep 100% of what customers pay you.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                marginBottom: '32px',
                fontSize: '14px',
                color: '#E2E8F0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={16} style={{ color: '#4ADE80' }} />
                  <span>0% Commission Taken</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={16} style={{ color: '#4ADE80' }} />
                  <span>Direct Customer Settlement</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={16} style={{ color: '#4ADE80' }} />
                  <span>Works on Any Basic Phone</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={16} style={{ color: '#4ADE80' }} />
                  <span>Set Your Own Daily Rate</span>
                </div>
              </div>

              <button
                className="btn btn-primary btn-lg"
                onClick={onWorkAsWorker}
                style={{
                  backgroundColor: 'var(--primary)',
                  borderColor: 'var(--primary)',
                  padding: '14px 32px',
                  fontSize: '16px'
                }}
              >
                <span>Register as a Craftsman</span>
                <ArrowRight size={18} />
              </button>
            </div>

            {/* Right Side: Quick 2-Minute Onboarding Checklist */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '28px'
            }}>
              <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px' }}>
                Simple 2-Minute Onboarding
              </h4>
              <ul style={{
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                fontSize: '14px',
                color: '#CBD5E1'
              }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(37, 99, 235, 0.3)',
                    color: '#93C5FD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '12px'
                  }}>1</span>
                  <span>Name, contact number & local city sector</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(37, 99, 235, 0.3)',
                    color: '#93C5FD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '12px'
                  }}>2</span>
                  <span>Primary trade specialization & years in field</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(37, 99, 235, 0.3)',
                    color: '#93C5FD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '12px'
                  }}>3</span>
                  <span>Device choice: Smartphone App or CallBot Voice</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(37, 99, 235, 0.3)',
                    color: '#93C5FD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '12px'
                  }}>4</span>
                  <span>Set your transparent day wage rate</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          9. FOOTER
          ================================================== */}
      <footer style={{
        backgroundColor: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '56px 0 32px'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '48px',
            marginBottom: '40px'
          }} className="footer-grid">
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF'
                }}>
                  <Wrench size={16} />
                </div>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                  HireLocal
                </span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '340px', margin: 0 }}>
                Hyperlocal skilled worker marketplace connecting homeowners with local technicians via web and AI CallBot telephony.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-main)' }}>
                Platform
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <li>
                  <button onClick={onFindWorker} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}>
                    Find Workers
                  </button>
                </li>
                <li>
                  <button onClick={onFindWorker} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}>
                    How It Works
                  </button>
                </li>
                <li>
                  <button onClick={onWorkAsWorker} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}>
                    For Workers
                  </button>
                </li>
                <li>
                  <button onClick={onOpenCallbot || onFindWorker} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}>
                    CallBot Telephony
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-main)' }}>
                Service Hubs
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <li>MP Nagar, Bhopal</li>
                <li>Vijay Nagar, Indore</li>
                <li>Hazratganj, Lucknow</li>
                <li>Malviya Nagar, Jaipur</li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-main)' }}>
                Trust & Standards
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <li>Day-Wage Policy</li>
                <li>Worker Verification</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div>© 2026 HireLocal. All rights reserved. Built for fair trade and community trust.</div>
            <div>PostgreSQL 18 • Production-Ready Relational RBAC</div>
          </div>
        </div>
      </footer>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 960px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
          .hero-heading {
            font-size: 36px !important;
          }
          .callbot-split {
            grid-template-columns: 1fr !important;
          }
          .for-workers-split {
            grid-template-columns: 1fr !important;
          }
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
