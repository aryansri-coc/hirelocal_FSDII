import React, { useState, useMemo, useRef, useEffect } from 'react';
import WorkerCard from './WorkerCard';
import PincodeAddressSelector from './PincodeAddressSelector';
import {
  ArrowLeft,
  Search,
  MapPin,
  ChevronDown,
  ChevronUp,
  Zap,
  Wrench,
  Hammer,
  Paintbrush,
  Tv,
  Sparkles,
  ShieldCheck,
  Calendar,
  Phone,
  Smartphone,
  Star,
  CheckCircle2,
  Filter,
  Check,
  SlidersHorizontal,
  X
} from 'lucide-react';

// =========================================================
// TRADE CATEGORIES - ORDERED MATCHING IMAGE 1
// 1. Plumber (Top card)
// 2. Electrician (Active orange card)
// 3. Mechanic (Bottom red card)
// Followed by Carpenter, Painter, Appliance Repair, Deep Cleaning
// =========================================================
export const TRADE_CATEGORIES = [
  {
    id: 'plumber',
    name: 'Plumber',
    slug: 'plumber',
    Icon: Wrench,
    className: 'hl-trade-card-plumber',
    color: '#0284C7', // Sky / Ocean Blue Water Theme
    tagline: 'Leaks, sanitary, tap fittings & pumps',
    badge: '5 Pros'
  },
  {
    id: 'electrician',
    name: 'Electrician',
    slug: 'electrician',
    Icon: Zap,
    className: 'hl-trade-card-electrician',
    color: '#2563EB', // Blue as explicitly requested
    tagline: 'Wiring, MCB, fans, switchboards & inverters',
    badge: '6 Pros'
  },
  {
    id: 'mechanic',
    name: 'Mechanic',
    slug: 'mechanic',
    Icon: Hammer,
    className: 'hl-trade-card-mechanic',
    color: '#DC2626',
    tagline: 'AC servicing, compressor, motor & pumps',
    badge: '5 Pros'
  },
  {
    id: 'carpenter',
    name: 'Carpenter',
    slug: 'carpenter',
    Icon: Hammer,
    className: 'hl-trade-card-carpenter',
    color: '#D97706',
    tagline: 'Furniture repair, locks, custom woodwork',
    badge: '4 Pros'
  },
  {
    id: 'painter',
    name: 'Painter',
    slug: 'painter',
    Icon: Paintbrush,
    className: 'hl-trade-card-painter',
    color: '#16A34A',
    tagline: 'Interior/exterior putty, waterproof, textures',
    badge: '4 Pros'
  },
  {
    id: 'appliance',
    name: 'Appliance Repair',
    slug: 'appliance-repair',
    Icon: Tv,
    className: 'hl-trade-card-appliance',
    color: '#7C3AED',
    tagline: 'Washing machine, fridge, microwave, RO',
    badge: '4 Pros'
  },
  {
    id: 'cleaning',
    name: 'Deep Cleaning',
    slug: 'cleaning',
    Icon: Sparkles,
    className: 'hl-trade-card-cleaning',
    color: '#0D9488',
    tagline: 'Full home, kitchen, bathroom sanitization',
    badge: '3 Pros'
  }
];

