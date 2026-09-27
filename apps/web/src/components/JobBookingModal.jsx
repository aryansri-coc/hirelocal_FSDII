import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { PREFERRED_TIME_SLOT, PREFERRED_TIME_LABELS } from '../../../../packages/shared/statusVocabulary.js';
import { Calendar, MapPin, Wrench, Clock, Check, ChevronRight, X, PhoneCall, Smartphone } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Service' },
  { id: 2, label: 'Details' },
  { id: 3, label: 'Date' },
  { id: 4, label: 'Confirm' }
];

export default function JobBookingModal({ worker, defaultService, onClose, onJobCreated }) {
  const { user, showToast } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const [currentStep, setCurrentStep] = useState(1);
  const [serviceType, setServiceType] = useState(worker?.profession || defaultService || 'Electrician');
  const [requiredDate, setRequiredDate] = useState(todayStr);
  const [preferredTime, setPreferredTime] = useState(PREFERRED_TIME_SLOT.FLEXIBLE);
  const [address, setAddress] = useState(user?.address || 'Flat 402, Shalimar Heights, MP Nagar Zone 2, Bhopal');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isCallbot = worker?.communication_type === 'non_smartphone';

  const handleNext = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!serviceType.trim()) {
        setErrorMsg('Please specify the service needed.');
        return;
      }
    } else if (currentStep === 2) {
      if (!description.trim() || description.length < 5) {
        setErrorMsg('Please describe the problem (at least 5 characters).');
        return;
      }
      if (!address.trim()) {
        setErrorMsg('Please enter your service address.');
        return;
      }
    } else if (currentStep === 3) {
      if (!requiredDate) {
        setErrorMsg('Please select a required service date.');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setErrorMsg('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        worker_id: worker?.worker_id || null,
        service_type: serviceType,
        address,
        required_date: requiredDate,
        preferred_time: preferredTime,
        description,
        estimated_cost: worker?.daily_rate || 500
      };

      const res = await api.createJob(payload);
      if (res.success) {
        showToast(
          isCallbot
            ? `Job requested! CallBot voice notification dispatched to ${worker.name}.`
            : `Job requested! Notification sent to ${worker?.name || 'workers'}.`,
          'success'
        );
        onJobCreated(res.data.job);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit booking request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Request a Service</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Day-based booking with upfront daily rate
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Minimal Horizontal Stepper */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px',
          backgroundColor: 'var(--surface-alt)',
          borderBottom: '1px solid var(--border)'
        }}>
          {STEPS.map((s, idx) => {
            const isActive = currentStep === s.id;
            const isCompleted = currentStep > s.id;

            return (
              <React.Fragment key={s.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: isCompleted ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--border-strong)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700
                  }}>
                    {isCompleted ? <Check size={14} /> : s.id}
                  </div>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--primary)' : isCompleted ? 'var(--text-main)' : 'var(--text-muted)'
                  }}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div style={{
                    flex: 1,
                    height: '1px',
                    backgroundColor: isCompleted ? 'var(--success)' : 'var(--border)',
                    margin: '0 12px'
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Content */}
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

          {/* STEP 1: SERVICE */}
          {currentStep === 1 && (
            <div>
              {worker ? (
                <div style={{
                  padding: '16px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface-alt)',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Selected Worker
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                    {worker.name}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {worker.profession} • ₹{worker.daily_rate}/day
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    {isCallbot ? (
                      <span className="tag">
                        <PhoneCall size={12} style={{ color: 'var(--primary)' }} />
                        <span>CallBot Voice Dispatch</span>
                      </span>
                    ) : (
                      <span className="tag">
                        <Smartphone size={12} style={{ color: 'var(--primary)' }} />
                        <span>Smartphone App Worker</span>
                      </span>
                    )}
                  </div>
                </div>
              ) : null}

              <div className="form-group">
                <label className="form-label">Service Trade</label>
                <select
                  className="form-select"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                >
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="AC Repair & Service">AC Repair & Service</option>
                  <option value="Carpenter">Carpenter</option>
                  <option value="Painter">Painter</option>
                  <option value="Appliance Repair">Appliance Repair</option>
                  <option value="Deep Cleaning">Deep Cleaning</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS */}
          {currentStep === 2 && (
            <div>
              <div className="form-group">
                <label className="form-label">Describe the Work or Issue</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Living room AC not cooling and making loud rattling noise. Need coil check and cleaning."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Service Address & Landmark</label>
                <input
                  type="text"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House number, apartment name, street, locality"
                />
              </div>
            </div>
          )}

          {/* STEP 3: DATE & TIME */}
          {currentStep === 3 && (
            <div>
              <div className="form-group">
                <label className="form-label">Select Required Service Date</label>
                <input
                  type="date"
                  min={todayStr}
                  className="form-input"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                />
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  HireLocal provides day-based bookings for focused, dedicated full-service visits.
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Preferred Time Window (Optional)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {Object.entries(PREFERRED_TIME_LABELS).map(([slotKey, label]) => {
                    const isSelected = preferredTime === slotKey;
                    return (
                      <button
                        type="button"
                        key={slotKey}
                        onClick={() => setPreferredTime(slotKey)}
                        style={{
                          padding: '10px 12px',
                          border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                          color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                          fontSize: '13px',
                          fontWeight: isSelected ? 600 : 500,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRM */}
          {currentStep === 4 && (
            <div>
              <div style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-alt)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Service:</span>
                  <strong>{serviceType}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Worker:</span>
                  <strong>{worker?.name || 'Direct Matching Pool'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Date:</span>
                  <strong>{requiredDate}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Preferred Window:</span>
                  <strong>{PREFERRED_TIME_LABELS[preferredTime]}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Location:</span>
                  <span style={{ maxWidth: '280px', textAlign: 'right', fontWeight: 600 }}>{address}</span>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Estimated Rate:</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>
                    ₹{worker?.daily_rate || 500} / day
                  </span>
                </div>
              </div>

              {isCallbot && (
                <div style={{
                  marginTop: '14px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primary-light)',
                  border: '1px solid #BFDBFE',
                  fontSize: '13px',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <PhoneCall size={16} />
                  <span>CallBot voice will dial {worker.name} directly with this booking request.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--surface-alt)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {currentStep > 1 ? (
            <button className="btn btn-secondary" onClick={handleBack} disabled={submitting}>
              Back
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
          )}

          {currentStep < 4 ? (
            <button className="btn btn-primary" onClick={handleNext}>
              <span>Continue</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleFinalSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Confirm Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
