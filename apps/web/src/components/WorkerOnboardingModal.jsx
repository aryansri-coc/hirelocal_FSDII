import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Check, ChevronRight, X, PhoneCall, Smartphone } from 'lucide-react';

const ONBOARD_STEPS = [
  'Basic Info',
  'Profession',
  'Skills',
  'Availability',
  'Communication',
  'Pricing',
  'Review'
];

const PROFESSIONS = [
  'Electrician',
  'Plumber',
  'AC Repair & Service',
  'Carpenter',
  'Painter',
  'Deep Cleaning',
  'Appliance Repair'
];

export default function WorkerOnboardingModal({ onClose, onSuccess }) {
  const { user, login, showToast, refreshUser } = useAuth();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || 'MP Nagar, Bhopal');
  const [city, setCity] = useState('Bhopal');

  const [profession, setProfession] = useState('Electrician');
  const [experience, setExperience] = useState(5);
  const [skillsStr, setSkillsStr] = useState('Wiring, MCB Tripping, Inverter Installation');

  const [workingDays, setWorkingDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [serviceRadius, setServiceRadius] = useState(15);

  const [commType, setCommType] = useState('smartphone'); // 'smartphone' | 'non_smartphone'
  const [languages, setLanguages] = useState(['hi']);

  const [dailyRate, setDailyRate] = useState(600);
  const [bio, setBio] = useState('Experienced skilled professional dedicated to honest and reliable work.');

  const toggleDay = (day) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleNext = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!name.trim() || name.length < 2) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!phone || phone.length !== 10) {
        setErrorMsg('Please enter a valid 10-digit phone number.');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const parsedSkills = skillsStr.split(',').map((s) => s.trim()).filter(Boolean);

      const payload = {
        name,
        phone,
        address,
        profession,
        skills: parsedSkills,
        experience: Number(experience),
        working_days: workingDays,
        service_radius: Number(serviceRadius),
        communication_type: commType,
        languages,
        daily_rate: Number(dailyRate),
        bio,
        location_name: `${address}, ${city}`
      };

      const res = await api.registerWorker(payload);
      if (res.success) {
        showToast('Registration successful! Welcome to HireLocal.', 'success');
        await refreshUser();
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Worker registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Start earning with HireLocal</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Tell us about your skills and we'll connect you with customers nearby.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 7-Step Minimal Stepper */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 24px',
          backgroundColor: 'var(--surface-alt)',
          borderBottom: '1px solid var(--border)',
          overflowX: 'auto',
          gap: '8px'
        }}>
          {ONBOARD_STEPS.map((stepLabel, idx) => {
            const stepNum = idx + 1;
            const isCompleted = step > stepNum;
            const isActive = step === stepNum;

            return (
              <div key={stepNum} style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isCompleted ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--border-strong)',
                  color: '#FFFFFF'
                }}>
                  {isCompleted ? <Check size={12} /> : stepNum}
                </div>
                <span style={{
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--primary)' : isCompleted ? 'var(--text-main)' : 'var(--text-muted)'
                }}>
                  {stepLabel}
                </span>
                {stepNum < ONBOARD_STEPS.length && (
                  <span style={{ color: 'var(--border-strong)', margin: '0 4px' }}>›</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Step Body */}
        <div style={{ padding: '24px' }}>
          {errorMsg && (
            <div style={{
              backgroundColor: 'var(--error-light)',
              color: '#991B1B',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              marginBottom: '16px',
              border: '1px solid #FECACA'
            }}>
              {errorMsg}
            </div>
          )}

          {/* STEP 1: BASIC INFORMATION */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Step 1: Basic Information</h3>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>

              <div className="form-group">
                <label className="form-label">10-Digit Mobile Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9827011223"
                  maxLength={10}
                />
              </div>

              <div className="form-group">
                <label className="form-label">City / Operational Hub</label>
                <select className="form-select" value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="Bhopal">Bhopal</option>
                  <option value="Indore">Indore</option>
                  <option value="Lucknow">Lucknow</option>
                  <option value="Jaipur">Jaipur</option>
                  <option value="Patna">Patna</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Local Address</label>
                <input
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Colony, Street, Landmark"
                />
              </div>
            </div>
          )}

          {/* STEP 2: PROFESSIONAL INFORMATION */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Step 2: Professional Information</h3>
              <div className="form-group">
                <label className="form-label">Select Your Trade</label>
                <select
                  className="form-select"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                >
                  {PROFESSIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Years of Experience</label>
                <input
                  type="number"
                  className="form-input"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  min={0}
                  max={40}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Short Bio / Background</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 3: SKILLS */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Step 3: Skills & Services</h3>
              <div className="form-group">
                <label className="form-label">List Your Specific Skills (Comma-separated)</label>
                <input
                  className="form-input"
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="e.g. Split AC, Gas Charging, Filter Wash"
                />
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Customers use these keywords to find workers with your exact expertise.
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: AVAILABILITY */}
          {step === 4 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Step 4: Availability</h3>
              <div className="form-group">
                <label className="form-label">Days You Work</label>
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

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Service Radius (km)</label>
                <input
                  type="number"
                  className="form-input"
                  value={serviceRadius}
                  onChange={(e) => setServiceRadius(e.target.value)}
                  min={1}
                  max={50}
                />
              </div>
            </div>
          )}

          {/* STEP 5: COMMUNICATION CHANNEL */}
          {step === 5 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Step 5: How do you want to receive work?</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div
                  onClick={() => setCommType('smartphone')}
                  style={{
                    padding: '16px',
                    border: `1px solid ${commType === 'smartphone' ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: commType === 'smartphone' ? 'var(--primary-light)' : 'var(--surface)',
                    cursor: 'pointer'
                  }}
                >
                  <Smartphone size={22} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Smartphone App</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Receive in-app notifications and manage jobs on mobile web.
                  </div>
                </div>

                <div
                  onClick={() => setCommType('non_smartphone')}
                  style={{
                    padding: '16px',
                    border: `1px solid ${commType === 'non_smartphone' ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: commType === 'non_smartphone' ? 'var(--primary-light)' : 'var(--surface)',
                    cursor: 'pointer'
                  }}
                >
                  <PhoneCall size={22} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Basic Phone (AI CallBot)</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Receive bookings via automated phone calls in Hindi. Accept with keypad or voice.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: PRICING */}
          {step === 6 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Step 6: Pricing</h3>
              <div className="form-group">
                <label className="form-label">Daily Service Rate (₹ / Day)</label>
                <input
                  type="number"
                  className="form-input"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  min={200}
                  max={5000}
                />
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Customers book by the day, avoiding hourly disputes.
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: REVIEW */}
          {step === 7 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Step 7: Review & Confirm</h3>
              <div style={{
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px'
              }}>
                <div><strong>Name:</strong> {name}</div>
                <div><strong>Phone:</strong> {phone}</div>
                <div><strong>Profession:</strong> {profession} ({experience} years)</div>
                <div><strong>Skills:</strong> {skillsStr}</div>
                <div><strong>Working Days:</strong> {workingDays.join(', ')}</div>
                <div><strong>Channel:</strong> {commType === 'smartphone' ? 'Smartphone App' : 'Basic Phone (AI CallBot)'}</div>
                <div><strong>Daily Rate:</strong> ₹{dailyRate}/day</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--surface-alt)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {step > 1 ? (
            <button className="btn btn-secondary" onClick={handleBack} disabled={submitting}>
              Back
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
          )}

          {step < 7 ? (
            <button className="btn btn-primary" onClick={handleNext}>
              <span>Continue</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Registering...' : 'Complete Registration'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
