import { api } from '../api/client';

/**
 * High-speed verified local postal registry for instantaneous zero-latency responses.
 * Provides the canonical default address, locality, district, state, and known postal sub-areas.
 */
export const LOCAL_PINCODE_REGISTRY = Object.freeze({
  '140413': {
    locality: 'Bajheri',
    district: 'Mohali',
    state: 'Punjab',
    defaultAddress: 'Bajheri, Mohali, Punjab',
    localities: ['Bajheri', 'Gharuan', 'Bassian Brahman', 'Garangan', 'Marauli Kalan', 'Sakrulapur']
  },
  '143410': {
    locality: 'Dadeha Sahib',
    district: 'Amritsar / Tarn Taran',
    state: 'Punjab',
    defaultAddress: 'Dadeha Sahib, Amritsar, Punjab',
    localities: ['Dadeha Sahib', 'Sarhali', 'Khara', 'Marhana', 'Sohawa', 'Thatha']
  },
  '462011': {
    locality: 'MP Nagar',
    district: 'Bhopal',
    state: 'Madhya Pradesh',
    defaultAddress: 'MP Nagar, Bhopal, Madhya Pradesh',
    localities: ['MP Nagar Zone 1', 'MP Nagar Zone 2', 'Chetak Bridge', 'DB City Mall Area', 'Shiksha Mandal']
  },
  '462016': {
    locality: 'Arera Colony',
    district: 'Bhopal',
    state: 'Madhya Pradesh',
    defaultAddress: 'Arera Colony, Bhopal, Madhya Pradesh',
    localities: ['Arera Colony', 'Arera Hills', 'Bittan Market', '10 No. Market', 'Gulmohar Colony', 'E-Sector']
  },
  '462023': {
    locality: 'Govindpura / BHEL',
    district: 'Bhopal',
    state: 'Madhya Pradesh',
    defaultAddress: 'Govindpura, Bhopal, Madhya Pradesh',
    localities: ['Govindpura Industrial Area', 'BHEL Township', 'Indrapuri Sector A & C', 'Piplani', 'Jubilee Gate']
  },
  '462003': {
    locality: 'New Market',
    district: 'Bhopal',
    state: 'Madhya Pradesh',
    defaultAddress: 'New Market, Bhopal, Madhya Pradesh',
    localities: ['New Market', 'TT Nagar', 'Malviya Nagar', 'Roshanpura Square']
  },
  '462042': {
    locality: 'Kolar Road',
    district: 'Bhopal',
    state: 'Madhya Pradesh',
    defaultAddress: 'Kolar Road, Bhopal, Madhya Pradesh',
    localities: ['Kolar Road', 'Chuna Bhatti', 'Sarvdharm Colony', 'D-Mart Kolar']
  },
  '462039': {
    locality: 'Shahpura',
    district: 'Bhopal',
    state: 'Madhya Pradesh',
    defaultAddress: 'Shahpura, Bhopal, Madhya Pradesh',
    localities: ['Shahpura', 'Trilanga', 'Bawadiya Kalan', 'Manisha Market']
  },
  '462001': {
    locality: 'Old Bhopal GPO',
    district: 'Bhopal',
    state: 'Madhya Pradesh',
    defaultAddress: 'Old Bhopal GPO, Bhopal, Madhya Pradesh',
    localities: ['Old Bhopal GPO', 'Hamidia Road', 'Bhopal Junction', 'Peergate']
  },
  '462030': {
    locality: 'Bairagarh',
    district: 'Bhopal',
    state: 'Madhya Pradesh',
    defaultAddress: 'Bairagarh, Bhopal, Madhya Pradesh',
    localities: ['Bairagarh', 'Sant Hirdaram Nagar', 'Halalpur', 'Huzur']
  },
  '110001': {
    locality: 'Connaught Place',
    district: 'Central Delhi',
    state: 'Delhi',
    defaultAddress: 'Connaught Place, Central Delhi, Delhi',
    localities: ['Connaught Place', 'Janpath', 'Bengali Market', 'Sansad Marg', 'Bhagat Singh Market']
  },
  '400058': {
    locality: 'Andheri West',
    district: 'Mumbai',
    state: 'Maharashtra',
    defaultAddress: 'Andheri West, Mumbai, Maharashtra',
    localities: ['Andheri West', 'Lokhandwala Complex', 'Versova Link Road', 'Four Bungalows']
  },
  '560034': {
    locality: 'Koramangala',
    district: 'Bengaluru',
    state: 'Karnataka',
    defaultAddress: 'Koramangala, Bengaluru, Karnataka',
    localities: ['Koramangala 1st Block', 'Koramangala 4th Block', 'St. Johns Medical College', 'Agara Village']
  },
  '452010': {
    locality: 'Vijay Nagar',
    district: 'Indore',
    state: 'Madhya Pradesh',
    defaultAddress: 'Vijay Nagar, Indore, Madhya Pradesh',
    localities: ['Vijay Nagar', 'Scheme No 54', 'Scheme No 78', 'Bapat Square']
  },
  '500032': {
    locality: 'Gachibowli',
    district: 'Hyderabad',
    state: 'Telangana',
    defaultAddress: 'Gachibowli, Hyderabad, Telangana',
    localities: ['Gachibowli', 'Financial District', 'Nanakramguda', 'Telecom Nagar']
  },
  '226001': {
    locality: 'Hazratganj',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    defaultAddress: 'Hazratganj, Lucknow, Uttar Pradesh',
    localities: ['Hazratganj', 'Lalbagh', 'Raj Bhavan Colony', 'Vidhan Sabha Marg']
  },
  '302017': {
    locality: 'Malviya Nagar',
    district: 'Jaipur',
    state: 'Rajasthan',
    defaultAddress: 'Malviya Nagar, Jaipur, Rajasthan',
    localities: ['Malviya Nagar', 'Calgiri Marg', 'Model Town', 'Jagatpura Road']
  },
  '411038': {
    locality: 'Kothrud',
    district: 'Pune',
    state: 'Maharashtra',
    defaultAddress: 'Kothrud, Pune, Maharashtra',
    localities: ['Kothrud', 'Paud Road', 'Karve Road', 'Mayur Colony']
  },
  '700016': {
    locality: 'Park Street',
    district: 'Kolkata',
    state: 'West Bengal',
    defaultAddress: 'Park Street, Kolkata, West Bengal',
    localities: ['Park Street', 'Mullick Bazar', 'Camac Street', 'Russell Street']
  },
  '380009': {
    locality: 'Navrangpura',
    district: 'Ahmedabad',
    state: 'Gujarat',
    defaultAddress: 'Navrangpura, Ahmedabad, Gujarat',
    localities: ['Navrangpura', 'Commerce Six Roads', 'University Area', 'C.G. Road']
  },
  '800001': {
    locality: 'Boring Road',
    district: 'Patna',
    state: 'Bihar',
    defaultAddress: 'Boring Road, Patna, Bihar',
    localities: ['Boring Road', 'Patna GPO', 'Dak Bungalow', 'Frazer Road']
  },
  '824101': {
    locality: 'Aurangabad',
    district: 'Aurangabad',
    state: 'Bihar',
    defaultAddress: 'Aurangabad, Bihar',
    localities: ['Aurangabad (BH)', 'Aurangabad Kutchehry', 'Maharajganj']
  }
});

