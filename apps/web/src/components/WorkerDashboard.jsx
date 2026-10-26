import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { JOB_STATUS, PREFERRED_TIME_LABELS } from '../../../../packages/shared/statusVocabulary.js';
import PincodeAddressSelector from './PincodeAddressSelector';
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Check,
  X,
  PhoneCall,
  User,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Settings,
  TrendingUp,
  DollarSign,
  Edit3,
  ArrowRight,
  Sparkles,
  Sliders,
  Navigation,
  Compass,
  Building2,
  ShieldCheck,
  Save,
  Radio,
  Loader2
} from 'lucide-react';
import { lookupPincodeDefaultAddress } from '../utils/pincodeHelper';

export default function WorkerDashboard({ activeSubView = 'dashboard' }) {
  const { user, worker, showToast, refreshUser } = useAuth();
  const [workerJobs, setWorkerJobs] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('overview'); // 'overview' | 'requests' | 'my_jobs' | 'availability' | 'profile' | 'ratings'

  // Profile / Settings edit state
  const [dailyRate, setDailyRate] = useState(worker?.daily_rate || 500);
  const [statusVal, setStatusVal] = useState(worker?.status || 'available');
  const [commType, setCommType] = useState(worker?.communication_type || 'smartphone');
  const [profession, setProfession] = useState(worker?.profession || 'Electrician');
  const [skillsStr, setSkillsStr] = useState(worker?.skills ? worker.skills.join(', ') : '');
  const [workingDays, setWorkingDays] = useState(worker?.working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [savingSettings, setSavingSettings] = useState(false);

  // Permanent Location & Working Area state
  const [pincodeVal, setPincodeVal] = useState(
    worker?.pincode || worker?.location?.pincode || user?.pincode || '462016'
  );
  const [locationNameVal, setLocationNameVal] = useState(
    worker?.location?.name || worker?.location_name || user?.address || 'Arera Hills, Bhopal'
  );
  const [serviceRadiusVal, setServiceRadiusVal] = useState(
    worker?.service_radius || 15
  );
  const [showPincodeSelector, setShowPincodeSelector] = useState(false);
  const [showOverviewEditor, setShowOverviewEditor] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [addressAutoFilled, setAddressAutoFilled] = useState(false);
  const [resolvedPincodeData, setResolvedPincodeData] = useState(null);

  const fetchWorkerData = async () => {
    setLoading(true);
    try {
      const [jobsRes, ratingsRes] = await Promise.all([
        api.getMyJobs(),
        worker?.worker_id ? api.getWorkerRatings(worker.worker_id) : Promise.resolve({ success: true, data: [] })
      ]);
      if (jobsRes.success) setWorkerJobs(jobsRes.data);
      if (ratingsRes.success) setRatings(ratingsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerData();
    if (worker) {
      setDailyRate(worker.daily_rate);
      setStatusVal(worker.status);
      setCommType(worker.communication_type);
      setProfession(worker.profession);
      setSkillsStr(worker.skills ? worker.skills.join(', ') : '');
      if (worker.working_days) setWorkingDays(worker.working_days);
      if (worker.pincode || worker.location?.pincode) {
        setPincodeVal(worker.pincode || worker.location?.pincode);
      }
      if (worker.location?.name || worker.location_name) {
        setLocationNameVal(worker.location?.name || worker.location_name);
      }
      if (worker.service_radius) {
        setServiceRadiusVal(worker.service_radius);
      }
    }
  }, [worker]);

  useEffect(() => {
    if (activeSubView === 'worker_requests') setCurrentTab('requests');
    else if (activeSubView === 'worker_jobs') setCurrentTab('my_jobs');
    else if (activeSubView === 'worker_profile') setCurrentTab('profile');
    else if (activeSubView === 'worker_area') setCurrentTab('area');
    else setCurrentTab('overview');
  }, [activeSubView]);

  const handleJobAction = async (jobId, newStatus) => {
    try {
      const res = await api.updateJobStatus(jobId, newStatus);
      if (res.success) {
        showToast(`Job updated to ${newStatus.replace(/_/g, ' ')}!`, 'success');
        fetchWorkerData();
        refreshUser();
      }
    } catch (err) {
      showToast(err.message || 'Action failed.', 'danger');
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    if (!worker?.worker_id) return;

    setSavingSettings(true);
    try {
      const parsedSkills = skillsStr.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await api.updateWorkerProfile(worker.worker_id, {
        daily_rate: Number(dailyRate),
        status: statusVal,
        communication_type: commType,
        profession,
        skills: parsedSkills,
        working_days: workingDays,
        pincode: String(pincodeVal).trim(),
        location_name: String(locationNameVal).trim(),
        service_radius: Number(serviceRadiusVal) || 15
      });
      if (res.success) {
        showToast('Settings, profile & working area saved successfully!', 'success');
        refreshUser();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update settings.', 'danger');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveWorkingArea = async (overridePin, overrideLoc, overrideRadius) => {
    if (!worker?.worker_id) return;

    const pinToSave = String(overridePin !== undefined ? overridePin : pincodeVal).trim();
    const locToSave = String(overrideLoc !== undefined ? overrideLoc : locationNameVal).trim();
    const radiusToSave = Number(overrideRadius !== undefined ? overrideRadius : serviceRadiusVal) || 15;

    if (!pinToSave || pinToSave.length !== 6) {
      showToast('Please enter a valid 6-digit Indian postal PINCODE.', 'danger');
      return;
    }

    setSavingLocation(true);
    try {
      const res = await api.updateWorkerProfile(worker.worker_id, {
        pincode: pinToSave,
        location_name: locToSave || `${pinToSave} Area`,
        service_radius: radiusToSave
      });
      if (res.success) {
        showToast(`Permanent working area updated: ${locToSave || pinToSave} (${pinToSave}) with ${radiusToSave} km coverage!`, 'success');
        setShowPincodeSelector(false);
        setShowOverviewEditor(false);
        await refreshUser();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update working area.', 'danger');
    } finally {
      setSavingLocation(false);
    }
  };

  const handleSelectPincodeAddress = (addr) => {
    if (!addr) return;
    const pin = addr.pincode;
    const locName = addr.name || addr.locality || addr.district || 'Local Hub';
    const districtState = [addr.district, addr.state].filter(Boolean).join(', ');
    const fullLoc = districtState ? `${locName}, ${districtState}` : locName;
    setPincodeVal(pin);
    setLocationNameVal(fullLoc);
    setAddressAutoFilled(true);
    setShowPincodeSelector(false);
    showToast(`Selected ${fullLoc} (${pin}). Click Save to apply changes.`, 'info');
  };

  /**
   * Automatically look up and write down the default address regarding the worker's PINCODE
   */
  const handlePincodeChange = async (newVal, shouldAutoFill = true) => {
    const cleanPin = String(newVal || '').replace(/\D/g, '').slice(0, 6);
    setPincodeVal(cleanPin);

    if (cleanPin.length === 6 && shouldAutoFill) {
      setPincodeLoading(true);
      try {
        const resolved = await lookupPincodeDefaultAddress(cleanPin);
        if (resolved && resolved.defaultAddress) {
          setLocationNameVal(resolved.defaultAddress);
          setResolvedPincodeData(resolved);
          setAddressAutoFilled(true);
          showToast(`Auto-detected default address: ${resolved.defaultAddress}`, 'info');
        }
      } catch (err) {
        console.warn('Failed to resolve pincode address:', err);
      } finally {
        setPincodeLoading(false);
      }
    } else if (cleanPin.length < 6) {
      setAddressAutoFilled(false);
    }
  };

  const handleSelectSubLocality = (locName) => {
    if (!resolvedPincodeData) {
      setLocationNameVal(locName);
      return;
    }
    const districtState = [resolvedPincodeData.district, resolvedPincodeData.state].filter(Boolean).join(', ');
    const full = districtState ? `${locName}, ${districtState}` : locName;
    setLocationNameVal(full);
    setAddressAutoFilled(true);
    showToast(`Selected postal locality: ${full}`, 'info');
  };

  const handleAutoFillCurrentPincode = async () => {
    if (!pincodeVal || pincodeVal.length !== 6) {
      showToast('Please enter a 6-digit PINCODE first', 'warning');
      return;
    }
    setPincodeLoading(true);
    try {
      const resolved = await lookupPincodeDefaultAddress(pincodeVal);
      if (resolved && resolved.defaultAddress) {
        setLocationNameVal(resolved.defaultAddress);
        setResolvedPincodeData(resolved);
        setAddressAutoFilled(true);
        showToast(`Auto-filled address: ${resolved.defaultAddress}`, 'success');
      }
    } catch (err) {
      showToast('Could not resolve PINCODE address', 'danger');
    } finally {
      setPincodeLoading(false);
    }
  };

  const toggleDay = (day) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  // Filtered job lists
  const pendingRequests = workerJobs.filter((j) => [
    JOB_STATUS.REQUESTED,
    JOB_STATUS.PENDING_WORKER_RESPONSE
  ].includes(j.status));

  const upcomingJobs = workerJobs.filter((j) => [
    JOB_STATUS.ACCEPTED,
    JOB_STATUS.CUSTOMER_AND_WORKER_CONNECTED,
    JOB_STATUS.IN_PROGRESS
  ].includes(j.status));

  const completedJobs = workerJobs.filter((j) => j.status === JOB_STATUS.COMPLETED);

  const totalEarnings = completedJobs.length * (worker?.daily_rate || 500);

  return (
    <div className="dashboard-layout">
      {/* WORKER SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          paddingBottom: '16px',
          marginBottom: '16px',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700
          }}>
            {user?.name?.charAt(0) || 'W'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {worker?.profession || 'Skilled Worker'}
            </div>
          </div>
        </div>

        <nav>
          <button
            className={`sidebar-nav-item ${currentTab === 'overview' ? 'active' : ''}`}
            onClick={() => setCurrentTab('overview')}
          >
            <Calendar size={18} />
            <span>Dashboard</span>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'requests' ? 'active' : ''}`}
            onClick={() => setCurrentTab('requests')}
          >
            <Clock size={18} />
            <span>Job Requests</span>
            {pendingRequests.length > 0 && (
              <span className="tag" style={{ marginLeft: 'auto', backgroundColor: 'var(--primary)', color: '#FFFFFF', borderColor: 'var(--primary)' }}>
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'my_jobs' ? 'active' : ''}`}
            onClick={() => setCurrentTab('my_jobs')}
          >
            <Briefcase size={18} />
            <span>My Jobs</span>
            {upcomingJobs.length > 0 && (
              <span className="tag" style={{ marginLeft: 'auto' }}>
                {upcomingJobs.length}
              </span>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'area' ? 'active' : ''}`}
            onClick={() => setCurrentTab('area')}
          >
            <MapPin size={18} />
            <span>Working Area & PINCODE</span>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'availability' ? 'active' : ''}`}
            onClick={() => setCurrentTab('availability')}
          >
            <Calendar size={18} />
            <span>Availability</span>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'profile' ? 'active' : ''}`}
            onClick={() => setCurrentTab('profile')}
          >
            <User size={18} />
            <span>Profile & Rates</span>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'ratings' ? 'active' : ''}`}
            onClick={() => setCurrentTab('ratings')}
          >
            <Star size={18} />
            <span>Ratings & Reviews</span>
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main>
        {/* VIEW 1: OVERVIEW */}
        {currentTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '4px' }}>
                Worker Dashboard
              </h1>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
                Review incoming requests, upcoming visits, and track earnings.
              </p>
            </div>

            {/* Quick Metrics Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px'
            }}>
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Pending Requests
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: pendingRequests.length > 0 ? 'var(--warning)' : 'var(--text-main)', marginTop: '4px' }}>
                  {pendingRequests.length}
                </div>
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Active Scheduled Jobs
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                  {upcomingJobs.length}
                </div>
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Estimated Earnings
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                  ₹{totalEarnings}
                </div>
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Rating / Dependability
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                  <Star size={20} style={{ fill: '#F59E0B', color: '#F59E0B' }} />
                  <span style={{ fontSize: '22px', fontWeight: 800 }}>
                    {worker?.rating ? Number(worker.rating).toFixed(1) : '5.0'}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    ({worker?.reliability || 100}%)
                  </span>
                </div>
              </div>
            </div>

            {/* PERMANENT WORKING AREA & COVERAGE RADAR CARD */}
            <div className="card" style={{
              padding: '22px 24px',
              borderLeft: '4px solid var(--primary)',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 247, 237, 0.7) 100%)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(234, 88, 12, 0.12)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <MapPin size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>
                        Permanent Working Area & Base PINCODE
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor: '#DCFCE7',
                        color: '#166534',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <CheckCircle size={11} /> Active Doorstep Coverage
                      </span>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                      {locationNameVal || 'Base Area'} <span style={{ color: 'var(--primary)', fontFamily: 'monospace', fontWeight: 800 }}>({pincodeVal || 'PINCODE'})</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                      Current Service Radius: <strong style={{ color: 'var(--text-main)' }}>{serviceRadiusVal} km</strong> • Customers within {serviceRadiusVal} km will discover and hire you.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowOverviewEditor(!showOverviewEditor)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                  >
                    <Edit3 size={14} />
                    {showOverviewEditor ? 'Close Area Editor' : 'Change Working Area'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setCurrentTab('area')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                  >
                    <span>Full Area Settings</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* QUICK INLINE AREA EDITOR ON OVERVIEW */}
              {showOverviewEditor && (
                <div style={{
                  marginTop: '18px',
                  paddingTop: '18px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                      Quick Update: Base PINCODE & Service Radius
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPincodeSelector(!showPincodeSelector)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: 0
                      }}
                    >
                      <Sparkles size={13} />
                      {showPincodeSelector ? 'Close Postal PINCODE Finder' : 'Search All Indian PINCODEs & Postal Hubs'}
                    </button>
                  </div>

                  {showPincodeSelector && (
                    <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <PincodeAddressSelector
                        selectedPincode={pincodeVal}
                        onSelect={handleSelectPincodeAddress}
                        onClose={() => setShowPincodeSelector(false)}
                        variant="inline"
                        title="Pick Your Permanent Base PINCODE & Hub"
                      />
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Base Postal PINCODE (6 Digits)
                        </label>
                        {pincodeLoading && (
                          <span style={{ fontSize: '11px', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Loader2 size={11} className="spin" /> Looking up...
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        value={pincodeVal}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        placeholder="e.g. 140413"
                        maxLength={6}
                        style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '14px' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Locality / Village / Town Name
                        </label>
                        {addressAutoFilled && (
                          <span style={{ fontSize: '11px', color: '#166534', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle size={11} /> Auto-filled from PINCODE
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        value={locationNameVal}
                        onChange={(e) => {
                          setLocationNameVal(e.target.value);
                          setAddressAutoFilled(false);
                        }}
                        placeholder="e.g. Bajheri, Mohali, Punjab"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        Operational Coverage Radius: <strong>{serviceRadiusVal} km</strong>
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="range"
                          min="3"
                          max="50"
                          step="1"
                          value={serviceRadiusVal}
                          onChange={(e) => setServiceRadiusVal(Number(e.target.value))}
                          style={{ flex: 1, accentColor: 'var(--primary)' }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '45px', textAlign: 'right' }}>
                          {serviceRadiusVal} km
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Postal Localities chip suggestions under this PINCODE */}
                  {resolvedPincodeData?.localities?.length > 1 && (
                    <div style={{ backgroundColor: 'var(--surface-alt)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Postal hubs in PINCODE {pincodeVal} (Click to select specific locality):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {resolvedPincodeData.localities.slice(0, 8).map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => handleSelectSubLocality(loc)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: locationNameVal.toLowerCase().includes(loc.toLowerCase()) ? 700 : 500,
                              backgroundColor: locationNameVal.toLowerCase().includes(loc.toLowerCase()) ? 'var(--primary-light)' : '#FFFFFF',
                              color: locationNameVal.toLowerCase().includes(loc.toLowerCase()) ? 'var(--primary)' : 'var(--text-main)',
                              border: `1px solid ${locationNameVal.toLowerCase().includes(loc.toLowerCase()) ? 'var(--primary)' : 'var(--border)'}`,
                              cursor: 'pointer'
                            }}
                          >
                            {loc}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 1-Click Auto-fill trigger if PINCODE is 6 digits but not yet auto-synced */}
                  {pincodeVal && pincodeVal.length === 6 && !addressAutoFilled && (
                    <div style={{
                      backgroundColor: 'rgba(234, 88, 12, 0.05)',
                      border: '1px dashed var(--primary)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      fontSize: '12px'
                    }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        PINCODE provided: <strong>{pincodeVal}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={handleAutoFillCurrentPincode}
                        disabled={pincodeLoading}
                        style={{
                          background: 'var(--primary)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Sparkles size={11} /> Auto-fill Address for {pincodeVal}
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowOverviewEditor(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSaveWorkingArea()}
                      disabled={savingLocation}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Save size={14} />
                      {savingLocation ? 'Saving Working Area...' : 'Save Working Area'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PRIORITIZE: PENDING REQUESTS */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
                  Incoming Job Requests ({pendingRequests.length})
                </h2>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No pending requests waiting for response.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingRequests.map((job) => (
                    <div
                      key={job.job_id}
                      className="card"
                      style={{ padding: '20px', borderLeft: '4px solid var(--warning)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 700 }}>
                            {job.service_type}
                          </div>
                          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Customer: <strong>{job.customer_name}</strong> • Phone: {job.customer_phone || 'Provided upon accept'}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                            ₹{job.estimated_cost}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Day rate</div>
                        </div>
                      </div>

                      <div style={{
                        backgroundColor: 'var(--surface-alt)',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        marginBottom: '14px'
                      }}>
                        <div><strong>Location:</strong> {job.address}</div>
                        <div><strong>Scheduled Date:</strong> {job.required_date} ({PREFERRED_TIME_LABELS[job.preferred_time] || 'Flexible'})</div>
                        {job.description && (
                          <div style={{ marginTop: '4px' }}><strong>Problem:</strong> {job.description}</div>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleJobAction(job.job_id, JOB_STATUS.REJECTED)}
                        >
                          Decline Request
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleJobAction(job.job_id, JOB_STATUS.CUSTOMER_AND_WORKER_CONNECTED)}
                        >
                          Accept Job
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* UPCOMING JOBS */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
                  Upcoming Scheduled Work ({upcomingJobs.length})
                </h2>
              </div>

              {upcomingJobs.length === 0 ? (
                <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No scheduled jobs at the moment.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {upcomingJobs.map((job) => (
                    <div key={job.job_id} className="card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 700 }}>{job.service_type}</span>
                            <span className={`status-pill status-${job.status}`}>
                              {job.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Customer: {job.customer_name} • {job.customer_phone}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '16px', fontWeight: 800 }}>₹{job.estimated_cost}</span>
                        </div>
                      </div>

                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                        <div><strong>Address:</strong> {job.address}</div>
                        <div><strong>Date:</strong> {job.required_date}</div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {job.status === JOB_STATUS.CUSTOMER_AND_WORKER_CONNECTED && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleJobAction(job.job_id, JOB_STATUS.IN_PROGRESS)}
                          >
                            Start Work
                          </button>
                        )}
                        {job.status === JOB_STATUS.IN_PROGRESS && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleJobAction(job.job_id, JOB_STATUS.COMPLETED)}
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: JOB REQUESTS ONLY */}
        {currentTab === 'requests' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>
              Pending Job Requests ({pendingRequests.length})
            </h1>
            {pendingRequests.length === 0 ? (
              <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No pending job requests.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {pendingRequests.map((job) => (
                  <div key={job.job_id} className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{job.service_type}</h3>
                      <span style={{ fontSize: '16px', fontWeight: 800 }}>₹{job.estimated_cost}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      <div><strong>Customer:</strong> {job.customer_name} ({job.customer_phone})</div>
                      <div><strong>Address:</strong> {job.address}</div>
                      <div><strong>Date:</strong> {job.required_date}</div>
                      <div><strong>Description:</strong> {job.description}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleJobAction(job.job_id, JOB_STATUS.REJECTED)}
                      >
                        Decline
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleJobAction(job.job_id, JOB_STATUS.CUSTOMER_AND_WORKER_CONNECTED)}
                      >
                        Accept Job
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: MY JOBS */}
        {currentTab === 'my_jobs' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>
              All Jobs ({workerJobs.length})
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {workerJobs.map((job) => (
                <div key={job.job_id} className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '15px' }}>{job.service_type}</span>
                        <span className={`status-pill status-${job.status}`}>
                          {job.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Customer: {job.customer_name} • Date: {job.required_date}
                      </div>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '16px' }}>₹{job.estimated_cost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: WORKING AREA & PERMANENT PINCODE */}
        {currentTab === 'area' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '4px' }}>
                Working Area & Permanent PINCODE
              </h1>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
                Set your permanent postal PINCODE and operational service radius. You can adjust this anytime if your coverage or base location changes.
              </p>
            </div>

            {/* Current Active Base Card */}
            <div className="card" style={{
              padding: '24px',
              borderLeft: '4px solid var(--primary)',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 247, 237, 0.7) 100%)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} /> Current Live Service Base
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                alignItems: 'center'
              }}>
                <div style={{
                  backgroundColor: 'var(--surface)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>PERMANENT PINCODE</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)', marginTop: '2px' }}>
                    {pincodeVal || '140413'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} /> Postal Verified Hub
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'var(--surface)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>OPERATING LOCALITY / CITY</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {locationNameVal || 'Bajheri, Punjab'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Base Doorstep Starting Point
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'var(--surface)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>SERVICE RADIUS</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                    {serviceRadiusVal} <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)' }}>km</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, marginTop: '4px' }}>
                    ~{(Math.PI * Math.pow(serviceRadiusVal, 2)).toFixed(0)} km² Area Coverage
                  </div>
                </div>
              </div>
            </div>

            {/* Change Permanent Location Form */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    Change Permanent PINCODE & Working Hub
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    Select your exact postal locality or enter any 6-digit PINCODE across India.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPincodeSelector(!showPincodeSelector)}
                  style={{
                    backgroundColor: showPincodeSelector ? 'var(--surface-alt)' : 'rgba(234, 88, 12, 0.1)',
                    color: 'var(--primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={14} />
                  {showPincodeSelector ? 'Hide PINCODE Finder' : 'Open Indian Postal PINCODE Selector'}
                </button>
              </div>

              {showPincodeSelector && (
                <div style={{
                  marginBottom: '20px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                  <PincodeAddressSelector
                    selectedPincode={pincodeVal}
                    onSelect={handleSelectPincodeAddress}
                    onClose={() => setShowPincodeSelector(false)}
                    variant="inline"
                    title="Select Permanent Postal PINCODE & Locality"
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                      Base PINCODE
                    </label>
                    {pincodeLoading && (
                      <span style={{ fontSize: '11px', color: 'var(--primary)' }}>
                        <Loader2 size={11} className="spin" />
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    value={pincodeVal}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="6 Digits"
                    maxLength={6}
                    style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, textAlign: 'center' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                      Locality / Town / Landmark
                    </label>
                    {addressAutoFilled && (
                      <span style={{ fontSize: '11px', color: '#166534', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle size={11} /> Auto-filled from PINCODE
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    value={locationNameVal}
                    onChange={(e) => {
                      setLocationNameVal(e.target.value);
                      setAddressAutoFilled(false);
                    }}
                    placeholder="e.g. Bajheri, Mohali / MP Nagar"
                  />
                </div>
              </div>

              {/* Area Tab Sub-Localities and 1-Click Auto-fill */}
              {resolvedPincodeData?.localities?.length > 1 && (
                <div style={{ backgroundColor: 'var(--surface-alt)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Postal Hubs in PINCODE {pincodeVal} (Click to set):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {resolvedPincodeData.localities.slice(0, 8).map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => handleSelectSubLocality(loc)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: locationNameVal.toLowerCase().includes(loc.toLowerCase()) ? 700 : 500,
                          backgroundColor: locationNameVal.toLowerCase().includes(loc.toLowerCase()) ? 'var(--primary-light)' : '#FFFFFF',
                          color: locationNameVal.toLowerCase().includes(loc.toLowerCase()) ? 'var(--primary)' : 'var(--text-main)',
                          border: `1px solid ${locationNameVal.toLowerCase().includes(loc.toLowerCase()) ? 'var(--primary)' : 'var(--border)'}`,
                          cursor: 'pointer'
                        }}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {pincodeVal && pincodeVal.length === 6 && !addressAutoFilled && (
                <div style={{
                  backgroundColor: 'rgba(234, 88, 12, 0.05)',
                  border: '1px dashed var(--primary)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  fontSize: '12px',
                  marginBottom: '16px'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    PINCODE: <strong>{pincodeVal}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoFillCurrentPincode}
                    disabled={pincodeLoading}
                    style={{
                      background: 'var(--primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Sparkles size={11} /> Auto-fill Address for {pincodeVal}
                  </button>
                </div>
              )}

              {/* SERVICE RADIUS / COVERAGE SECTION */}
              <div style={{
                backgroundColor: 'var(--surface-alt)',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>
                    Service Coverage Distance (Working Radius)
                  </label>
                  <span style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: 'var(--primary)',
                    backgroundColor: '#FFFFFF',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)'
                  }}>
                    {serviceRadiusVal} km Radius
                  </span>
                </div>

                <input
                  type="range"
                  min="2"
                  max="50"
                  step="1"
                  value={serviceRadiusVal}
                  onChange={(e) => setServiceRadiusVal(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)', marginBottom: '16px', cursor: 'pointer' }}
                />

                {/* Preset Radius Pills */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {[
                    { km: 5, label: '5 km (Neighborhood)' },
                    { km: 10, label: '10 km (City Core)' },
                    { km: 15, label: '15 km (Recommended)' },
                    { km: 25, label: '25 km (Metro & Suburbs)' },
                    { km: 40, label: '40 km (Max Radius)' }
                  ].map((preset) => (
                    <button
                      key={preset.km}
                      type="button"
                      onClick={() => setServiceRadiusVal(preset.km)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: serviceRadiusVal === preset.km ? 700 : 500,
                        border: `1px solid ${serviceRadiusVal === preset.km ? 'var(--primary)' : 'var(--border)'}`,
                        backgroundColor: serviceRadiusVal === preset.km ? 'var(--primary)' : '#FFFFFF',
                        color: serviceRadiusVal === preset.km ? '#FFFFFF' : 'var(--text-main)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#FFFFFF',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)'
                }}>
                  <Navigation size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span>
                    HireLocal's matching engine will only send you customer jobs within <strong>{serviceRadiusVal} km</strong> of <strong>{locationNameVal || 'your base'} ({pincodeVal})</strong>.
                  </span>
                </div>
              </div>

              {/* SAVE ACTION */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleSaveWorkingArea()}
                  disabled={savingLocation}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: 700
                  }}
                >
                  <Save size={16} />
                  {savingLocation ? 'Saving Working Area...' : 'Save Permanent Working Area'}
                </button>
              </div>
            </div>

            {/* Why This Matters Info Card */}
            <div className="card" style={{ padding: '20px 24px', backgroundColor: 'var(--surface-alt)' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} style={{ color: 'var(--primary)' }} /> How Your Working Area Works
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <li>
                  <strong>Direct Customer Proximity:</strong> When customers in your area look for {worker?.profession || 'workers'}, you rank highest if their doorstep is close to your base PINCODE.
                </li>
                <li>
                  <strong>Change Anytime:</strong> Moving to a new neighborhood or traveling to a different city? Update your permanent PINCODE above and your job leads immediately shift to your new area.
                </li>
                <li>
                  <strong>Travel Protection:</strong> Booking requests farther than {serviceRadiusVal} km are filtered out so you won't be expected to travel unreasonable distances.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* VIEW 4: AVAILABILITY & WORKING DAYS */}
        {currentTab === 'availability' && (
          <div className="card" style={{ padding: '24px', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Working Days & Availability
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Select the days you are available to receive customer booking requests.
            </p>

            <form onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label className="form-label">Available Days of the Week</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                    const isSelected = workingDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-strong)'}`,
                          backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                          color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label className="form-label">Current Work Status</label>
                <select
                  className="form-select"
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                >
                  <option value="available">Available for Bookings</option>
                  <option value="busy">Temporarily Busy</option>
                  <option value="offline">Offline / Vacation</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: '16px' }}
                disabled={savingSettings}
              >
                {savingSettings ? 'Saving...' : 'Save Availability'}
              </button>
            </form>
          </div>
        )}

        {/* VIEW 5: PROFILE & RATES */}
        {currentTab === 'profile' && (
          <div className="card" style={{ padding: '24px', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Worker Profile & Rates
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Update your daily rate and communication preferences.
            </p>

            <form onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label className="form-label">Primary Trade</label>
                <input className="form-input" value={profession} onChange={(e) => setProfession(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Daily Rate (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  min={200}
                  max={5000}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Skills (Comma separated)</label>
                <input
                  className="form-input"
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Communication Mode</label>
                <select
                  className="form-select"
                  value={commType}
                  onChange={(e) => setCommType(e.target.value)}
                >
                  <option value="smartphone">Smartphone App Worker</option>
                  <option value="non_smartphone">Basic Phone (AI CallBot Voice Calls)</option>
                </select>
              </div>

              {/* Working Area & Base PINCODE within Profile Form */}
              <div style={{
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>
                    Permanent Base PINCODE & Working Area
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPincodeSelector(!showPincodeSelector)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0
                    }}
                  >
                    <Sparkles size={12} />
                    {showPincodeSelector ? 'Hide Selector' : `Lookup PINCODE (${pincodeVal})`}
                  </button>
                </div>

                {showPincodeSelector && (
                  <div style={{ marginBottom: '14px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <PincodeAddressSelector
                      selectedPincode={pincodeVal}
                      onSelect={handleSelectPincodeAddress}
                      onClose={() => setShowPincodeSelector(false)}
                      variant="inline"
                      title="Select Base Postal PINCODE"
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', fontWeight: 600 }}>
                      <span>PINCODE</span>
                      {pincodeLoading && <Loader2 size={10} className="spin" style={{ color: 'var(--primary)' }} />}
                    </label>
                    <input
                      className="form-input"
                      value={pincodeVal}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      placeholder="6 Digits"
                      maxLength={6}
                      style={{ fontFamily: 'monospace', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>Base Locality / Area</label>
                      {addressAutoFilled && (
                        <span style={{ fontSize: '10px', color: '#166534', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          <CheckCircle size={10} /> Auto-filled
                        </span>
                      )}
                    </div>
                    <input
                      className="form-input"
                      value={locationNameVal}
                      onChange={(e) => {
                        setLocationNameVal(e.target.value);
                        setAddressAutoFilled(false);
                      }}
                      placeholder="e.g. Bajheri / MP Nagar"
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>Coverage Radius</span>
                    <strong style={{ color: 'var(--primary)' }}>{serviceRadiusVal} km</strong>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="50"
                    step="1"
                    value={serviceRadiusVal}
                    onChange={(e) => setServiceRadiusVal(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary)' }}
                  />
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    You will receive job leads within a {serviceRadiusVal} km radius of your base PINCODE.
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: '20px' }}
                disabled={savingSettings}
              >
                {savingSettings ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        )}

        {/* VIEW 6: RATINGS */}
        {currentTab === 'ratings' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>
              Customer Ratings & Reviews ({ratings.length})
            </h1>
            {ratings.length === 0 ? (
              <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No reviews recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {ratings.map((r) => (
                  <div key={r.rating_id} className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{r.customer_name}</span>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            style={{
                              fill: i < r.rating ? '#F59E0B' : '#E5E7EB',
                              color: i < r.rating ? '#F59E0B' : '#E5E7EB'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                      "{r.review}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