// Comprehensive worker catalog by profession
const TRADE_WORKERS_CATALOG = {
  electrician: [
    {
      worker_id: 'wrk_elec_1',
      name: 'Mukesh Sharma',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      profession: 'Electrician',
      experience: 11,
      rating: 4.9,
      completed_jobs: 142,
      reliability: 98,
      distance_km: 2.4,
      daily_rate: 550,
      hourly_rate: 69,
      communication_type: 'non_smartphone',
      isRecommended: true,
      availableStatus: 'Available for tomorrow',
      skills: ['House Wiring', 'MCB Installation', 'Fan Installation', '+2'],
      location: { name: 'Govindpura, Bihar' }
    },
    {
      worker_id: 'wrk_elec_2',
      name: 'Vijay Prasad',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
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
    },
    {
      worker_id: 'wrk_elec_3',
      name: 'Rohit Kumar',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
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
      skills: ['House Wiring', 'AC Point Installation', 'MCB / Switches', '+1'],
      location: { name: 'Govindpura, Bihar' }
    },
    {
      worker_id: 'wrk_elec_4',
      name: 'Amit Yadav',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
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
      name: 'Sunil Verma',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      profession: 'Electrician',
      experience: 4,
      rating: 4.5,
      completed_jobs: 40,
      reliability: 89,
      distance_km: 3.1,
      daily_rate: 450,
      hourly_rate: 56,
      communication_type: 'smartphone',
      isRecommended: false,
      availableStatus: 'Available for tomorrow',
      skills: ['Switchboard Upgrade', 'LED Lighting', 'Earthing Check'],
      location: { name: 'Govindpura, Bihar' }
    },
    {
      worker_id: 'wrk_elec_6',
      name: 'Rakesh Singh',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
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
    }
  ],

  plumber: [
    {
      worker_id: 'wrk_plumb_1',
      name: 'Ramesh Kumar',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
      profession: 'Plumber',
      experience: 9,
      rating: 4.9,
      completed_jobs: 134,
      reliability: 97,
      distance_km: 1.8,
      daily_rate: 550,
      hourly_rate: 69,
      communication_type: 'non_smartphone',
      isRecommended: true,
      availableStatus: 'Available for tomorrow',
      skills: ['Pipe Leaks', 'Sanitary Ware', 'Tap Fittings', 'Water Tank'],
      location: { name: 'Govindpura, Bihar' }
    },
    {
      worker_id: 'wrk_plumb_2',
      name: 'Deepak Jha',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      profession: 'Plumber',
      experience: 7,
      rating: 4.8,
      completed_jobs: 92,
      reliability: 95,
      distance_km: 3.4,
      daily_rate: 600,
      hourly_rate: 75,
      communication_type: 'smartphone',
      isRecommended: false,
      availableStatus: 'Available for tomorrow',
      skills: ['Bathroom Renovation', 'Geyser Piping', 'Drainage'],
      location: { name: 'Govindpura, Bihar' }
    },
    {
      worker_id: 'wrk_plumb_3',
      name: 'Rajesh Verma',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
      profession: 'Plumber',
      experience: 5,
      rating: 4.6,
      completed_jobs: 64,
      reliability: 91,
      distance_km: 4.1,
      daily_rate: 480,
      hourly_rate: 60,
      communication_type: 'non_smartphone',
      isRecommended: false,
      availableStatus: 'Available for tomorrow',
      skills: ['Tap Fitting', 'Motor Installation', 'Water Pump'],
      location: { name: 'Govindpura, Bihar' }
    },
    {
      worker_id: 'wrk_plumb_4',
      name: 'Manoj Kumar',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
      profession: 'Plumber',
      experience: 8,
      rating: 4.7,
      completed_jobs: 105,
      reliability: 93,
      distance_km: 2.7,
      daily_rate: 520,
      hourly_rate: 65,
      communication_type: 'smartphone',
      isRecommended: false,
      availableStatus: 'Available for tomorrow',
      skills: ['Pipeline Repair', 'Flush Tank', 'Sink Fitting'],
      location: { name: 'Govindpura, Bihar' }
    },
    {
      worker_id: 'wrk_plumb_5',
      name: 'Santosh Mishra',
      avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&auto=format&fit=crop&q=80',
      profession: 'Plumber',
      experience: 12,
      rating: 4.9,
      completed_jobs: 168,
      reliability: 98,
      distance_km: 5.0,
      daily_rate: 650,
      hourly_rate: 81,
      communication_type: 'non_smartphone',
      isRecommended: false,
      availableStatus: 'Available for tomorrow',
      skills: ['Main Pipeline', 'Underground Leaks', 'Commercial Plumbing'],
      location: { name: 'Govindpura, Bihar' }
    }
  ],

  mechanic: [
    {
      worker_id: 'wrk_mech_1',
      name: 'Sameer Khan',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      profession: 'Mechanic',
      experience: 8,
      rating: 4.9,
      completed_jobs: 128,
      reliability: 98,
      distance_km: 2.1,
      daily_rate: 700,
      hourly_rate: 88,
      communication_type: 'non_smartphone',
      isRecommended: true,
      availableStatus: 'Available for tomorrow',
      skills: ['Split AC Servicing', 'Gas Refill', 'Compressor Repair', '+1'],
      location: { name: 'Govindpura, Bihar' }
    },
    {
      worker_id: 'wrk_mech_2',
      name: 'Ajay Sen',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
      profession: 'Mechanic',
      experience: 6,
      rating: 4.7,
      completed_jobs: 84,
      reliability: 94,
      distance_km: 3.8,
      daily_rate: 650,
      hourly_rate: 81,
      communication_type: 'smartphone',
      isRecommended: false,
      availableStatus: 'Available for tomorrow',
      skills: ['Inverter AC PCB Check', 'Duct Cleaning', 'Installation'],
      location: { name: 'Govindpura, Bihar' }
    },
    {
      worker_id: 'wrk_mech_3',
      name: 'Vikram Rathore',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
      profession: 'Mechanic',
      experience: 10,
      rating: 4.8,
      completed_jobs: 142,
      reliability: 96,
      distance_km: 4.5,
      daily_rate: 750,
      hourly_rate: 94,
      communication_type: 'non_smartphone',
      isRecommended: false,
      availableStatus: 'Available for tomorrow',
      skills: ['Commercial HVAC', 'Gas Leakage', 'Heavy Compressor'],
      location: { name: 'Govindpura, Bihar' }
    },
    {
      worker_id: 'wrk_mech_4',
      name: 'Dinesh Yadav',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
      profession: 'Mechanic',
      experience: 5,
      rating: 4.5,
      completed_jobs: 58,
      reliability: 90,
      distance_km: 2.9,
      daily_rate: 580,
      hourly_rate: 72,
      communication_type: 'smartphone',
      isRecommended: false,
      availableStatus: 'Available for tomorrow',
      skills: ['Window AC Fix', 'Filter Wash', 'Coil Soldering'],
      location: { name: 'Govindpura, Bihar' }
    },
    {
      worker_id: 'wrk_mech_5',
      name: 'Imran Ali',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
      profession: 'Mechanic',
      experience: 7,
      rating: 4.6,
      completed_jobs: 91,
      reliability: 92,
      distance_km: 3.2,
      daily_rate: 620,
      hourly_rate: 77,
      communication_type: 'non_smartphone',
      isRecommended: false,
      availableStatus: 'Available for tomorrow',
      skills: ['AC Installation', 'Copper Piping', 'Thermostat Setup'],
      location: { name: 'Govindpura, Bihar' }
    }
  ],

  carpenter: [
    {
      worker_id: 'wrk_carp_1',
      name: 'Suresh Carpenter',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      profession: 'Carpenter',
      experience: 9,
      rating: 4.8,
      completed_jobs: 115,
      reliability: 96,
      distance_km: 2.6,
      daily_rate: 700,
      hourly_rate: 88,
      communication_type: 'non_smartphone',
      isRecommended: true,
      availableStatus: 'Available for tomorrow',
      skills: ['Furniture Repair', 'Modular Kitchen', 'Door Hinges & Locks'],
      location: { name: 'Govindpura, Bihar' }
    },
    {
      worker_id: 'wrk_carp_2',
      name: 'Harish Mistry',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
      profession: 'Carpenter',
      experience: 12,
      rating: 4.9,
      completed_jobs: 172,
      reliability: 98,
      distance_km: 4.2,
      daily_rate: 750,
      hourly_rate: 94,
      communication_type: 'smartphone',
      isRecommended: false,
      availableStatus: 'Available for tomorrow',
      skills: ['Custom Wardrobe', 'Wooden Flooring', 'Sliding Doors'],
      location: { name: 'Govindpura, Bihar' }
    },
    {
      worker_id: 'wrk_carp_3',
      name: 'Vinod Sharma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      profession: 'Carpenter',
      experience: 6,
      rating: 4.6,
      completed_jobs: 78,
      reliability: 92,
      distance_km: 3.1,
      daily_rate: 600,
      hourly_rate: 75,
      communication_type: 'non_smartphone',
      isRecommended: false,
      availableStatus: 'Available for tomorrow',
      skills: ['Bed Assembly', 'Drawer Repair', 'Chair Fixing'],
      location: { name: 'Govindpura, Bihar' }
    },
    {
      worker_id: 'wrk_carp_4',
      name: 'Babloo Prajapati',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
      profession: 'Carpenter',
      experience: 8,
      rating: 4.7,
      completed_jobs: 98,
      reliability: 94,
      distance_km: 1.9,
      daily_rate: 650,
      hourly_rate: 81,
      communication_type: 'smartphone',
      isRecommended: false,
      availableStatus: 'Available for tomorrow',
      skills: ['Wood Polishing', 'Lock Replacement', 'Shelving Units'],
      location: { name: 'Govindpura, Bihar' }
    }
  ],

  painter: [
    {
      worker_id: 'wrk_paint_1',
      name: 'Raju Painter',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      profession: 'Painter',
      experience: 10,
      rating: 4.8,
      completed_jobs: 136,
      reliability: 96,
      distance_km: 2.5,
      daily_rate: 650,
      hourly_rate: 81,
      communication_type: 'non_smartphone',
      isRecommended: true,
      availableStatus: 'Available for tomorrow',
      skills: ['Interior Walls', 'Waterproof Putty', 'Royal Luxury Finish'],
      location: { name: 'Govindpura, Bihar' }
    },
    {
      worker_id: 'wrk_paint_2',
      name: 'Gopal Sen',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      profession: 'Painter',
      experience: 7,
      rating: 4.7,
      completed_jobs: 89,
      reliability: 93,
      distance_km: 3.7,
      daily_rate: 600,
      hourly_rate: 75,
      communication_type: 'smartphone',
      isRecommended: false,
      availableStatus: 'Available for tomorrow',
      skills: ['Exterior Weatherproof', 'Enamel Polish', 'Primer Coat'],
      location: { name: 'Govindpura, Bihar' }
    },
    {
      worker_id: 'wrk_paint_3',
      name: 'Sanjay Kushwaha',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
      profession: 'Painter',
      experience: 8,
      rating: 4.6,
      completed_jobs: 102,
      reliability: 91,
      distance_km: 4.4,
      daily_rate: 580,
      hourly_rate: 72,
      communication_type: 'non_smartphone',
      isRecommended: false,
      availableStatus: 'Available for tomorrow',
      skills: ['Texture Design', 'Stencil Painting', 'Ceiling Coat'],
      location: { name: 'Govindpura, Bihar' }
    },
    {
      worker_id: 'wrk_paint_4',
      name: 'Prem Kumar',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
      profession: 'Painter',
      experience: 5,
      rating: 4.5,
      completed_jobs: 61,
      reliability: 89,
      distance_km: 2.2,
      daily_rate: 520,
      hourly_rate: 65,
      communication_type: 'smartphone',
      isRecommended: false,
      availableStatus: 'Available for tomorrow',
      skills: ['Wall Putty', 'Damp Treatment', 'Door Painting'],
      location: { name: 'Govindpura, Bihar' }
    }
  ],

  appliance: [
    {
      worker_id: 'wrk_app_1',
      name: 'Vikas Sharma',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
      profession: 'Appliance Repair',
      experience: 8,
      rating: 4.8,
      completed_jobs: 114,
      reliability: 96,
      distance_km: 2.8,
      daily_rate: 600,
      hourly_rate: 75,
      communication_type: 'smartphone',
      isRecommended: true,
      availableStatus: 'Available for tomorrow',
      skills: ['Washing Machine Drum', 'Refrigerator Cooling', 'Microwave PCB'],
      location: { name: 'Govindpura, Bihar' }
    },
    {
      worker_id: 'wrk_app_2',
      name: 'Arvind Kumar',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
      profession: 'Appliance Repair',
      experience: 6,
      rating: 4.7,
      completed_jobs: 82,
      reliability: 94,
      distance_km: 3.5,
      daily_rate: 550,
      hourly_rate: 69,
      communication_type: 'non_smartphone',
      isRecommended: false,
      availableStatus: 'Available for tomorrow',
      skills: ['RO Water Purifier', 'Geyser Heating Element', 'Inverter Setup'],
      location: { name: 'Govindpura, Bihar' }
    },
    {
      worker_id: 'wrk_app_3',
      name: 'Nitin Chawla',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
      profession: 'Appliance Repair',
      experience: 9,
      rating: 4.9,
      completed_jobs: 140,
      reliability: 97,
      distance_km: 4.6,
      daily_rate: 680,
      hourly_rate: 85,
      communication_type: 'smartphone',
      isRecommended: false,
      availableStatus: 'Available for tomorrow',
      skills: ['Front Load Washer', 'Double Door Fridge', 'Induction Cooktop'],
      location: { name: 'Govindpura, Bihar' }
    }
  ],

  cleaning: [
    {
      worker_id: 'wrk_clean_1',
      name: 'Sunita Bai & Team',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      profession: 'Deep Cleaning',
      experience: 6,
      rating: 4.9,
      completed_jobs: 126,
      reliability: 98,
      distance_km: 2.0,
      daily_rate: 800,
      hourly_rate: 100,
      communication_type: 'non_smartphone',
      isRecommended: true,
      availableStatus: 'Available for tomorrow',
      skills: ['Full Home Sanitization', 'Kitchen Degreasing', 'Bathroom Scrubbing'],
      location: { name: 'Govindpura, Bihar' }
    },
    {
      worker_id: 'wrk_clean_2',
      name: 'Anita Devi',
      avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&auto=format&fit=crop&q=80',
      profession: 'Deep Cleaning',
      experience: 5,
      rating: 4.8,
      completed_jobs: 90,
      reliability: 95,
      distance_km: 3.3,
      daily_rate: 750,
      hourly_rate: 94,
      communication_type: 'smartphone',
      isRecommended: false,
      availableStatus: 'Available for tomorrow',
      skills: ['Sofa Shampooing', 'Floor Machine Buffing', 'Balcony Deep Clean'],
      location: { name: 'Govindpura, Bihar' }
    }
  ]
};

