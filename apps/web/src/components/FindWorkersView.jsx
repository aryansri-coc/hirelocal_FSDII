import React, { useState, useMemo } from 'react';
import WorkerCard from './WorkerCard';
import {
  ArrowLeft,
  Search,
  MapPin,
  ChevronDown,
  Home,
  SlidersHorizontal,
  ShieldCheck,
  Star,
  Check,
  CheckCircle2,
  Calendar,
  Phone,
  Smartphone,
  Zap,
  Filter,
  Layers,
  Sparkles,
  LayoutGrid,
  Wind
} from 'lucide-react';

const INITIAL_ELECTRICIANS = [
  {
    worker_id: 'wrk_elec_1',
    name: 'Mukesh Sharma',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    profession: 'Electrician',
    experience: 11,
    rating: 4.9,
    completed_jobs: 142,
    reliability: 98,
    distance_km: 2.4,
    daily_rate: 550,
    hourly_rate: 69,
    communication_type: 'non_smartphone', // Phone Booking
    isRecommended: true,
    availableStatus: 'Available for tomorrow',
    skills: ['House Wiring', 'MCB Installation', 'Fan Installation', 'Inverter Setup', 'Earthing Check'],
    location: { name: 'Govindpura, Bihar' }
  },
  {
    worker_id: 'wrk_elec_2',
    name: 'Sunil Verma',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
    profession: 'Electrician',
    experience: 4,
    rating: 4.5,
    completed_jobs: 40,
    reliability: 89,
    distance_km: 3.1,
    daily_rate: 450,
    hourly_rate: 56,
    communication_type: 'smartphone', // App Booking
    isRecommended: false,
    availableStatus: 'Available for tomorrow',
    skills: ['Switchboard Upgrade', 'LED Lighting', 'Earthing Check'],
    location: { name: 'Govindpura, Bihar' }
  },
  {
    worker_id: 'wrk_elec_3',
    name: 'Rohit Kumar',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=160&auto=format&fit=crop&q=80',
    profession: 'Electrician',
    experience: 6,
    rating: 4.7,
    completed_jobs: 88,
    reliability: 94,
    distance_km: 4.8,
    daily_rate: 500,
    hourly_rate: 63,
    communication_type: 'non_smartphone',
    isRecommended: false,
    availableStatus: 'Available for tomorrow',
    skills: ['House Wiring', 'AC Point Installation', 'MCB / Switches', 'Ceiling Fan'],
    location: { name: 'Govindpura, Bihar' }
  },
  {
    worker_id: 'wrk_elec_4',
    name: 'Amit Yadav',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&auto=format&fit=crop&q=80',
    profession: 'Electrician',
    experience: 8,
    rating: 4.6,
    completed_jobs: 112,
    reliability: 92,
    distance_km: 1.9,
    daily_rate: 600,
    hourly_rate: 75,
    communication_type: 'smartphone',
    isRecommended: false,
    availableStatus: 'Available for tomorrow',
    skills: ['House Wiring', 'Fan Installation', 'Lighting'],
    location: { name: 'Govindpura, Bihar' }
  },
  {
    worker_id: 'wrk_elec_5',
    name: 'Rakesh Singh',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&auto=format&fit=crop&q=80',
    profession: 'Electrician',
    experience: 5,
    rating: 4.4,
    completed_jobs: 67,
    reliability: 90,
    distance_km: 3.5,
    daily_rate: 480,
    hourly_rate: 60,
    communication_type: 'non_smartphone',
    isRecommended: false,
    availableStatus: 'Available for tomorrow',
    skills: ['MCB / Switches', 'LED Lighting', 'Earthing Check'],
    location: { name: 'Govindpura, Bihar' }
  },
  {
    worker_id: 'wrk_elec_6',
    name: 'Vijay Prasad',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&auto=format&fit=crop&q=80',
    profession: 'Electrician',
    experience: 10,
    rating: 4.8,
    completed_jobs: 98,
    reliability: 96,
    distance_km: 5.2,
    daily_rate: 650,
    hourly_rate: 81,
    communication_type: 'smartphone',
    isRecommended: false,
    availableStatus: 'Available for tomorrow',
    skills: ['House Wiring', 'Commercial Wiring', 'Lighting'],
    location: { name: 'Govindpura, Bihar' }
  }
];

