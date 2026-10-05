import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  MapPin,
  Compass,
  Radio,
  Sparkles,
  ShieldCheck,
  Zap,
  Wrench,
  Hammer,
  ChevronRight,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  Navigation,
  Loader2,
  Building2
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

  // Normalize pincode string
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
        // Fallback local dictionary
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

  const { lat, lng, locality, district, state, localities, count } = geoData;

  // OpenStreetMap embed URL with focused bounding box centered on exact coordinates
  const deltaLng = 0.038;
  const deltaLat = 0.028;
  const bbox = `${(lng - deltaLng).toFixed(4)}%2C${(lat - deltaLat).toFixed(4)}%2C${(lng + deltaLng).toFixed(4)}%2C${(lat + deltaLat).toFixed(4)}`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  // Nearby Pro pins distributed geographically around center for visual coverage
  const sampleWorkerPins = [
    {
      id: 'p1',
      name: 'Mukesh Sharma',
      trade: 'Electrician',
      rating: 4.9,
      distance: '1.4 km',
      rate: '₹550/d',
      top: '32%',
      left: '26%',
      badge: '⚡ Electrician'
    },
    {
      id: 'p2',
      name: 'Ramesh Verma',
      trade: 'Plumber',
      rating: 4.8,
      distance: '2.1 km',
      rate: '₹600/d',
      top: '58%',
      left: '68%',
      badge: '🔧 Plumber'
    },
    {
      id: 'p3',
      name: 'Suresh Carpenter',
      trade: 'Carpenter',
      rating: 4.8,
      distance: '2.8 km',
      rate: '₹650/d',
      top: '64%',
      left: '30%',
      badge: '🪚 Carpenter'
    }
  ];

  return (
    <div className="hl-geo-map-card" style={{
      width: '100%',
      maxWidth: '490px',
      height: '420px',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.18), 0 0 0 1.5px rgba(234, 88, 12, 0.12)',
      border: '2.5px solid #FFFFFF',
      backgroundColor: '#0F172A',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Header Floating Overlay */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        right: '12px',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pointerEvents: 'none'
      }}>
        {/* Live Radar Badge & PINCODE Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '999px',
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
          color: '#FFFFFF',
          fontSize: '12px',
          fontWeight: 700,
          pointerEvents: 'auto'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#22C55E',
            boxShadow: '0 0 8px #22C55E',
            display: 'inline-block',
            animation: 'hl-blink 1.4s ease-in-out infinite'
          }} />
          <span style={{ color: '#FDBA74', letterSpacing: '0.02em' }}>
            PINCODE: {cleanPin}
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>•</span>
          <span style={{ color: '#F8FAFC', fontWeight: 600, fontSize: '11.5px' }}>
            {locality || district || 'Local Hub'}
          </span>
        </div>

        {/* View Mode Switcher: Map vs Photo */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '3px',
          borderRadius: '999px',
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
          pointerEvents: 'auto'
        }}>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            style={{
              padding: '4px 9px',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: viewMode === 'map' ? 'var(--primary, #EA580C)' : 'transparent',
              color: viewMode === 'map' ? '#FFFFFF' : '#94A3B8',
              transition: 'all 0.15s ease'
            }}
            title="View Geographic Area Map"
          >
            <Compass size={12} />
            <span>Map</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('photo')}
            style={{
              padding: '4px 9px',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: viewMode === 'photo' ? 'var(--primary, #EA580C)' : 'transparent',
              color: viewMode === 'photo' ? '#FFFFFF' : '#94A3B8',
              transition: 'all 0.15s ease'
            }}
            title="View Pro Photo"
          >
            <ImageIcon size={12} />
            <span>Photo</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
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
              filter: 'contrast(1.05) saturate(1.1)',
              pointerEvents: 'auto'
            }}
            loading="lazy"
          />

          {/* Interactive Radar Overlay Rings (Centric on PINCODE) */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            {/* Concentric Pulsing Radar Circles */}
            <div style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              border: '2px dashed rgba(234, 88, 12, 0.45)',
              backgroundColor: 'rgba(234, 88, 12, 0.08)',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'hl-pulse-ring 2.5s ease-out infinite'
            }} />
            <div style={{
              width: '240px',
              height: '240px',
              borderRadius: '50%',
              border: '1px solid rgba(234, 88, 12, 0.25)',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'hl-pulse-ring 2.5s ease-out infinite 0.75s'
            }} />

            {/* Central PINCODE Marker Icon */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'auto'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary, #EA580C)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.9), 0 6px 16px rgba(0, 0, 0, 0.35)',
                transform: 'scale(1.1)'
              }}>
                <MapPin size={17} strokeWidth={2.6} />
              </div>
              <div style={{
                marginTop: '4px',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                color: '#FFFFFF',
                fontSize: '10.5px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                letterSpacing: '0.02em'
              }}>
                📍 {cleanPin} Hub
              </div>
            </div>
          </div>

          {/* Floating Verified Pro Pins in this PINCODE */}
          {sampleWorkerPins.map((worker) => (
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
              <div style={{
                padding: '3px 8px',
                borderRadius: '999px',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                fontSize: '10.5px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.22)',
                border: '1.5px solid #EA580C',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#22C55E'
                }} />
                <span>{worker.badge}</span>
                <span style={{ color: '#EA580C', fontSize: '9.5px' }}>{worker.distance}</span>
              </div>

              {/* Tooltip on hover */}
              {activeWorkerHover === worker.id && (
                <div style={{
                  position: 'absolute',
                  bottom: '120%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                  whiteSpace: 'nowrap',
                  zIndex: 25,
                  pointerEvents: 'none',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ fontWeight: 700 }}>{worker.name}</div>
                  <div style={{ color: '#94A3B8', fontSize: '10px' }}>
                    ★ {worker.rating} • {worker.rate} • Available
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Bottom Glassmorphic Localities & Action Dock */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            right: '10px',
            zIndex: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(10px)',
            borderRadius: '14px',
            padding: '10px 12px',
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.16)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {/* Top row: Postal API locality info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#334155', fontWeight: 600 }}>
                <Building2 size={13} style={{ color: '#EA580C', flexShrink: 0 }} />
                <span>
                  <strong>{count || localities.length || 2}</strong> official postal {count === 1 ? 'locality' : 'localities'} in {cleanPin} ({state || 'India'} Circle)
                </span>
              </div>
              <span style={{
                color: '#16A34A',
                backgroundColor: '#DCFCE7',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '10px'
              }}>
                ⚡ 5km Fast Radius
              </span>
            </div>

            {/* Postal Localities Chips (retrieved from Postal API) */}
            {localities && localities.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                overflowX: 'auto',
                paddingBottom: '2px',
                scrollbarWidth: 'none'
              }}>
                {localities.slice(0, 5).map((loc, idx) => (
                  <button
                    key={`${loc.name}-${idx}`}
                    type="button"
                    onClick={() => onSelectLocality && onSelectLocality(loc)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      color: '#1E293B',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                    title={`Postal address: ${loc.fullAddress || loc.name}`}
                  >
                    📍 {loc.name}
                  </button>
                ))}
              </div>
            )}

            {/* CTA Button to browse workers in this PINCODE */}
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
                width: '100%',
                padding: '7px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary, #EA580C)',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Explore Verified Workers in PINCODE {cleanPin}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* Photo Mode (Hero craftsman photo) */
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
          {/* Floating Badge on Photo */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            right: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            padding: '10px 14px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={15} style={{ color: '#22C55E' }} />
                <span>Verified Pro in {cleanPin}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                Available tomorrow for instant dispatch
              </div>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary, #EA580C)',
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
              <Compass size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
