import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { isValidIndianPhone } from '../../../../packages/validation/validators.js';
import { X, Lock, Phone, User, Mail, ArrowRight, Briefcase, ShieldCheck, CheckCircle, Zap, Wrench } from 'lucide-react';

export default function AuthModal({ initialMode = 'login', onClose, onSuccess, onOpenWorkerOnboard }) {
  const { login, signup, showToast } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [signupRole, setSignupRole] = useState('customer'); // 'customer' | 'worker'
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Preset demo accounts for quick 1-click testing
  const DEMO_PRESETS = [
    {
      role: 'worker',
      name: 'Ramesh Kumar',
      trade: 'AC Mechanic',
      phone: '9827011223',
      badge: 'Worker Pro',
      icon: '👷',
      color: '#EA580C',
      bg: '#FFF7ED',
      border: '#FED7AA'
    },
    {
      role: 'worker',
      name: 'Rajesh Sharma',
      trade: 'Electrician',
      phone: '9827022334',
      badge: 'Worker Pro',
      icon: '⚡',
      color: '#D97706',
      bg: '#FFFBEB',
      border: '#FDE68A'
    },
    {
      role: 'worker',
      name: 'Babloo Prajapati',
      trade: 'Plumber',
      phone: '9827066778',
      badge: 'Worker Pro',
      icon: '🔧',
      color: '#2563EB',
      bg: '#EFF6FF',
      border: '#BFDBFE'
    },
    {
      role: 'customer',
      name: 'Rahul Sharma',
      trade: 'Customer',
      phone: '9827012345',
      badge: 'Customer',
      icon: '👤',
      color: '#16A34A',
      bg: '#F0FDF4',
      border: '#BBF7D0'
    },
    {
      role: 'admin',
      name: 'Admin Console',
      trade: 'Super Admin',
      phone: '9999999999',
      badge: 'Admin',
      icon: '🛡️',
      color: '#7E22CE',
      bg: '#FAF5FF',
      border: '#E9D5FF'
    }
  ];

  const handleQuickLogin = async (preset) => {
    setSubmitting(true);
    setErrorMsg('');
    setPhone(preset.phone);
    setOtp('123456');
    setOtpSent(true);

    try {
      const res = await login(preset.phone, '123456');
      const userRole = res?.user?.role || preset.role;
      if (onSuccess) {
        if (userRole === 'worker') {
          onSuccess('worker_dashboard');
        } else if (userRole === 'admin') {
          onSuccess('admin_dashboard');
        } else {
          onSuccess('customer_dashboard');
        }
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please verify credentials.');
      setSubmitting(false);
    }
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setErrorMsg('');

    if (!isValidIndianPhone(phone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await api.sendOtp(phone);
      if (res.success) {
        setOtpSent(true);
        setOtp('123456'); // pre-fill demo OTP
        showToast(`OTP sent to +91 ${phone}!`, 'info');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otpSent) {
      return handleSendOtp();
    }

    if (!otp || otp.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit OTP code.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        const res = await login(phone, otp);
        const userRole = res?.user?.role;
        if (onSuccess) {
          if (userRole === 'worker') onSuccess('worker_dashboard');
          else if (userRole === 'admin') onSuccess('admin_dashboard');
          else onSuccess('customer_dashboard');
        }
      } else {
        if (!name || name.trim().length < 2) {
          setErrorMsg('Full name must be at least 2 characters.');
          setSubmitting(false);
          return;
        }
        const res = await signup(phone, name, email, signupRole, otp);
        if (onSuccess) {
          if (signupRole === 'worker') onSuccess('worker_dashboard');
          else onSuccess('customer_dashboard');
        }
      }

      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1300 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          width: '95%',
          borderRadius: '20px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 60px -12px rgba(15, 23, 42, 0.25)'
        }}
      >
        {/* Header Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface-alt)'
        }}>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '14px',
              backgroundColor: mode === 'login' ? 'var(--surface)' : 'transparent',
              border: 'none',
              borderBottom: mode === 'login' ? '2.5px solid var(--primary)' : 'none',
              color: mode === 'login' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer'
            }}
            onClick={() => { setMode('login'); setErrorMsg(''); }}
          >
            Sign In / Log In
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '14px',
              backgroundColor: mode === 'signup' ? 'var(--surface)' : 'transparent',
              border: 'none',
              borderBottom: mode === 'signup' ? '2.5px solid var(--primary)' : 'none',
              color: mode === 'signup' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer'
            }}
            onClick={() => { setMode('signup'); setErrorMsg(''); }}
          >
            Register / Sign Up
          </button>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              padding: '0 16px',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <div style={{ padding: '22px 24px' }}>
          {errorMsg && (
            <div style={{
              backgroundColor: 'var(--error-light)',
              color: '#991B1B',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '16px',
              border: '1px solid #FECACA'
            }}>
              {errorMsg}
            </div>
          )}

          {/* Quick 1-Click Demo Profiles (Essential for Worker Testing) */}
          {mode === 'login' && (
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '12px 14px',
              marginBottom: '18px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  1-CLICK DEMO LOGIN (INSTANT ROLE ACCESS)
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>
                  Demo Mode
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                {DEMO_PRESETS.map((preset) => (
                  <button
                    key={preset.phone}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleQuickLogin(preset)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: `1px solid ${preset.border}`,
                      backgroundColor: preset.bg,
                      color: preset.color,
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px' }}>{preset.icon}</span>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
                          {preset.name.split(' ')[0]}
                        </div>
                        <div style={{ fontSize: '10.5px', color: preset.color }}>
                          {preset.trade}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: preset.color, fontWeight: 800 }}>
                      →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '14px 0 16px',
              color: 'var(--text-muted)',
              fontSize: '12px'
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
              <span style={{ padding: '0 10px', fontWeight: 600 }}>OR ENTER MOBILE NUMBER</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                {/* Role Selector: Customer vs Worker */}
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                    I want to register as:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setSignupRole('customer')}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        border: `1.5px solid ${signupRole === 'customer' ? 'var(--primary)' : 'var(--border)'}`,
                        backgroundColor: signupRole === 'customer' ? 'var(--primary-light)' : '#FFFFFF',
                        color: signupRole === 'customer' ? 'var(--primary)' : 'var(--text-main)',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <span>👤 Customer</span>
                      <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>
                        Hire local artisans
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSignupRole('worker')}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        border: `1.5px solid ${signupRole === 'worker' ? '#D97706' : 'var(--border)'}`,
                        backgroundColor: signupRole === 'worker' ? '#FEF3C7' : '#FFFFFF',
                        color: signupRole === 'worker' ? '#92400E' : 'var(--text-main)',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <span>👷 Skilled Worker</span>
                      <span style={{ fontSize: '11px', fontWeight: 500, color: '#B45309' }}>
                        Offer trade & earn
                      </span>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. ramesh@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">10-Digit Mobile Number</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{
                  backgroundColor: 'var(--surface-alt)',
                  border: '1px solid var(--border-strong)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: 600
                }}>
                  +91
                </span>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 9827011223"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            {otpSent && (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Enter 6-Digit OTP</label>
                  <span className="tag" style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>
                    Demo OTP: 123456
                  </span>
                </div>
                <input
                  className="form-input"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  autoFocus
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px' }}>
              {!otpSent ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontWeight: 700 }}
                  onClick={handleSendOtp}
                  disabled={sendingOtp || !phone}
                >
                  {sendingOtp ? 'Sending OTP...' : 'Send Verification OTP'}
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontWeight: 700 }}
                  disabled={submitting}
                >
                  {submitting
                    ? 'Verifying...'
                    : mode === 'login'
                    ? 'Log In'
                    : signupRole === 'worker'
                    ? 'Complete Worker Registration'
                    : 'Complete Customer Registration'}
                </button>
              )}
            </div>
          </form>

          {/* Become a Worker Direct Action Callout */}
          {onOpenWorkerOnboard && (
            <div style={{
              marginTop: '18px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12.5px'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                Are you an electrician or plumber?
              </span>
              <button
                type="button"
                onClick={onOpenWorkerOnboard}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#B45309',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Join as a Pro</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
