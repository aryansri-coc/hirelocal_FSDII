import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { PAN_INDIA_POPULAR_PINCODES } from '../../../../packages/shared/constants.js';
import {
  MapPin,
  Search,
  Check,
  Building2,
  Navigation,
  Loader2,
  X,
  Sparkles
} from 'lucide-react';

export default function PincodeAddressSelector({
  selectedPincode = '462011',
  selectedAddress = null,
  onSelect,
  onClose,
  variant = 'popover', // 'popover' | 'inline' | 'modal'
  title = 'Select Location by PINCODE',
  showPopularChips = true
}) {
  const [searchInput, setSearchInput] = useState(selectedPincode || '');
  const [activePincode, setActivePincode] = useState(selectedPincode || '462011');
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const inputRef = useRef(null);

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsStatus('Requesting GPS permission from browser...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGpsStatus('Finding your PINCODE & postal addresses...');

        try {
          const res = await api.reverseGeocode(lat, lng);
          if (res && res.success && res.pincode) {
            setSearchInput(res.pincode);
            setActivePincode(res.pincode);
            setGpsStatus(`GPS detected: ${res.locality || res.district || 'Location'} (${res.pincode})`);

            if (res.addresses && res.addresses.length > 0) {
              setAddresses(res.addresses);
              if (onSelect) {
                onSelect(res.addresses[0]);
              }
            } else {
              loadAddressesForPincode(res.pincode);
            }
          } else {
            setGpsStatus('Could not resolve Indian PINCODE for this coordinate.');
          }
        } catch (err) {
          console.error('Reverse geocode error:', err);
          setGpsStatus('Failed to find address for GPS location.');
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          setGpsStatus('Location permission denied. Please allow location access in your browser or type PINCODE.');
        } else if (err.code === 2) {
          setGpsStatus('GPS location unavailable. Please enter a 6-digit PINCODE.');
        } else {
          setGpsStatus('GPS request timed out. Please try again or enter PINCODE.');
        }
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  // Auto focus input on mount if popover or modal
  useEffect(() => {
    if (variant !== 'inline' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [variant]);

  // Load addresses when activePincode changes
  useEffect(() => {
    if (!activePincode || activePincode.length !== 6) return;
    loadAddressesForPincode(activePincode);
  }, [activePincode]);

  const loadAddressesForPincode = async (pin) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.getPincodeAddresses(pin);
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setAddresses(res.data);
      } else {
        // Fallback search
        const searchRes = await api.searchPincodes(pin);
        if (searchRes && searchRes.success && Array.isArray(searchRes.data) && searchRes.data.length > 0) {
          setAddresses(searchRes.data);
        } else {
          setAddresses([]);
          setErrorMsg(`No postal addresses found for PINCODE ${pin}.`);
        }
      }
    } catch (err) {
      console.error('Failed to load pincode addresses:', err);
      // Fallback search
      try {
        const searchRes = await api.searchPincodes(pin);
        if (searchRes && searchRes.success && Array.isArray(searchRes.data)) {
          setAddresses(searchRes.data);
        }
      } catch (e) {
        setErrorMsg('Could not reach postal service. Showing nearest hubs.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Debounced search when user types
  useEffect(() => {
    const q = (searchInput || '').trim();
    if (!q || q.length < 2) {
      return;
    }

    // If user typed exact 6 digit PINCODE
    if (/^\d{6}$/.test(q)) {
      setActivePincode(q);
      return;
    }

    // If searching by place or partial pincode
    const timer = setTimeout(async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await api.searchPincodes(q);
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setAddresses(res.data);
        } else {
          setAddresses([]);
          setErrorMsg(`No places found for "${q}". Try a 6-digit PINCODE.`);
        }
      } catch (err) {
        console.error('Search error:', err);
        setErrorMsg('Search error. Try entering a 6-digit PINCODE.');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleChipClick = (chip) => {
    setSearchInput(chip.pincode);
    setActivePincode(chip.pincode);
  };

  const handlePickAddress = (addr) => {
    if (onSelect) {
      onSelect(addr);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={`hl-pincode-selector-card ${variant === 'inline' ? 'is-inline' : ''}`} style={{
      width: '100%',
      maxWidth: variant === 'inline' ? '100%' : '380px',
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      boxShadow: variant === 'inline' ? 'none' : '0 20px 40px -8px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.08)',
      border: variant === 'inline' ? '1.5px solid #E2E8F0' : 'none',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid #F1F5F9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            backgroundColor: 'var(--primary-light, #FFF7ED)',
            color: 'var(--primary, #EA580C)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MapPin size={15} />
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
              {title}
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={11} style={{ color: '#EA580C' }} /> Powered by Indian Postal PINcode API
            </div>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search Input */}
      <div style={{ padding: '12px 16px 8px' }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
          <input
            ref={inputRef}
            type="text"
            className="form-input"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter 6-digit PINCODE (e.g. 462011, 110001)..."
            style={{
              paddingLeft: '34px',
              paddingRight: searchInput ? '32px' : '12px',
              fontSize: '13px',
              height: '38px',
              borderRadius: '10px',
              borderColor: '#CBD5E1',
              fontWeight: 500
            }}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setAddresses([]);
              }}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* GPS Location Auto-Detection Button */}
      <div style={{ padding: '0 16px 8px' }}>
        <button
          type="button"
          onClick={handleDetectGps}
          disabled={gpsLoading}
          style={{
            width: '100%',
            padding: '7px 12px',
            borderRadius: '9px',
            backgroundColor: gpsStatus && !gpsLoading && !gpsStatus.includes('denied') && !gpsStatus.includes('Failed') ? '#F0FDF4' : '#EFF6FF',
            border: `1.5px solid ${gpsStatus && !gpsLoading && !gpsStatus.includes('denied') && !gpsStatus.includes('Failed') ? '#86EFAC' : '#BFDBFE'}`,
            color: gpsStatus && !gpsLoading && !gpsStatus.includes('denied') && !gpsStatus.includes('Failed') ? '#166534' : '#1D4ED8',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
          title="Ask for GPS permission to detect your current location"
        >
          {gpsLoading ? (
            <>
              <Loader2 size={13} className="hl-spin" />
              <span>{gpsStatus || 'Requesting GPS permission...'}</span>
            </>
          ) : (
            <>
              <Navigation size={13} style={{ color: '#2563EB' }} />
              <span>Use Current GPS Location</span>
            </>
          )}
        </button>

        {gpsStatus && !gpsLoading && (
          <div style={{
            fontSize: '10.5px',
            marginTop: '4px',
            textAlign: 'center',
            fontWeight: 600,
            color: gpsStatus.includes('denied') || gpsStatus.includes('Failed') || gpsStatus.includes('not supported') ? '#DC2626' : '#16A34A'
          }}>
            {gpsStatus}
          </div>
        )}
      </div>

      {/* Popular Pincode Quick Chips */}
      {showPopularChips && (
        <div style={{ padding: '0 16px 10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '6px' }}>
            Popular Service Hubs:
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px'
          }}>
            {PAN_INDIA_POPULAR_PINCODES.slice(0, 7).map((chip) => {
              const isSelected = activePincode === chip.pincode;
              return (
                <button
                  key={chip.pincode}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? 'var(--primary, #EA580C)' : '#F1F5F9',
                    color: isSelected ? '#FFFFFF' : '#334155',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{chip.locality}</span>
                  <span style={{
                    opacity: isSelected ? 0.9 : 0.6,
                    fontSize: '10px',
                    fontFamily: 'monospace'
                  }}>
                    {chip.pincode}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Address Results Count / Status */}
      <div style={{
        padding: '6px 16px',
        backgroundColor: '#F8FAFC',
        borderTop: '1px solid #F1F5F9',
        borderBottom: '1px solid #F1F5F9',
        fontSize: '11.5px',
        fontWeight: 600,
        color: '#475569',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Building2 size={13} style={{ color: '#EA580C' }} />
          <span>
            {loading
              ? 'Loading postal localities...'
              : `${addresses.length} ${addresses.length === 1 ? 'Locality' : 'Localities'} in PINCODE`}
          </span>
        </div>
        {activePincode && (
          <span style={{
            backgroundColor: '#E2E8F0',
            color: '#1E293B',
            padding: '1px 6px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '10.5px',
            fontWeight: 700
          }}>
            {activePincode}
          </span>
        )}
      </div>

      {/* Address List */}
      <div style={{
        maxHeight: '260px',
        overflowY: 'auto',
        padding: '6px 8px'
      }}>
        {loading ? (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: '#64748B',
            fontSize: '13px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--primary, #EA580C)' }} />
            <span>Fetching all official addresses from Postal API...</span>
          </div>
        ) : errorMsg && addresses.length === 0 ? (
          <div style={{
            padding: '20px 16px',
            textAlign: 'center',
            color: '#64748B',
            fontSize: '12.5px'
          }}>
            <div style={{ color: '#EF4444', marginBottom: '4px', fontWeight: 600 }}>{errorMsg}</div>
            <div>Try entering a standard 6-digit Indian PINCODE like 462011, 110001, or 400058.</div>
          </div>
        ) : addresses.length === 0 ? (
          <div style={{
            padding: '20px 16px',
            textAlign: 'center',
            color: '#94A3B8',
            fontSize: '12.5px'
          }}>
            Enter a PINCODE above to view all verified postal addresses.
          </div>
        ) : (
          addresses.map((item, idx) => {
            const isMatch =
              selectedAddress &&
              (selectedAddress.name === item.name || selectedAddress.locality === item.name) &&
              (selectedAddress.pincode === item.pincode);

            return (
              <div
                key={`${item.name}-${item.pincode}-${idx}`}
                onClick={() => handlePickAddress(item)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isMatch ? '#FFF7ED' : 'transparent',
                  border: isMatch ? '1px solid #FDBA74' : '1px solid transparent',
                  marginBottom: '3px',
                  transition: 'background-color 0.12s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isMatch) e.currentTarget.style.backgroundColor = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  if (!isMatch) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: isMatch ? '#EA580C' : '#F1F5F9',
                    color: isMatch ? '#FFFFFF' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Navigation size={12} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: isMatch ? '#EA580C' : '#1E293B',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.name}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#64748B',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.district}, {item.state} &bull; <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.pincode}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {item.deliveryStatus && (
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 600,
                      padding: '2px 5px',
                      borderRadius: '4px',
                      backgroundColor: item.deliveryStatus === 'Delivery' ? '#DCFCE7' : '#F1F5F9',
                      color: item.deliveryStatus === 'Delivery' ? '#166534' : '#64748B'
                    }}>
                      {item.deliveryStatus === 'Delivery' ? 'Delivery Hub' : item.branchType || 'Office'}
                    </span>
                  )}
                  {isMatch && <Check size={15} style={{ color: '#EA580C' }} />}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div style={{
        padding: '8px 14px',
        backgroundColor: '#F8FAFC',
        borderTop: '1px solid #F1F5F9',
        fontSize: '11px',
        color: '#64748B',
        textAlign: 'center'
      }}>
        Selecting a locality sets your exact service radius & local workers.
      </div>
    </div>
  );
}