// Regional fallbacks for 2-digit PINCODE prefixes
const REGION_PREFIX_NAMES = {
  '11': { district: 'Central Delhi', state: 'Delhi' },
  '12': { district: 'Gurugram / Rohtak', state: 'Haryana' },
  '13': { district: 'Ambala / Kurukshetra', state: 'Haryana' },
  '14': { district: 'Mohali / Rupnagar', state: 'Punjab' },
  '15': { district: 'Bathinda / Firozpur', state: 'Punjab' },
  '16': { district: 'Chandigarh', state: 'Chandigarh' },
  '17': { district: 'Shimla', state: 'Himachal Pradesh' },
  '18': { district: 'Jammu', state: 'Jammu & Kashmir' },
  '19': { district: 'Srinagar', state: 'Jammu & Kashmir' },
  '20': { district: 'Noida / Ghaziabad', state: 'Uttar Pradesh' },
  '21': { district: 'Prayagraj', state: 'Uttar Pradesh' },
  '22': { district: 'Lucknow', state: 'Uttar Pradesh' },
  '24': { district: 'Dehradun', state: 'Uttarakhand' },
  '25': { district: 'Meerut', state: 'Uttar Pradesh' },
  '28': { district: 'Agra / Jhansi', state: 'Uttar Pradesh' },
  '30': { district: 'Jaipur', state: 'Rajasthan' },
  '31': { district: 'Udaipur', state: 'Rajasthan' },
  '34': { district: 'Jodhpur', state: 'Rajasthan' },
  '38': { district: 'Ahmedabad', state: 'Gujarat' },
  '39': { district: 'Surat / Vadodara', state: 'Gujarat' },
  '40': { district: 'Mumbai', state: 'Maharashtra' },
  '41': { district: 'Pune', state: 'Maharashtra' },
  '44': { district: 'Nagpur', state: 'Maharashtra' },
  '45': { district: 'Indore', state: 'Madhya Pradesh' },
  '46': { district: 'Bhopal', state: 'Madhya Pradesh' },
  '47': { district: 'Gwalior', state: 'Madhya Pradesh' },
  '48': { district: 'Jabalpur', state: 'Madhya Pradesh' },
  '49': { district: 'Raipur', state: 'Chhattisgarh' },
  '50': { district: 'Hyderabad', state: 'Telangana' },
  '52': { district: 'Vijayawada', state: 'Andhra Pradesh' },
  '53': { district: 'Visakhapatnam', state: 'Andhra Pradesh' },
  '56': { district: 'Bengaluru', state: 'Karnataka' },
  '57': { district: 'Mangaluru', state: 'Karnataka' },
  '60': { district: 'Chennai', state: 'Tamil Nadu' },
  '64': { district: 'Coimbatore', state: 'Tamil Nadu' },
  '68': { district: 'Kochi', state: 'Kerala' },
  '70': { district: 'Kolkata', state: 'West Bengal' },
  '75': { district: 'Bhubaneswar', state: 'Odisha' },
  '78': { district: 'Guwahati', state: 'Assam' },
  '80': { district: 'Patna', state: 'Bihar' },
  '82': { district: 'Aurangabad / Gaya', state: 'Bihar' },
  '83': { district: 'Ranchi', state: 'Jharkhand' }
};

