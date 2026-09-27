import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ServiceGrid from './components/ServiceGrid';
import WorkerCard from './components/WorkerCard';
import WorkerDetailModal from './components/WorkerDetailModal';
import JobBookingModal from './components/JobBookingModal';
import CustomerDashboard from './components/CustomerDashboard';
import CustomerProfile from './components/CustomerProfile';
import WorkerDashboard from './components/WorkerDashboard';
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
  const [commTypeFilter, setCommTypeFilter] = useState('');
  const [matchingDate, setMatchingDate] = useState('');

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

  const handleLandingSearch = (srvName, locName) => {
    setSelectedService(srvName || '');
    if (locName) setSearchTerm(locName);
    setActiveTab('explore');
    fetchWorkers(srvName || '');
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
      />

      <main style={{ flex: 1, padding: activeTab === 'landing' ? '0' : '32px 0 64px' }}>
        <div className={activeTab === 'landing' ? '' : 'container'}>
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
              onOpenCallbot={() => setActiveTab('callbot_info')}
              workers={workers}
              services={services}
            />
          )}

          {/* EXPLORE / FIND WORKERS */}
          {activeTab === 'explore' && (
            <div>
              {/* Header */}
              <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 32px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>
                  Find Skilled Workers Near You
                </h1>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
                  Browse verified electricians, plumbers, and mechanics with transparent day-based rates.
                </p>
              </div>

              {/* Filter Controls Bar */}
              <div className="card" style={{ padding: '20px', marginBottom: '32px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  alignItems: 'end'
                }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Search Trade or Name</label>
                    <input
                      className="form-input"
                      placeholder="e.g. AC Repair, Ramesh"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Location / City Hub</label>
                    <select
                      className="form-select"
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                    >
                      <option value="Bhopal">MP Nagar, Bhopal</option>
                      <option value="Indore">Vijay Nagar, Indore</option>
                      <option value="Lucknow">Hazratganj, Lucknow</option>
                      <option value="Jaipur">Malviya Nagar, Jaipur</option>
                      <option value="Patna">Boring Road, Patna</option>
                      <option value="Nagpur">Dharampeth, Nagpur</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Required Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={matchingDate}
                      onChange={(e) => setMatchingDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Worker Channel</label>
                    <select
                      className="form-select"
                      value={commTypeFilter}
                      onChange={(e) => setCommTypeFilter(e.target.value)}
                    >
                      <option value="">All Workers</option>
                      <option value="smartphone">Smartphone App Workers</option>
                      <option value="non_smartphone">Basic Phone (AI CallBot)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                      onClick={() => fetchWorkers()}
                    >
                      Filter
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1.5 }}
                      onClick={handleRunMatchEngine}
                    >
                      <SlidersHorizontal size={14} />
                      <span>Match & Rank</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Service Categories Grid */}
              <ServiceGrid
                services={services}
                selectedService={selectedService}
                onSelectService={handleSelectService}
              />

              {/* Results Grid Header */}
              <div style={{
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700 }}>
                    Available Workers ({workers.length})
                  </h2>
                  {selectedService && (
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Showing results for {selectedService}
                    </span>
                  )}
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleBookWorker({ profession: selectedService || 'Electrician' })}
                >
                  <Plus size={14} />
                  <span>Direct Day Request</span>
                </button>
              </div>

              {loadingWorkers ? (
                <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading available professionals...
                </div>
              ) : workers.length === 0 ? (
                <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
                    No workers found matching your criteria
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Try clearing filters or search for another trade category.
                  </p>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setSelectedService('');
                      setSearchTerm('');
                      setCommTypeFilter('');
                      fetchWorkers('');
                    }}
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '20px'
                }}>
                  {workers.map((worker) => (
                    <WorkerCard
                      key={worker.worker_id}
                      worker={worker}
                      onSelectWorker={(w) => setSelectedWorkerDetail(w)}
                      onBookWorker={(w) => handleBookWorker(w)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CUSTOMER DASHBOARD & BOOKINGS */}
          {(activeTab === 'customer_dashboard' || activeTab === 'customer_bookings') && (
            <CustomerDashboard
              initialSubTab={activeTab === 'customer_bookings' ? 'bookings' : 'overview'}
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

          {/* CALLBOT LIVE SIMULATOR / INFO */}
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
