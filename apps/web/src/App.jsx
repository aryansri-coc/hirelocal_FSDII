import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ServiceGrid from './components/ServiceGrid';
import WorkerCard from './components/WorkerCard';
import FindWorkersView from './components/FindWorkersView';
import WorkerDetailModal from './components/WorkerDetailModal';
import JobBookingModal from './components/JobBookingModal';
import CustomerDashboard from './components/CustomerDashboard';
import MyBookingsView from './components/MyBookingsView';
import CustomerProfile from './components/CustomerProfile';
import WorkerDashboard from './components/WorkerDashboard';
import MessagesView from './components/MessagesView';
import CallBotSimulator from './components/CallBotSimulator';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import WorkerOnboardingModal from './components/WorkerOnboardingModal';
import Toast from './components/Toast';
import { api } from './api/client';
import { useAuth } from './context/AuthContext';
import { POPULAR_LOCATIONS } from '../../../packages/shared/constants.js';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Plus,
  Loader2,
  Calendar,
  MapPin,
  Smartphone,
  PhoneCall,
  Wrench
} from 'lucide-react';

export default function App() {
  const { user, isAuthenticated, loading } = useAuth();
  const role = user?.role || 'public';

  const [activeTab, setActiveTab] = useState('landing');
  const [services, setServices] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);

  // Search & Filter state
  const [selectedService, setSelectedService] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('Bhopal');
  const [selectedLocation, setSelectedLocation] = useState({
    pincode: '462011',
    locality: 'MP Nagar',
    district: 'Bhopal',
    state: 'Madhya Pradesh',
    label: 'MP Nagar, Bhopal (462011)'
  });
  const [commTypeFilter, setCommTypeFilter] = useState('');
  const [matchingDate, setMatchingDate] = useState('');

  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    if (loc.district || loc.city) {
      setSelectedCity(loc.district || loc.city);
    }
  };

  // Modals state
  const [selectedWorkerDetail, setSelectedWorkerDetail] = useState(null);
  const [bookingWorker, setBookingWorker] = useState(null);
  const [authModalState, setAuthModalState] = useState(null); // null | 'login' | 'signup'
  const [showWorkerOnboard, setShowWorkerOnboard] = useState(false);
  const [simulatorJob, setSimulatorJob] = useState(null);

  // Set default view on authentication state changes
  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        if (role === 'worker') {
          setActiveTab('worker_dashboard');
        } else if (role === 'admin') {
          setActiveTab('admin_dashboard');
        } else {
          setActiveTab('customer_dashboard');
        }
      } else {
        setActiveTab('landing');
      }
    }
  }, [isAuthenticated, role, loading]);

  // Fetch initial services & workers
  useEffect(() => {
    api.getServices().then((res) => {
      if (res.success) setServices(res.data);
    }).catch(console.error);

    fetchWorkers();
  }, []);

  const fetchWorkers = async (serviceFilter = selectedService) => {
    setLoadingWorkers(true);
    try {
      const params = {};
      if (serviceFilter) params.profession = serviceFilter;
      if (commTypeFilter) params.communication_type = commTypeFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await api.getWorkers(params);
      if (res.success) {
        setWorkers(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleSelectService = (srvName) => {
    setSelectedService(srvName);
    fetchWorkers(srvName);
  };

  const handleLandingSearch = async (srvName, locName) => {
    let service = (srvName || '').trim();
    let targetPin = null;

    // Detect 6-digit PINCODE in service query (e.g. "electrician 824101")
    const pinInSrv = service.match(/\b(\d{6})\b/);
    if (pinInSrv) {
      targetPin = pinInSrv[1];
      service = service.replace(pinInSrv[0], '').trim();
    }

    // Detect 6-digit PINCODE in locName (e.g. "824101" or "Bihar (824101)")
    if (locName) {
      const pinInLoc = String(locName).match(/\b(\d{6})\b/);
      if (pinInLoc) {
        targetPin = pinInLoc[1];
      }
    }

    if (targetPin) {
      try {
        const res = await api.getPincodeGeo(targetPin);
        if (res && res.success) {
          const resolvedLoc = {
            pincode: targetPin,
            locality: res.locality || targetPin,
            district: res.district || '',
            state: res.state || '',
            label: `${res.locality || 'PINCODE ' + targetPin} (${targetPin})`
          };
          setSelectedLocation(resolvedLoc);
          if (res.district) setSelectedCity(res.district);
        }
      } catch (err) {
        console.warn('Failed to resolve search PINCODE:', err);
      }
    }

    setSelectedService(service || 'Electrician');
    setSearchTerm(''); // Keep search filter clean so workers aren't excluded by numeric digits
    setActiveTab('explore');
    fetchWorkers(service || 'Electrician');
  };

  const handleRunMatchEngine = async () => {
    setLoadingWorkers(true);
    try {
      const selectedLoc = POPULAR_LOCATIONS.find((l) => l.city === selectedCity) || POPULAR_LOCATIONS[0];
      const params = {
        service: selectedService || '',
        date: matchingDate || '',
        lat: selectedLoc.lat,
        lng: selectedLoc.lng,
        skill: searchTerm || ''
      };

      const res = await api.matchWorkers(params);
      if (res.success) {
        setWorkers(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleBookWorker = (w) => {
    if (!isAuthenticated) {
      setAuthModalState('login');
      return;
    }
    setBookingWorker(w);
  };

  const handleOpenCallbotForJob = (job) => {
    setSimulatorJob(job);
    setActiveTab('callbot_info');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'var(--primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <Wrench size={24} />
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
            Loading HireLocal...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setAuthModalState('login')}
        onOpenSignup={() => setAuthModalState('signup')}
        onOpenWorkerOnboard={() => setShowWorkerOnboard(true)}
        selectedCity={selectedCity}
        selectedLocation={selectedLocation}
        onSelectLocation={handleSelectLocation}
        onSelectCity={(city) => {
          setSelectedCity(city);
          fetchWorkers(selectedService);
        }}
      />

      <main style={{ flex: 1, padding: (activeTab === 'landing' || activeTab === 'explore' || activeTab === 'customer_bookings') ? '0' : '32px 0 64px' }}>
        <div className={(activeTab === 'landing' || activeTab === 'explore' || activeTab === 'customer_bookings') ? '' : 'container'}>
          {/* PUBLIC LANDING PAGE */}
          {activeTab === 'landing' && (
            <LandingPage
              onFindWorker={() => setActiveTab('explore')}
              onWorkAsWorker={() => setShowWorkerOnboard(true)}
              onLogin={() => setAuthModalState('login')}
              onSignup={() => setAuthModalState('signup')}
              onSearchSubmit={handleLandingSearch}
              onSelectService={(srv) => {
                setSelectedService(srv);
                setActiveTab('explore');
                fetchWorkers(srv);
              }}
              onSelectWorker={(w) => setSelectedWorkerDetail(w)}
              onBookWorker={(w) => handleBookWorker(w)}
              onOpenCallbot={() => {
                setSelectedService('Electrician');
                setActiveTab('explore');
                fetchWorkers('Electrician');
              }}
              workers={workers}
              services={services}
              selectedLocation={selectedLocation}
              onSelectLocation={handleSelectLocation}
            />
          )}

          {/* EXPLORE / FIND WORKERS */}
          {activeTab === 'explore' && (
            <FindWorkersView
              workers={workers}
              selectedService={selectedService || 'Electrician'}
              selectedLocation={selectedLocation}
              onSelectLocation={handleSelectLocation}
              onBack={() => setActiveTab('landing')}
              onSelectWorker={(w) => setSelectedWorkerDetail(w)}
              onBookWorker={(w) => handleBookWorker(w)}
              onSelectService={(srv) => {
                setSelectedService(srv);
                fetchWorkers(srv);
              }}
            />
          )}

          {/* DEDICATED MY BOOKINGS VIEW (Mockup Image 2) */}
          {activeTab === 'customer_bookings' && (
            <MyBookingsView
              onFindWorker={() => setActiveTab('explore')}
              onOpenCallbotForJob={handleOpenCallbotForJob}
            />
          )}

          {/* CUSTOMER DASHBOARD (OVERVIEW) */}
          {activeTab === 'customer_dashboard' && (
            <CustomerDashboard
              initialSubTab="overview"
              onSelectService={(s) => {
                setSelectedService(s);
                setActiveTab('explore');
                fetchWorkers(s);
              }}
              onBookDirect={() => handleBookWorker({ profession: 'Electrician' })}
              onOpenCallbotForJob={handleOpenCallbotForJob}
              onBecomeWorker={() => setShowWorkerOnboard(true)}
            />
          )}

          {/* CUSTOMER PROFILE */}
          {activeTab === 'customer_profile' && (
            <CustomerProfile onBecomeWorker={() => setShowWorkerOnboard(true)} />
          )}

          {/* WORKER DASHBOARD */}
          {(activeTab === 'worker_dashboard' || activeTab === 'worker_requests' || activeTab === 'worker_jobs' || activeTab === 'worker_profile') && (
            <WorkerDashboard activeSubView={activeTab} />
          )}

          {/* ADMIN DASHBOARD */}
          {(activeTab === 'admin_dashboard' || activeTab === 'admin_users' || activeTab === 'admin_workers' || activeTab === 'admin_jobs' || activeTab === 'admin_callbot' || activeTab === 'admin_audit') && (
            <AdminDashboard
              initialTab={
                activeTab === 'admin_users' ? 'users' :
                activeTab === 'admin_workers' ? 'workers' :
                activeTab === 'admin_jobs' ? 'jobs' :
                activeTab === 'admin_callbot' ? 'callbot' :
                activeTab === 'admin_audit' ? 'audit' : 'overview'
              }
            />
          )}

          {/* CONSUMER MESSAGES INBOX */}
          {activeTab === 'messages' && (
            <MessagesView onFindWorker={() => setActiveTab('explore')} />
          )}

          {/* CALLBOT LIVE SIMULATOR / INFO (INTERNAL / TELEPHONY DIAGNOSTICS) */}
          {activeTab === 'callbot_info' && (
            <CallBotSimulator preselectedJob={simulatorJob} />
          )}
        </div>
      </main>

      {/* Simple Footer across inner pages if not on Landing page */}
      {activeTab !== 'landing' && (
        <footer style={{
          backgroundColor: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          padding: '24px 0',
          fontSize: '13px',
          color: 'var(--text-muted)'
        }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <strong>HireLocal</strong> — Hyperlocal Skilled & Wage Worker Marketplace
            </div>
            <div>
              © 2026 HireLocal • PostgreSQL 18
            </div>
          </div>
        </footer>
      )}

      {/* Modals */}
      {authModalState && (
        <AuthModal
          initialMode={authModalState}
          onClose={() => setAuthModalState(null)}
          onSuccess={() => {
            fetchWorkers();
          }}
        />
      )}

      {showWorkerOnboard && (
        <WorkerOnboardingModal
          onClose={() => setShowWorkerOnboard(false)}
          onSuccess={() => {
            fetchWorkers();
            setActiveTab('worker_dashboard');
          }}
        />
      )}

      {selectedWorkerDetail && (
        <WorkerDetailModal
          worker={selectedWorkerDetail}
          onClose={() => setSelectedWorkerDetail(null)}
          onBookWorker={(w) => {
            setSelectedWorkerDetail(null);
            handleBookWorker(w);
          }}
        />
      )}

      {bookingWorker && (
        <JobBookingModal
          worker={bookingWorker.worker_id ? bookingWorker : null}
          defaultService={bookingWorker.profession}
          selectedLocation={selectedLocation}
          onClose={() => setBookingWorker(null)}
          onJobCreated={() => {
            setActiveTab('customer_bookings');
          }}
        />
      )}

      <Toast />
    </div>
  );
}