// In-memory runtime cache for dynamically resolved PINCODEs
const memoryPincodeCache = new Map();

/**
 * Format address neatly without repeated words (e.g. avoid "Bhopal, Bhopal, Madhya Pradesh")
 */
export function formatAddressText(localityName, district, state) {
  const parts = [];
  const loc = (localityName || '').trim();
  const dist = (district || '').trim();
  const st = (state || '').trim();

  if (loc) parts.push(loc);

  if (dist && !loc.toLowerCase().includes(dist.toLowerCase())) {
    parts.push(dist);
  }

  if (st && !loc.toLowerCase().includes(st.toLowerCase()) && !dist.toLowerCase().includes(st.toLowerCase())) {
    parts.push(st);
  }

  return parts.join(', ');
}

/**
 * Asynchronously lookup the default address for a given 6-digit Indian PINCODE.
 * Automatically resolves and returns:
 * - defaultAddress: clean formatted full default address (e.g. "Bajheri, Mohali, Punjab")
 * - locality: primary locality/village/town name (e.g. "Bajheri")
 * - district: district name
 * - state: state name
 * - localities: array of all post office localities in this PINCODE for quick selection
 */
export async function lookupPincodeDefaultAddress(pincode) {
  if (!pincode) return null;
  const pin = String(pincode).replace(/\D/g, '').slice(0, 6);

  if (pin.length !== 6) {
    return null;
  }

  // Check in-memory cache first
  if (memoryPincodeCache.has(pin)) {
    return memoryPincodeCache.get(pin);
  }

  // Check verified local registry for instant response
  const localHub = LOCAL_PINCODE_REGISTRY[pin];
  if (localHub) {
    const result = {
      success: true,
      pincode: pin,
      locality: localHub.locality,
      district: localHub.district,
      state: localHub.state,
      defaultAddress: localHub.defaultAddress,
      localities: localHub.localities,
      source: 'local_registry'
    };
    memoryPincodeCache.set(pin, result);
    return result;
  }

  // Try API client endpoint
  try {
    const res = await api.getPincodeAddresses(pin);
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      const primary = res.data[0];
      const locName = primary.name || primary.locality || res.locality || 'Local Hub';
      const dist = primary.district || res.district || '';
      const st = primary.state || res.state || '';
      const formatted = formatAddressText(locName, dist, st);
      const allLocs = Array.from(new Set(res.data.map((d) => d.name || d.locality).filter(Boolean)));

      const result = {
        success: true,
        pincode: pin,
        locality: locName,
        district: dist,
        state: st,
        defaultAddress: formatted,
        localities: allLocs.length > 0 ? allLocs : [locName],
        data: res.data,
        source: 'api_details'
      };
      memoryPincodeCache.set(pin, result);
      return result;
    }
  } catch (err) {
    // API endpoint failed or network offline, proceed to postal API fallback
  }

  // Direct official postal API fallback
  try {
    const directRes = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    if (directRes.ok) {
      const directData = await directRes.json();
      if (Array.isArray(directData) && directData[0]?.Status === 'Success' && Array.isArray(directData[0]?.PostOffice) && directData[0].PostOffice.length > 0) {
        const poList = directData[0].PostOffice;
        const primary = poList[0];
        const locName = primary.Name || primary.name || 'Local Area';
        const dist = primary.District || primary.district || '';
        const st = primary.State || primary.state || '';
        const formatted = formatAddressText(locName, dist, st);
        const allLocs = Array.from(new Set(poList.map((p) => p.Name || p.name).filter(Boolean)));

        const result = {
          success: true,
          pincode: pin,
          locality: locName,
          district: dist,
          state: st,
          defaultAddress: formatted,
          localities: allLocs,
          data: poList,
          source: 'postal_api_direct'
        };
        memoryPincodeCache.set(pin, result);
        return result;
      }
    }
  } catch (err) {
    // Postal API timed out or network error
  }

  // Regional prefix centroid fallback as safety net
  const prefix = pin.slice(0, 2);
  const region = REGION_PREFIX_NAMES[prefix] || { district: 'Local District', state: 'India' };
  const fallbackAddress = `${region.district}, ${region.state}`;

  const fallbackResult = {
    success: true,
    pincode: pin,
    locality: region.district,
    district: region.district,
    state: region.state,
    defaultAddress: fallbackAddress,
    localities: [region.district],
    source: 'region_fallback'
  };
  memoryPincodeCache.set(pin, fallbackResult);
  return fallbackResult;
}