export default function FindWorkersView({
  workers = [],
  selectedService = 'Electrician',
  onBack,
  onSelectWorker,
  onBookWorker,
  onSelectService,
  selectedLocation = { pincode: '462011', locality: 'MP Nagar', district: 'Bhopal', label: 'MP Nagar (462011)' },
  onSelectLocation,
  isLandingPageSection = false
}) {
  const initialTradeId = useMemo(() => {
    const s = (selectedService || '').toLowerCase();
    if (s.includes('plumb')) return 'plumber';
    if (s.includes('elec')) return 'electrician';
    if (s.includes('mech') || s.includes('ac')) return 'mechanic';
    if (s.includes('carp')) return 'carpenter';
    if (s.includes('paint')) return 'painter';
    if (s.includes('appliance')) return 'appliance';
    if (s.includes('clean')) return 'cleaning';
    return 'plumber';
  }, [selectedService]);

  const [activeTradeId, setActiveTradeId] = useState(initialTradeId);
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('Recommended');
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');
  const [selectedLocState, setSelectedLocState] = useState(selectedLocation);
  const [isLocSwitcherOpen, setIsLocSwitcherOpen] = useState(false);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

  const scrollBoxRef = useRef(null);
  const cardRefs = useRef({});
  const filterPopoverRef = useRef(null);
  const locSwitcherRef = useRef(null);

  useEffect(() => {
    if (selectedLocation) {
      setSelectedLocState(selectedLocation);
    }
  }, [selectedLocation]);

  const locPincode = typeof selectedLocState === 'object' && selectedLocState?.pincode
    ? selectedLocState.pincode
    : (typeof selectedLocState === 'string' ? selectedLocState.match(/\d{6}/)?.[0] || '462011' : '462011');

  const locName = typeof selectedLocState === 'object'
    ? (selectedLocState.locality || selectedLocState.name || selectedLocState.district || 'MP Nagar')
    : (typeof selectedLocState === 'string' ? selectedLocState.split('(')[0]?.trim() || 'MP Nagar' : 'MP Nagar');

  const handleSelectLoc = (addr) => {
    setSelectedLocState(addr);
    setIsLocSwitcherOpen(false);
    if (onSelectLocation) {
      onSelectLocation(addr);
    }
  };

  // Close popovers on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target)) {
        setIsFilterPopoverOpen(false);
      }
      if (locSwitcherRef.current && !locSwitcherRef.current.contains(e.target)) {
        setIsLocSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const currentFilterLabel = useMemo(() => {
    switch (activeQuickFilter) {
      case 'verified': return 'Verified Pro';
      case 'tomorrow': return 'Available Tomorrow';
      case 'price600': return 'Under ₹600/day';
      case 'phone': return 'Phone Booking';
      case 'app': return 'App Booking';
      default: return 'All Pros';
    }
  }, [activeQuickFilter]);

  // Sync state if selectedService prop updates
  useEffect(() => {
    if (selectedService) {
      const s = selectedService.toLowerCase();
      const match = TRADE_CATEGORIES.find((t) =>
        s.includes(t.id) || s.includes(t.name.toLowerCase()) || (t.id === 'mechanic' && s.includes('ac'))
      );
      if (match) {
        setActiveTradeId(match.id);
      }
    }
  }, [selectedService]);

  // Center selected card in view on mount or change
  useEffect(() => {
    const el = cardRefs.current[activeTradeId];
    if (el && scrollBoxRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeTradeId]);

  const activeTrade = useMemo(() => {
    return TRADE_CATEGORIES.find((t) => t.id === activeTradeId) || TRADE_CATEGORIES[0];
  }, [activeTradeId]);

  // Scroll down to the next trade in the reel (for Image 1's "scroll down" CTA)
  const handleScrollNextTrade = () => {
    const currentIndex = TRADE_CATEGORIES.findIndex((t) => t.id === activeTradeId);
    const nextIndex = (currentIndex + 1) % TRADE_CATEGORIES.length;
    const nextTrade = TRADE_CATEGORIES[nextIndex];
    handlePickTrade(nextTrade.id);
  };

  const handlePickTrade = (tradeId) => {
    setActiveTradeId(tradeId);
    setSearchInput('');
    setActiveQuickFilter('all');
    const trade = TRADE_CATEGORIES.find((t) => t.id === tradeId);
    if (trade && onSelectService) {
      onSelectService(trade.name);
    }
    const el = cardRefs.current[tradeId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Combine static catalog for this trade with any dynamically fetched workers
  const currentTradeWorkers = useMemo(() => {
    const baseList = TRADE_WORKERS_CATALOG[activeTradeId] || TRADE_WORKERS_CATALOG.electrician;
    const merged = baseList.map((m, idx) => ({
      ...m,
      distance_km: (1.2 + (idx * 0.7)).toFixed(1),
      location: {
        name: `${locName} (${locPincode})`,
        pincode: locPincode,
        district: typeof selectedLocState === 'object' ? selectedLocState.district : 'Bhopal'
      }
    }));

    if (workers && workers.length > 0) {
      workers.forEach((w) => {
        const prof = (w.profession || '').toLowerCase();
        const matchesTrade =
          prof.includes(activeTradeId) ||
          (activeTradeId === 'mechanic' && (prof.includes('ac') || prof.includes('mechanic'))) ||
          prof.includes(activeTrade.name.toLowerCase());

        if (matchesTrade && !merged.some((m) => m.name === w.name)) {
          merged.push({
            ...w,
            hourly_rate: Math.round((Number(w.daily_rate) || 500) / 8),
            distance_km: w.distance_km || (1.5 + (merged.length * 0.4)).toFixed(1),
            availableStatus: 'Available for tomorrow',
            isRecommended: false,
            location: {
              name: `${locName} (${locPincode})`,
              pincode: locPincode
            }
          });
        }
      });
    }
    return merged;
  }, [activeTradeId, activeTrade, workers, locName, locPincode, selectedLocState]);

  // Apply search, quick filters, and sorting
  const filteredList = useMemo(() => {
    return currentTradeWorkers.filter((w) => {
      // Search input filter
      if (searchInput.trim()) {
        const q = searchInput.toLowerCase();
        const matchesName = w.name?.toLowerCase().includes(q);
        const matchesSkills = w.skills?.some((s) => s.toLowerCase().includes(q));
        const matchesProf = w.profession?.toLowerCase().includes(q);
        if (!matchesName && !matchesSkills && !matchesProf) return false;
      }

      // Quick Filter Chips
      if (activeQuickFilter === 'verified' && !w.isRecommended && w.reliability < 92) return false;
      if (activeQuickFilter === 'tomorrow' && !w.availableStatus?.includes('tomorrow')) return false;
      if (activeQuickFilter === 'price600' && (w.daily_rate > 600)) return false;
      if (activeQuickFilter === 'phone' && w.communication_type !== 'non_smartphone') return false;
      if (activeQuickFilter === 'app' && w.communication_type !== 'smartphone') return false;

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
  }, [currentTradeWorkers, searchInput, activeQuickFilter, sortBy]);

  return (
    <div id="find-workers-section" className="hl-find-workers-page" style={{ padding: isLandingPageSection ? '0 0 54px 0' : '20px 0 54px 0' }}>
      <div className="container">
        {!isLandingPageSection && (
          <div style={{ marginBottom: '14px' }}>
            <button
              type="button"
              className="hl-back-link"
              onClick={onBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '14px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </button>
          </div>
        )}

        {/* =========================================================
            IMAGE 1 LAYOUT:
            LEFT: Vertical Scrollable Trade Reel (Plumber, Electrician, Mechanic...)
            RIGHT: Worker Profiles for the Selected Trade
            ========================================================= */}
        <div className="hl-worker-finder-layout">
          {/* =========================================================
              LEFT COLUMN: Trade Category Vertical Scroll Reel (Image 1)
              ========================================================= */}
          <aside className="hl-trade-reel-container">
            <div className="hl-trade-reel-header">
              <span className="hl-trade-reel-title">Select Service</span>
              <span className="hl-trade-reel-count">{TRADE_CATEGORIES.length} Trades</span>
            </div>

            {/* Scrollable Container with Smooth Snap */}
            <div className="hl-trade-reel-scrollbox" ref={scrollBoxRef}>
              {TRADE_CATEGORIES.map((cat) => {
                const isActive = activeTradeId === cat.id;
                const { Icon } = cat;

                return (
                  <div
                    key={cat.id}
                    ref={(el) => (cardRefs.current[cat.id] = el)}
                    className={`hl-trade-card ${cat.className} ${isActive ? 'is-active' : ''}`}
                    onClick={() => handlePickTrade(cat.id)}
                    title={`Click to view ${cat.name} profiles`}
                  >
                    <div className="hl-trade-card-left">
                      <div className="hl-trade-card-icon-circle">
                        <Icon size={20} strokeWidth={2.4} />
                      </div>
                      <div>
                        <div className="hl-trade-card-name">{cat.name}</div>
                        <div className="hl-trade-card-sub">{cat.badge}</div>
                      </div>
                    </div>

                    {isActive && (
                      <div className="hl-trade-card-badge">
                        Active
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Scroll indicator footer (matching Image 1's "scroll down" CTA) */}
            <div className="hl-trade-reel-footer">
              <button
                type="button"
                className="hl-trade-reel-scroll-btn"
                onClick={handleScrollNextTrade}
                title="Scroll down to browse next service"
              >
                <ChevronDown size={14} className="hl-bounce-arrow" />
                <span>Scroll down for more trades</span>
              </button>
            </div>
          </aside>

          {/* =========================================================
              RIGHT COLUMN: WORKER PROFILES (rn Electrician in Image 1)
              ========================================================= */}
          <main className="hl-results-area">
            {/* 1. Unified Search & Filter Toolbar (At the Top) */}
            <div className="hl-unified-toolbar">
              <div className="hl-toolbar-search-box">
                <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder={`Search ${activeTrade.name.toLowerCase()} by skill, name or equipment...`}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="hl-toolbar-search-input"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="hl-toolbar-search-clear"
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="hl-toolbar-actions">
                {/* Consolidated Filter Button with Popover */}
                <div className="hl-filter-popover-wrap" ref={filterPopoverRef}>
                  <button
                    type="button"
                    className={`hl-toolbar-filter-btn ${activeQuickFilter !== 'all' ? 'is-active' : ''}`}
                    onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
                    style={activeQuickFilter !== 'all' ? { borderColor: activeTrade.color, color: activeTrade.color, backgroundColor: `${activeTrade.color}10` } : {}}
                  >
                    <SlidersHorizontal size={14} />
                    <span>Filter</span>
                    {activeQuickFilter !== 'all' && (
                      <span className="hl-filter-badge-dot" style={{ backgroundColor: activeTrade.color }}>
                        1
                      </span>
                    )}
                    <ChevronDown size={13} style={{ transform: isFilterPopoverOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>

                  {/* Filter Popover Dropdown */}
                  {isFilterPopoverOpen && (
                    <div className="hl-filter-popover-menu">
                      <div className="hl-filter-popover-header">
                        <span className="hl-filter-popover-title">Filter {activeTrade.name}s</span>
                        {activeQuickFilter !== 'all' && (
                          <button
                            type="button"
                            className="hl-filter-reset-link"
                            onClick={() => {
                              setActiveQuickFilter('all');
                              setIsFilterPopoverOpen(false);
                            }}
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      <div className="hl-filter-options-list">
                        {[
                          { id: 'all', label: 'All Pros', Icon: Sparkles },
                          { id: 'verified', label: 'Verified Pro Only', Icon: ShieldCheck },
                          { id: 'tomorrow', label: 'Available Tomorrow', Icon: Calendar },
                          { id: 'price600', label: 'Under ₹600/day', Icon: Zap },
                          { id: 'phone', label: 'Phone Booking (Hindi Voice)', Icon: Phone },
                          { id: 'app', label: 'App Booking (Instant Confirm)', Icon: Smartphone }
                        ].map((opt) => {
                          const isSelected = activeQuickFilter === opt.id;
                          const IconComp = opt.Icon;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              className={`hl-filter-menu-item ${isSelected ? 'is-selected' : ''}`}
                              onClick={() => {
                                setActiveQuickFilter(opt.id);
                                setIsFilterPopoverOpen(false);
                              }}
                              style={isSelected ? { backgroundColor: `${activeTrade.color}12`, borderColor: activeTrade.color } : {}}
                            >
                              <div className="hl-filter-item-left">
                                <IconComp size={14} style={{ color: isSelected ? activeTrade.color : 'var(--text-muted)' }} />
                                <span className="hl-filter-item-label" style={isSelected ? { color: activeTrade.color, fontWeight: 700 } : {}}>
                                  {opt.label}
                                </span>
                              </div>
                              {isSelected && <Check size={14} style={{ color: activeTrade.color }} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Results Meta & Sort Bar with Live PINCODE Switcher */}
            <div className="hl-results-meta-bar" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <div className="hl-results-meta-left">
                <div className="hl-count-pill-row">
                  <h2 className="hl-results-count-title" style={{ fontSize: '20px' }}>
                    {filteredList.length} {activeTrade.name.toLowerCase()}s found
                  </h2>
                  <span className="hl-avail-badge">
                    <span className="hl-avail-green-circle" />
                    <span>Available tomorrow</span>
                  </span>
                </div>
              </div>

              {/* Service Area PINCODE Switcher Pill */}
              <div style={{ position: 'relative' }} ref={locSwitcherRef}>
                <button
                  type="button"
                  onClick={() => setIsLocSwitcherOpen(!isLocSwitcherOpen)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#FFF7ED',
                    border: '1.5px solid #FDBA74',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#EA580C',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="Click to search workers in a different PINCODE area"
                >
                  <MapPin size={13} style={{ color: '#EA580C' }} />
                  <span>PINCODE: <strong>{locPincode}</strong> ({locName})</span>
                  <ChevronDown
                    size={12}
                    style={{
                      transform: isLocSwitcherOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s ease'
                    }}
                  />
                </button>

                {isLocSwitcherOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '115%',
                    right: 0,
                    zIndex: 150,
                    minWidth: '340px'
                  }}>
                    <PincodeAddressSelector
                      selectedPincode={locPincode}
                      selectedAddress={selectedLocState}
                      onSelect={(addr) => {
                        handleSelectLoc(addr);
                        setIsLocSwitcherOpen(false);
                      }}
                      onClose={() => setIsLocSwitcherOpen(false)}
                      variant="popover"
                      title="Switch Service PINCODE"
                    />
                  </div>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div className="hl-toolbar-sort-box">
                <span className="hl-toolbar-sort-label">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="hl-toolbar-sort-select"
                >
                  <option value="Recommended">Recommended</option>
                  <option value="Lowest Price">Lowest Price</option>
                  <option value="Highest Rated">Highest Rated</option>
                  <option value="Most Experienced">Most Experienced</option>
                  <option value="Available Soonest">Available Soonest</option>
                </select>
              </div>
            </div>

            {/* Active Filter Strip (Shows only when filter is selected) */}
            {activeQuickFilter !== 'all' && (
              <div className="hl-active-filter-strip">
                <span className="hl-active-filter-tag" style={{ borderColor: `${activeTrade.color}40`, backgroundColor: `${activeTrade.color}0E` }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>Filter:</span>
                  <strong style={{ color: activeTrade.color }}>{currentFilterLabel}</strong>
                  <button
                    type="button"
                    className="hl-active-filter-remove"
                    onClick={() => setActiveQuickFilter('all')}
                    title="Remove filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              </div>
            )}

            {/* 3. Worker Cards Grid (Image 2 Worker Cards Structure) */}
            {filteredList.length === 0 ? (
              <div style={{
                padding: '48px 24px',
                textAlign: 'center',
                backgroundColor: 'var(--surface)',
                borderRadius: '16px',
                border: '1.5px dashed var(--border)'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--surface-alt)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  color: 'var(--text-muted)'
                }}>
                  <Search size={22} />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>
                  No {activeTrade.name.toLowerCase()}s found matching your filters
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Try resetting your search query or selecting a different filter.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSearchInput('');
                    setActiveQuickFilter('all');
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="hl-cards-grid">
                {filteredList.map((worker) => (
                  <WorkerCard
                    key={worker.worker_id}
                    worker={worker}
                    onSelectWorker={onSelectWorker}
                    onBookWorker={onBookWorker}
                    isRecommended={worker.isRecommended}
                    themeColor={activeTrade.color}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
