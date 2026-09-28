import React, { useState, useEffect, useRef } from 'react';
import WorkerCard from './WorkerCard';
import DynamicWorkerShowcase from './DynamicWorkerShowcase';
import LandingHeroSection from './LandingHeroSection';
import PopularServicesGrid from './PopularServicesGrid';
import HowItWorksSection from './HowItWorksSection';
import PricingTransparencySection from './PricingTransparencySection';
import CallBotVoiceSection from './CallBotVoiceSection';
import WorkerRecruitSection from './WorkerRecruitSection';
import Footer from './Footer';
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

  const handleHeroSearch = (query, location) => {
    if (location) setLocationQuery(location);
    if (query) setSelectedService(query);
    if (onSearchSubmit) {
      onSearchSubmit(query, location, bookingDate);
    } else if (onSelectService && query) {
      onSelectService(query);
    } else if (onFindWorker) {
      onFindWorker();
    }
  };

  const handlePopularServicePick = (srvName) => {
    setSelectedService(srvName);
    if (onSelectService) {
      onSelectService(srvName);
    } else if (onFindWorker) {
      onFindWorker();
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', width: '100%', minHeight: '100vh' }}>
      {/* 1. HERO SECTION (Mockup Image 1) */}
      <LandingHeroSection
        onSearch={handleHeroSearch}
        onSelectLocation={(loc) => setLocationQuery(loc)}
        currentLocation={locationQuery || 'Govindpura, Bihar'}
      />

      {/* 2. POPULAR SERVICES 8-CARD GRID (Mockup Image 1) */}
      <PopularServicesGrid
        onSelectService={handlePopularServicePick}
        onViewAll={onFindWorker}
      />

      {/* 3. HOW IT WORKS (Section 8) */}
      <HowItWorksSection />

      {/* ==================================================
          4. DYNAMIC WORKER SHOWCASE & HYPERLOCAL ARTISANS
          ================================================== */}
      <DynamicWorkerShowcase
        workers={workers}
        onSelectWorker={onSelectWorker}
        onBookWorker={onBookWorker}
        onFindWorker={onFindWorker}
        onOpenCallbot={onOpenCallbot}
        selectedPincode={selectedPincode}
      />

      {/* 5. CALLBOT / HIRELOCAL VOICE SECTION (Section 15) */}
      <CallBotVoiceSection onOpenCallbot={onOpenCallbot || onFindWorker} />

      {/* 6. PRICING / TRANSPARENCY SECTION (Section 20) */}
      <PricingTransparencySection onFindWorker={onFindWorker} />

      {/* 7. WORKER RECRUITMENT SECTION (Section 21) */}
      <WorkerRecruitSection onWorkAsWorker={onWorkAsWorker} />

      {/* 8. FOOTER (Section 22) */}
      <Footer
        onFindWorker={onFindWorker}
        onWorkAsWorker={onWorkAsWorker}
        onOpenCallbot={onOpenCallbot}
      />

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
