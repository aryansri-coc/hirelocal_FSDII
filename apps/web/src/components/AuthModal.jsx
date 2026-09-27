import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { isValidIndianPhone } from '../../../../packages/validation/validators.js';
import { X, Lock, Phone, User, Mail, ArrowRight } from 'lucide-react';

export default function AuthModal({ initialMode = 'login', onClose, onSuccess }) {
  const { login, signup, showToast } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
        await login(phone, otp);
      } else {
        if (!name || name.trim().length < 2) {
          setErrorMsg('Full name must be at least 2 characters.');
          setSubmitting(false);
          return;
        }
        await signup(phone, name, email, 'customer', otp);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        {/* Clean Header Tabs */}
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
              borderBottom: mode === 'login' ? '2px solid var(--primary)' : 'none',
              color: mode === 'login' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer'
            }}
            onClick={() => { setMode('login'); setErrorMsg(''); }}
          >
            Log In
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '14px',
              backgroundColor: mode === 'signup' ? 'var(--surface)' : 'transparent',
              border: 'none',
              borderBottom: mode === 'signup' ? '2px solid var(--primary)' : 'none',
              color: mode === 'signup' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer'
            }}
            onClick={() => { setMode('signup'); setErrorMsg(''); }}
          >
            Sign Up
          </button>
          <button
            onClick={onClose}
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
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              {mode === 'login'
                ? 'Enter your mobile number to sign in with OTP.'
                : 'Join HireLocal to book trusted local professionals.'}
            </p>
          </div>

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

          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Rahul Sharma"
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
                  placeholder="e.g. rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Mobile Number</label>
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
                placeholder="10-digit mobile number"
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
                <span className="tag" style={{ fontSize: '11px', color: 'var(--primary)' }}>
                  Demo: 123456
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

          <div style={{ marginTop: '24px' }}>
            {!otpSent ? (
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
                onClick={handleSendOtp}
                disabled={sendingOtp || !phone}
              >
                {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
                disabled={submitting}
              >
                {submitting ? 'Verifying...' : mode === 'login' ? 'Log In' : 'Complete Registration'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