export default function FindWorkersView({
  workers = [],
  selectedService = 'Electrician',
  onBack,
  onSelectWorker,
  onBookWorker,
  selectedLocation = 'Govindpura, Bihar'
}) {
  const [searchInput, setSearchInput] = useState('');
  const [activeSkillFilter, setActiveSkillFilter] = useState('');
  const [currentCity, setCurrentCity] = useState(selectedLocation || 'Govindpura, Bihar');
  const [sortBy, setSortBy] = useState('Recommended');

  // Sidebar Filter States matching user screenshot
  const [availFilter, setAvailFilter] = useState({ today: false, tomorrow: true, thisWeek: false });
  const [priceMax, setPriceMax] = useState(800);
  const [expFilter, setExpFilter] = useState({ '1-3': false, '3-5': false, '5-10': true, '10+': false });
  const [ratingFilter, setRatingFilter] = useState({ '4-': false, '4.5+': false });
  const [govtVerifiedOnly, setGovtVerifiedOnly] = useState(true);
  const [bookingMethod, setBookingMethod] = useState({ phone: true, app: true });
  const [distanceFilter, setDistanceFilter] = useState({ '2km': false, '5km': false, '10km': false });

  // Merge database workers with the mock reference list to guarantee full fidelity
  const allWorkers = useMemo(() => {
    // If database workers exist, enrich them or combine
    const merged = [...INITIAL_ELECTRICIANS];
    if (workers && workers.length > 0) {
      workers.forEach((w) => {
        if (!merged.some((m) => m.name === w.name)) {
          merged.push({
            ...w,
            hourly_rate: Math.round((Number(w.daily_rate) || 500) / 8),
            distance_km: w.distance_km || 3.2,
            availableStatus: 'Available for tomorrow'
          });
        }
      });
    }
    return merged;
  }, [workers]);

  // Handle Search & Filter logic
  const filteredList = useMemo(() => {
    return allWorkers.filter((w) => {
      // Search input filter
      if (searchInput.trim()) {
        const q = searchInput.toLowerCase();
        const matchesName = w.name?.toLowerCase().includes(q);
        const matchesSkills = w.skills?.some((s) => s.toLowerCase().includes(q));
        const matchesProf = w.profession?.toLowerCase().includes(q);
        if (!matchesName && !matchesSkills && !matchesProf) return false;
      }

      // Skill pill filter
      if (activeSkillFilter) {
        const matchesSkill = w.skills?.some((s) => s.toLowerCase().includes(activeSkillFilter.toLowerCase()));
        if (!matchesSkill) return false;
      }

      // Price filter
      if (w.daily_rate && w.daily_rate > priceMax) return false;

      // Booking method
      if (!bookingMethod.phone && w.communication_type === 'non_smartphone') return false;
      if (!bookingMethod.app && w.communication_type === 'smartphone') return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'Recommended') {
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'Lowest Price') return (a.daily_rate || 0) - (b.daily_rate || 0);
      if (sortBy === 'Highest Rated') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'Most Experienced') return (b.experience || 0) - (a.experience || 0);
      if (sortBy === 'Available Soonest') return (b.reliability || 0) - (a.reliability || 0);
      return 0;
    });
  }, [allWorkers, searchInput, activeSkillFilter, priceMax, bookingMethod, sortBy]);

  const handleClearFilters = () => {
    setSearchInput('');
    setActiveSkillFilter('');
    setPriceMax(800);
    setAvailFilter({ today: false, tomorrow: true, thisWeek: false });
    setExpFilter({ '1-3': false, '3-5': false, '5-10': false, '10+': false });
    setRatingFilter({ '4-': false, '4.5+': false });
    setGovtVerifiedOnly(false);
    setBookingMethod({ phone: true, app: true });
    setDistanceFilter({ '2km': false, '5km': false, '10km': false });
  };

  return (
    <div className="hl-find-workers-page">
      <div className="container" style={{ padding: '0 16px 64px' }}>
        {/* =========================================================
            1. TOP CATEGORY BANNER (Section 9 Header)
            ========================================================= */}
        <div className="hl-category-banner">
          <div className="hl-banner-left">
            {/* Back Button */}
            <button
              type="button"
              className="hl-back-link"
              onClick={onBack}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            {/* Title, Count & Availability Indicator */}
            <h1 className="hl-category-title">
              {selectedService === 'Electrician' ? 'Electricians near you' : `${selectedService}s near you`}
            </h1>
            <div className="hl-category-meta-line" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <span>{filteredList.length} professionals available</span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: 600 }}>
                <span className="hl-avail-green-dot" />
                <span>Available tomorrow</span>
              </span>
            </div>

            {/* Search Bar Bar with Dropdown & Orange Search Button */}
            <div className="hl-search-bar-wrap">
              <div className="hl-search-input-box">
                <Search size={18} className="hl-search-icon" />
                <input
                  type="text"
                  placeholder="Search service (e.g. wiring, MCB, fan installation...)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="hl-search-input"
                />
              </div>

              <div className="hl-search-divider" />

              <div className="hl-search-loc-box">
                <MapPin size={16} className="hl-loc-icon" />
                <select
                  value={currentCity}
                  onChange={(e) => setCurrentCity(e.target.value)}
                  className="hl-loc-select"
                >
                  <option value="Govindpura, Bihar">Govindpura, Bihar</option>
                  <option value="MP Nagar, Bhopal">MP Nagar, Bhopal</option>
                  <option value="Kolar Road, Bhopal">Kolar Road, Bhopal</option>
                  <option value="Arera Hills, Bhopal">Arera Hills, Bhopal</option>
                  <option value="Boring Road, Patna">Boring Road, Patna</option>
                  <option value="Connaught Place, Delhi">Connaught Place, Delhi</option>
                </select>
                <ChevronDown size={14} className="hl-loc-chevron" />
              </div>

              <button
                type="button"
                className="hl-search-btn-orange"
                onClick={() => {}}
              >
                Search
              </button>
            </div>

            {/* Popular Services Row */}
            <div className="hl-popular-services-row">
              <span className="hl-pop-label">Popular services:</span>

              <button
                type="button"
                className={`hl-pop-chip ${activeSkillFilter === 'House Wiring' ? 'is-active' : ''}`}
                onClick={() => setActiveSkillFilter(activeSkillFilter === 'House Wiring' ? '' : 'House Wiring')}
              >
                <Home size={14} />
                <span>House Wiring</span>
              </button>

              <button
                type="button"
                className={`hl-pop-chip ${activeSkillFilter === 'MCB' ? 'is-active' : ''}`}
                onClick={() => setActiveSkillFilter(activeSkillFilter === 'MCB' ? '' : 'MCB')}
              >
                <Zap size={14} />
                <span>MCB / Switches</span>
              </button>

              <button
                type="button"
                className={`hl-pop-chip ${activeSkillFilter === 'Fan' ? 'is-active' : ''}`}
                onClick={() => setActiveSkillFilter(activeSkillFilter === 'Fan' ? '' : 'Fan')}
              >
                <Wind size={14} />
                <span>Fan Installation</span>
              </button>

              <button
                type="button"
                className={`hl-pop-chip ${activeSkillFilter === 'Lighting' ? 'is-active' : ''}`}
                onClick={() => setActiveSkillFilter(activeSkillFilter === 'Lighting' ? '' : 'Lighting')}
              >
                <Sparkles size={14} />
                <span>Lighting</span>
              </button>

              <button
                type="button"
                className="hl-pop-chip"
                onClick={() => setActiveSkillFilter('')}
              >
                <span>More</span>
                <ChevronDown size={12} />
              </button>
            </div>
          </div>

          {/* Right Electrician Illustration */}
          <div className="hl-banner-illustration" aria-hidden="true">
            <svg width="220" height="150" viewBox="0 0 220 150" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M70 150V55C70 24.6243 94.6243 0 125 0C155.376 0 180 24.6243 180 55V150H70Z" fill="#FCEBDC" />
              <line x1="165" y1="0" x2="165" y2="40" stroke="#1D2421" strokeWidth="2.5" />
              <path d="M152 48C152 40.8203 157.82 35 165 35C172.18 35 178 40.8203 178 48H152Z" fill="#1D2421" />
              <ellipse cx="165" cy="49" rx="13" ry="3" fill="#374151" />
              <circle cx="165" cy="52" r="5" fill="#FBBF24" />
              <path d="M150 65L142 80M165 65V82M180 65L188 80" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 3" />
              <line x1="140" y1="95" x2="132" y2="150" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="156" y1="95" x2="166" y2="150" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="137" y1="110" x2="159" y2="110" stroke="#94A3B8" strokeWidth="2" />
              <line x1="135" y1="126" x2="162" y2="126" stroke="#94A3B8" strokeWidth="2" />
              <line x1="133" y1="142" x2="165" y2="142" stroke="#94A3B8" strokeWidth="2" />
              <path d="M115 150V118C115 114 118 110 122 110H132V150H124V126H120V150H115Z" fill="#1E40AF" />
              <rect x="110" y="80" width="22" height="32" rx="4" fill="#2563EB" />
              <rect x="113" y="80" width="3" height="18" fill="#1D4ED8" />
              <rect x="125" y="80" width="3" height="18" fill="#1D4ED8" />
              <path d="M128 84L148 56L158 50" stroke="#FDBA74" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="156" y="44" width="2.5" height="10" transform="rotate(-35 156 44)" fill="#EA580C" />
              <rect x="162" y="40" width="1.5" height="7" transform="rotate(-35 162 40)" fill="#94A3B8" />
              <path d="M112 84L105 102L112 108" stroke="#FDBA74" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="117" y="72" width="6" height="9" fill="#FDBA74" />
              <circle cx="120" cy="65" r="9" fill="#FDBA74" />
              <path d="M113 64C113 67 115 71 120 71C124 71 126 68 126 64" fill="#451A03" />
              <path d="M111 63C111 57 115 54 122 54C128 54 131 57 131 63H111Z" fill="#EA580C" />
              <path d="M122 59H135" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* =========================================================
            2. MAIN 2-COLUMN LAYOUT: SIDEBAR FILTERS + RESULTS GRID
            ========================================================= */}
        <div className="hl-two-col-layout">
          {/* LEFT: Filters Sidebar */}
          <aside className="hl-filters-sidebar">
            <div className="hl-filters-head">
              <div className="hl-filters-title">
                <Search size={16} />
                <span>Filters</span>
              </div>
              <button
                type="button"
                className="hl-clear-all-btn"
                onClick={handleClearFilters}
              >
                Clear All
              </button>
            </div>

            {/* Section 1: Availability */}
            <div className="hl-filter-section">
              <div className="hl-filter-section-title">
                <span>Availability</span>
                <ChevronDown size={14} className="hl-filter-chevron" />
              </div>
              <div className="hl-checkbox-list">
                <label className="hl-checkbox-label">
                  <input
                    type="checkbox"
                    checked={availFilter.today}
                    onChange={(e) => setAvailFilter({ ...availFilter, today: e.target.checked })}
                    className="hl-custom-checkbox"
                  />
                  <span>Today</span>
                </label>
                <label className="hl-checkbox-label">
                  <input
                    type="checkbox"
                    checked={availFilter.tomorrow}
                    onChange={(e) => setAvailFilter({ ...availFilter, tomorrow: e.target.checked })}
                    className="hl-custom-checkbox"
                  />
                  <span>Tomorrow</span>
                </label>
                <label className="hl-checkbox-label">
                  <input
                    type="checkbox"
                    checked={availFilter.thisWeek}
                    onChange={(e) => setAvailFilter({ ...availFilter, thisWeek: e.target.checked })}
                    className="hl-custom-checkbox"
                  />
                  <span>This week</span>
                </label>
              </div>
            </div>

            {/* Section 2: Price Range (per day) */}
            <div className="hl-filter-section">
              <div className="hl-filter-section-title">
                <span>Price Range (per day)</span>
              </div>
              <div className="hl-price-labels">
                <span>₹400</span>
                <span>₹{priceMax}</span>
              </div>
              <div className="hl-range-wrap">
                <input
                  type="range"
                  min="400"
                  max="800"
                  step="20"
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="hl-range-slider"
                />
              </div>
            </div>

            {/* Section 3: Experience */}
            <div className="hl-filter-section">
              <div className="hl-filter-section-title">
                <span>Experience</span>
                <ChevronDown size={14} className="hl-filter-chevron" />
              </div>
              <div className="hl-checkbox-list">
                <label className="hl-checkbox-label">
                  <input
                    type="checkbox"
                    checked={expFilter['1-3']}
                    onChange={(e) => setExpFilter({ ...expFilter, '1-3': e.target.checked })}
                    className="hl-custom-checkbox"
                  />
                  <span>1–3 years</span>
                </label>
                <label className="hl-checkbox-label">
                  <input
                    type="checkbox"
                    checked={expFilter['3-5']}
                    onChange={(e) => setExpFilter({ ...expFilter, '3-5': e.target.checked })}
                    className="hl-custom-checkbox"
                  />
                  <span>3–5 years</span>
                </label>
                <label className="hl-checkbox-label">
                  <input
                    type="checkbox"
                    checked={expFilter['5-10']}
                    onChange={(e) => setExpFilter({ ...expFilter, '5-10': e.target.checked })}
                    className="hl-custom-checkbox"
                  />
                  <span>5–10 years</span>
                </label>
                <label className="hl-checkbox-label">
                  <input
                    type="checkbox"
                    checked={expFilter['10+']}
                    onChange={(e) => setExpFilter({ ...expFilter, '10+': e.target.checked })}
                    className="hl-custom-checkbox"
                  />
                  <span>10+ years</span>
                </label>
              </div>
            </div>

            {/* Section 4: Rating */}
            <div className="hl-filter-section">
              <div className="hl-filter-section-title">
                <span>Rating</span>
                <ChevronDown size={14} className="hl-filter-chevron" />
              </div>
              <div className="hl-checkbox-list">
                <label className="hl-checkbox-label">
                  <input
                    type="checkbox"
                    checked={ratingFilter['4-']}
                    onChange={(e) => setRatingFilter({ ...ratingFilter, '4-': e.target.checked })}
                    className="hl-custom-checkbox"
                  />
                  <span>4– ★</span>
                </label>
                <label className="hl-checkbox-label">
                  <input
                    type="checkbox"
                    checked={ratingFilter['4.5+']}
                    onChange={(e) => setRatingFilter({ ...ratingFilter, '4.5+': e.target.checked })}
                    className="hl-custom-checkbox"
                  />
                  <span>4.5+ ★</span>
                </label>
              </div>
            </div>

            {/* Section 5: Verification */}
            <div className="hl-filter-section">
              <div className="hl-filter-section-title">
                <span>Verification</span>
                <ChevronDown size={14} className="hl-filter-chevron" />
              </div>
              <div className="hl-checkbox-list">
                <label className="hl-checkbox-label">
                  <input
                    type="checkbox"
                    checked={govtVerifiedOnly}
                    onChange={(e) => setGovtVerifiedOnly(e.target.checked)}
                    className="hl-custom-checkbox"
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ShieldCheck size={14} color="#16A34A" />
                    <span>Government Verified</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Section 6: Booking Method */}
            <div className="hl-filter-section">
              <div className="hl-filter-section-title">
                <span>Booking Method</span>
                <ChevronDown size={14} className="hl-filter-chevron" />
              </div>
              <div className="hl-checkbox-list">
                <label className="hl-checkbox-label">
                  <input
                    type="checkbox"
                    checked={bookingMethod.phone}
                    onChange={(e) => setBookingMethod({ ...bookingMethod, phone: e.target.checked })}
                    className="hl-custom-checkbox"
                  />
                  <span>Phone Booking (Call)</span>
                </label>
                <label className="hl-checkbox-label">
                  <input
                    type="checkbox"
                    checked={bookingMethod.app}
                    onChange={(e) => setBookingMethod({ ...bookingMethod, app: e.target.checked })}
                    className="hl-custom-checkbox"
                  />
                  <span>App Booking</span>
                </label>
              </div>
            </div>

            {/* Section 7: Distance */}
            <div className="hl-filter-section">
              <div className="hl-filter-section-title">
                <span>Distance</span>
                <ChevronDown size={14} className="hl-filter-chevron" />
              </div>
              <div className="hl-checkbox-list">
                <label className="hl-checkbox-label">
                  <input
                    type="checkbox"
                    checked={distanceFilter['2km']}
                    onChange={(e) => setDistanceFilter({ ...distanceFilter, '2km': e.target.checked })}
                    className="hl-custom-checkbox"
                  />
                  <span>Within 2 km</span>
                </label>
                <label className="hl-checkbox-label">
                  <input
                    type="checkbox"
                    checked={distanceFilter['5km']}
                    onChange={(e) => setDistanceFilter({ ...distanceFilter, '5km': e.target.checked })}
                    className="hl-custom-checkbox"
                  />
                  <span>Within 5 km</span>
                </label>
                <label className="hl-checkbox-label">
                  <input
                    type="checkbox"
                    checked={distanceFilter['10km']}
                    onChange={(e) => setDistanceFilter({ ...distanceFilter, '10km': e.target.checked })}
                    className="hl-custom-checkbox"
                  />
                  <span>Within 10 km</span>
                </label>
              </div>
            </div>
          </aside>

          {/* RIGHT: Results Area */}
          <main className="hl-results-area">
            {/* Results Meta Bar */}
            <div className="hl-results-meta-bar">
              <div className="hl-results-left">
                <div className="hl-count-pill-row">
                  <h2 className="hl-results-count-title">
                    {filteredList.length} electricians found
                  </h2>
                  <span className="hl-avail-badge">
                    <span className="hl-avail-green-circle" />
                    <span>Available for tomorrow</span>
                  </span>
                </div>
                <p className="hl-results-sub">
                  Based on your location and preferences
                </p>
              </div>

              {/* Sort By Dropdown */}
              <div className="hl-sort-box">
                <span className="hl-sort-label">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="hl-sort-select"
                >
                  <option value="Recommended">Recommended</option>
                  <option value="Lowest Price">Lowest Price</option>
                  <option value="Highest Rated">Highest Rated</option>
                  <option value="Most Experienced">Most Experienced</option>
                  <option value="Available Soonest">Available Soonest</option>
                </select>
              </div>
            </div>

            {/* 3-Column Workers Cards Grid */}
            <div className="hl-cards-grid">
              {filteredList.map((worker) => (
                <WorkerCard
                  key={worker.worker_id}
                  worker={worker}
                  onSelectWorker={onSelectWorker}
                  onBookWorker={onBookWorker}
                  isRecommended={worker.isRecommended}
                />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
