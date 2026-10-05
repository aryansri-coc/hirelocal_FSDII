import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  MapPin,
  Compass,
  Zap,
  Wrench,
  Hammer,
  ChevronRight,
  Image as ImageIcon,
  Building2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

// Pre-seeded coordinates for instant zero-latency loading of popular hubs
const LOCAL_GEO_MAP = {
  '824101': { lat: 24.7538, lng: 84.3736, locality: 'Aurangabad', district: 'Aurangabad(BH)', state: 'Bihar' },
  '143410': { lat: 31.3256, lng: 74.9213, locality: 'Dadeha Sahib / Sarhali', district: 'Amritsar / Tarn Taran', state: 'Punjab' },
  '462011': { lat: 23.2332, lng: 77.4343, locality: 'MP Nagar', district: 'Bhopal', state: 'Madhya Pradesh' },
  '462016': { lat: 23.2100, lng: 77.4330, locality: 'Arera Colony', district: 'Bhopal', state: 'Madhya Pradesh' },
  '462023': { lat: 23.2650, lng: 77.4640, locality: 'Govindpura', district: 'Bhopal', state: 'Madhya Pradesh' },
  '462003': { lat: 23.2380, lng: 77.4010, locality: 'New Market', district: 'Bhopal', state: 'Madhya Pradesh' },
  '110001': { lat: 28.6315, lng: 77.2167, locality: 'Connaught Place', district: 'Central Delhi', state: 'Delhi' },
  '400058': { lat: 19.1197, lng: 72.8468, locality: 'Andheri West', district: 'Mumbai', state: 'Maharashtra' },
  '560034': { lat: 12.9352, lng: 77.6245, locality: 'Koramangala', district: 'Bengaluru', state: 'Karnataka' },
  '452010': { lat: 22.7533, lng: 75.8937, locality: 'Vijay Nagar', district: 'Indore', state: 'Madhya Pradesh' },
  '500032': { lat: 17.4401, lng: 78.3489, locality: 'Gachibowli', district: 'Hyderabad', state: 'Telangana' },
  '226001': { lat: 26.8500, lng: 80.9500, locality: 'Hazratganj', district: 'Lucknow', state: 'Uttar Pradesh' },
  '302017': { lat: 26.8530, lng: 75.8050, locality: 'Malviya Nagar', district: 'Jaipur', state: 'Rajasthan' },
  '800001': { lat: 25.6120, lng: 85.1240, locality: 'Boring Road', district: 'Patna', state: 'Bihar' }
};

