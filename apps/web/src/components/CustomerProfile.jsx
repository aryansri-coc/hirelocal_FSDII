import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import PincodeAddressSelector from './PincodeAddressSelector';
import { User, Phone, MapPin, Mail, CheckCircle, Sparkles } from 'lucide-react';

export default function CustomerProfile({ onBecomeWorker }) {
  const { user, showToast, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.address || '');
  const [showPincodeSelector, setShowPincodeSelector] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateProfile({ name, email, address });
      if (res.success) {
        showToast('Profile updated successfully!', 'success');
        refreshUser();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>
          Customer Profile
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
          Manage your personal details and primary service address.
        </p>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              className="form-input"
              value={user?.phone || ''}
              readOnly
              style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-secondary)' }}
            />
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Your phone number is linked to your verified account.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address (Optional)</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. yourname@example.com"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Default Service Address</label>
              <button
                type="button"
                onClick={() => setShowPincodeSelector(!showPincodeSelector)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary, #EA580C)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0
                }}
              >
                <Sparkles size={12} />
                {showPincodeSelector ? 'Hide PINCODE Finder' : 'Select by PINCODE API'}
              </button>
            </div>

            {showPincodeSelector && (
              <div style={{ marginBottom: '12px' }}>
                <PincodeAddressSelector
                  selectedPincode="462011"
                  onSelect={(addr) => {
                    const full = addr.fullAddress || `${addr.name}, ${addr.district}, ${addr.state} - ${addr.pincode}`;
                    setAddress(full);
                    setShowPincodeSelector(false);
                  }}
                  onClose={() => setShowPincodeSelector(false)}
                  variant="inline"
                  title="Select Default Address by PINCODE"
                />
              </div>
            )}

            <textarea
              className="form-textarea"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House/flat number, apartment name, street, locality with PINCODE"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Become a Worker CTA */}
      <div className="card" style={{ padding: '24px', backgroundColor: 'var(--surface)' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>
          Work as a Skilled Worker on HireLocal
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Are you an electrician, plumber, AC mechanic, painter, or carpenter? Register as a worker to start receiving bookings from customers nearby.
        </p>
        <button className="btn btn-secondary" onClick={onBecomeWorker}>
          Register as a Worker
        </button>
      </div>
    </div>
  );
}