export default function PincodeGeographicMapCard({
  pincode = '824101',
  locationLabel = '',
  onSelectLocality,
  onExplorePros,
  activeTradeName = 'Pros'
}) {
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'photo'
  const [geoData, setGeoData] = useState(() => {
    const defaultCoords = LOCAL_GEO_MAP[pincode] || LOCAL_GEO_MAP['824101'];
    return {
      lat: defaultCoords.lat,
      lng: defaultCoords.lng,
      locality: defaultCoords.locality,
      district: defaultCoords.district,
      state: defaultCoords.state,
      localities: []
    };
  });
  const [loading, setLoading] = useState(false);
  const [activeWorkerHover, setActiveWorkerHover] = useState(null);

  // Clean 6-digit PINCODE
  const cleanPin = (pincode || '824101').toString().trim().slice(0, 6);

  useEffect(() => {
    if (!cleanPin || cleanPin.length !== 6) return;
    loadGeoForPincode(cleanPin);
  }, [cleanPin]);

  const loadGeoForPincode = async (pin) => {
    setLoading(true);
    try {
      const res = await api.getPincodeGeo(pin);
      if (res && res.success && res.coordinates) {
        setGeoData({
          lat: res.coordinates.lat,
          lng: res.coordinates.lng,
          locality: res.locality || 'Local Hub',
          district: res.district || '',
          state: res.state || '',
          localities: res.localities || [],
          count: res.count || 0
        });
      } else {
        const fallback = LOCAL_GEO_MAP[pin] || LOCAL_GEO_MAP['824101'];
        setGeoData((prev) => ({
          ...prev,
          lat: fallback.lat,
          lng: fallback.lng,
          locality: fallback.locality,
          district: fallback.district,
          state: fallback.state
        }));
      }
    } catch (err) {
      console.warn('Failed to load geo details for', pin, err);
      const fallback = LOCAL_GEO_MAP[pin] || LOCAL_GEO_MAP['824101'];
      setGeoData((prev) => ({
        ...prev,
        lat: fallback.lat,
        lng: fallback.lng,
        locality: fallback.locality,
        district: fallback.district,
        state: fallback.state
      }));
    } finally {
      setLoading(false);
    }
  };

  const { lat, lng, locality, localities, count } = geoData;

  // OpenStreetMap embed URL with focused bounding box centered on exact coordinates
  const deltaLng = 0.038;
  const deltaLat = 0.028;
  const bbox = `${(lng - deltaLng).toFixed(4)}%2C${(lat - deltaLat).toFixed(4)}%2C${(lng + deltaLng).toFixed(4)}%2C${(lat + deltaLat).toFixed(4)}`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  // Clean icon-only worker pins (no bulky text on the map as requested)
  const workerPins = [
    {
      id: 'p1',
      name: 'Mukesh Sharma',
      trade: 'Electrician',
      Icon: Zap,
      color: '#EA580C',
      bgColor: '#FFF7ED',
      rating: 4.9,
      distance: '1.4 km',
      rate: '₹550/d',
      top: '34%',
      left: '28%'
    },
    {
      id: 'p2',
      name: 'Ramesh Verma',
      trade: 'Plumber',
      Icon: Wrench,
      color: '#0284C7',
      bgColor: '#F0F9FF',
      rating: 4.8,
      distance: '2.1 km',
      rate: '₹600/d',
      top: '56%',
      left: '68%'
    },
    {
      id: 'p3',
      name: 'Suresh Carpenter',
      trade: 'Carpenter',
      Icon: Hammer,
      color: '#D97706',
      bgColor: '#FEF3C7',
      rating: 4.8,
      distance: '2.8 km',
      rate: '₹650/d',
      top: '64%',
      left: '32%'
    }
  ];

  return (
    <div className="hl-geo-map-card" style={{
      width: '100%',
      maxWidth: '490px',
      height: '420px',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.16), 0 0 0 1.5px rgba(234, 88, 12, 0.12)',
      border: '2.5px solid #FFFFFF',
      backgroundColor: '#0F172A',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Floating Control Bar: Just PINCODE + Single Toggle Button */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        zIndex: 20,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        pointerEvents: 'auto'
      }}>
        {/* Clean Pincode Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: '999px',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
          color: '#FFFFFF',
          fontSize: '12.5px',
          fontWeight: 700,
          fontFamily: 'monospace'
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#22C55E',
            boxShadow: '0 0 6px #22C55E',
            display: 'inline-block',
            animation: 'hl-blink 1.4s ease-in-out infinite'
          }} />
          <MapPin size={13} style={{ color: '#EA580C' }} />
          <span style={{ color: '#FFFFFF', letterSpacing: '0.04em' }}>{cleanPin}</span>
        </div>

        {/* Single Compact Toggle Button: Map ↔ Photo */}
        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'map' ? 'photo' : 'map')}
          style={{
            padding: '5px 10px',
            borderRadius: '999px',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            color: '#E2E8F0',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.15s ease'
          }}
          title={viewMode === 'map' ? 'Switch to craftsman photo view' : 'Switch to geographic map view'}
        >
          {viewMode === 'map' ? (
            <>
              <ImageIcon size={12} style={{ color: '#FDBA74' }} />
              <span>Photo</span>
            </>
          ) : (
            <>
              <Compass size={12} style={{ color: '#FDBA74' }} />
              <span>Map</span>
            </>
          )}
        </button>
      </div>

      {/* Main Map or Photo View */}
      {viewMode === 'map' ? (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
          {/* Real Interactive OpenStreetMap Iframe */}
          <iframe
            key={`map-${cleanPin}-${lat}-${lng}`}
            src={osmEmbedUrl}
            title={`Geographic map of PINCODE ${cleanPin}`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              filter: 'contrast(1.04) saturate(1.08)',
              pointerEvents: 'auto'
            }}
            loading="lazy"
          />

          {/* Minimal Central Radar Ring */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '1.5px dashed rgba(234, 88, 12, 0.45)',
              backgroundColor: 'rgba(234, 88, 12, 0.06)',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'hl-pulse-ring 2.6s ease-out infinite'
            }} />
            <div style={{
              width: '210px',
              height: '210px',
              borderRadius: '50%',
              border: '1px solid rgba(234, 88, 12, 0.2)',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'hl-pulse-ring 2.6s ease-out infinite 0.8s'
            }} />

            {/* Sleek Central PIN Marker */}
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: '#EA580C',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.95), 0 4px 10px rgba(0, 0, 0, 0.3)',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}>
              <MapPin size={14} strokeWidth={2.6} />
            </div>
          </div>

          {/* Clean Icon-Only Worker Pins (No text clutter as requested) */}
          {workerPins.map((worker) => {
            const IconComp = worker.Icon;
            return (
              <div
                key={worker.id}
                onMouseEnter={() => setActiveWorkerHover(worker.id)}
                onMouseLeave={() => setActiveWorkerHover(null)}
                style={{
                  position: 'absolute',
                  top: worker.top,
                  left: worker.left,
                  zIndex: 15,
                  cursor: 'pointer',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Sleek Circular Icon Pin with Status Beacon */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  border: `2px solid ${worker.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
                  position: 'relative',
                  transition: 'transform 0.15s ease',
                  transform: activeWorkerHover === worker.id ? 'scale(1.15)' : 'scale(1)'
                }}>
                  <IconComp size={16} strokeWidth={2.4} style={{ color: worker.color }} />
                  {/* Tiny Online Status Dot */}
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#22C55E',
                    border: '1.5px solid #FFFFFF'
                  }} />
                </div>

                {/* Subtle Hover Tooltip Only */}
                {activeWorkerHover === worker.id && (
                  <div style={{
                    position: 'absolute',
                    bottom: '125%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    padding: '5px 9px',
                    borderRadius: '7px',
                    fontSize: '11px',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
                    whiteSpace: 'nowrap',
                    zIndex: 25,
                    pointerEvents: 'none',
                    border: '1px solid rgba(255,255,255,0.12)'
                  }}>
                    <span style={{ fontWeight: 700 }}>{worker.trade}</span>
                    <span style={{ color: '#94A3B8', marginLeft: '5px', fontSize: '10px' }}>{worker.distance}</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Sleek, Compact Floating Bottom Glass Bar */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            right: '10px',
            zIndex: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            padding: '7px 10px',
            boxShadow: '0 8px 20px rgba(15, 23, 42, 0.14)',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            {/* Left: Compact Postal Localities */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              flex: 1,
              minWidth: 0
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#334155',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                flexShrink: 0
              }}>
                <Building2 size={13} style={{ color: '#EA580C' }} />
                <span>{count || (localities?.length || 2)} Localities:</span>
              </span>

              {localities && localities.length > 0 ? (
                localities.slice(0, 4).map((loc, idx) => (
                  <button
                    key={`${loc.name}-${idx}`}
                    type="button"
                    onClick={() => onSelectLocality && onSelectLocality(loc)}
                    style={{
                      padding: '2px 7px',
                      borderRadius: '5px',
                      backgroundColor: '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      color: '#1E293B',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                    title={`Click to focus: ${loc.fullAddress || loc.name}`}
                  >
                    📍 {loc.name}
                  </button>
                ))
              ) : (
                <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>
                  {locality || 'Aurangabad'} & surrounding hubs
                </span>
              )}
            </div>

            {/* Right: Compact Clean CTA Button */}
            <button
              type="button"
              onClick={() => {
                if (onExplorePros) {
                  onExplorePros(cleanPin);
                } else {
                  const el = document.getElementById('find-workers-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: '#EA580C',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0,
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <span>Explore Pros</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      ) : (
        /* Photo Mode */
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <img
            src="/electrician_hero.jpg"
            alt="Skilled Local Worker on Duty"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80';
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
          {/* Subtle Bottom Floating Pill in Photo Mode */}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '12px',
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            borderRadius: '10px',
            padding: '8px 12px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldCheck size={14} style={{ color: '#22C55E' }} />
              <span>Verified Pros available in {cleanPin}</span>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: '#EA580C',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>View Map</span>
              <Compass size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
