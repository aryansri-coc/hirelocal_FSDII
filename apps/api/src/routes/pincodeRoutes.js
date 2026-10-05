import express from 'express';

const router = express.Router();
const pincodeCache = new Map();

// Top Pan-India Hubs with verified postal pincodes & localities
const PAN_INDIA_POPULAR_HUBS = [
  { name: 'Aurangabad (BH)', locality: 'Aurangabad', district: 'Aurangabad(BH)', state: 'Bihar', pincode: '824101', label: 'Aurangabad, Bihar (824101)', workersCount: 4, lat: 24.7538, lng: 84.3736 },
  { name: 'Dadeha Sahib / Sarhali', locality: 'Sarhali', district: 'Amritsar', state: 'Punjab', pincode: '143410', label: 'Amritsar / Tarn Taran (143410)', workersCount: 3, lat: 31.3256, lng: 74.9213 },
  { name: 'MP Nagar', locality: 'MP Nagar', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462011', label: 'MP Nagar, Bhopal (462011)', workersCount: 4, lat: 23.2332, lng: 77.4343 },
  { name: 'Arera Colony', locality: 'Arera Colony', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462016', label: 'Arera Colony, Bhopal (462016)', workersCount: 3, lat: 23.2100, lng: 77.4330 },
  { name: 'Indrapuri / BHEL', locality: 'Govindpura', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462023', label: 'Govindpura / BHEL, Bhopal (462023)', workersCount: 4, lat: 23.2650, lng: 77.4640 },
  { name: 'Kolar Road', locality: 'Kolar Road', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462042', label: 'Kolar Road, Bhopal (462042)', workersCount: 3, lat: 23.1850, lng: 77.4180 },
  { name: 'New Market', locality: 'New Market', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462003', label: 'New Market, Bhopal (462003)', workersCount: 3, lat: 23.2380, lng: 77.4010 },
  { name: 'Shahpura', locality: 'Shahpura', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462039', label: 'Shahpura, Bhopal (462039)', workersCount: 2, lat: 23.1990, lng: 77.4290 },
  { name: 'Connaught Place', locality: 'Connaught Place', district: 'Central Delhi', state: 'Delhi', pincode: '110001', label: 'Connaught Place, Delhi (110001)', workersCount: 5, lat: 28.6315, lng: 77.2167 },
  { name: 'Andheri West', locality: 'Andheri West', district: 'Mumbai', state: 'Maharashtra', pincode: '400058', label: 'Andheri West, Mumbai (400058)', workersCount: 5, lat: 19.1197, lng: 72.8468 },
  { name: 'Koramangala', locality: 'Koramangala', district: 'Bengaluru', state: 'Karnataka', pincode: '560034', label: 'Koramangala, Bengaluru (560034)', workersCount: 4, lat: 12.9352, lng: 77.6245 },
  { name: 'Vijay Nagar', locality: 'Vijay Nagar', district: 'Indore', state: 'Madhya Pradesh', pincode: '452010', label: 'Vijay Nagar, Indore (452010)', workersCount: 3, lat: 22.7533, lng: 75.8937 },
  { name: 'Gachibowli', locality: 'Gachibowli', district: 'Hyderabad', state: 'Telangana', pincode: '500032', label: 'Gachibowli, Hyderabad (500032)', workersCount: 4, lat: 17.4401, lng: 78.3489 },
  { name: 'Hazratganj', locality: 'Hazratganj', district: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001', label: 'Hazratganj, Lucknow (226001)', workersCount: 3, lat: 26.8500, lng: 80.9500 },
  { name: 'Malviya Nagar', locality: 'Malviya Nagar', district: 'Jaipur', state: 'Rajasthan', pincode: '302017', label: 'Malviya Nagar, Jaipur (302017)', workersCount: 3, lat: 26.8530, lng: 75.8050 },
  { name: 'Kothrud', locality: 'Kothrud', district: 'Pune', state: 'Maharashtra', pincode: '411038', label: 'Kothrud, Pune (411038)', workersCount: 3, lat: 18.5074, lng: 73.8077 },
  { name: 'Park Street', locality: 'Park Street', district: 'Kolkata', state: 'West Bengal', pincode: '700016', label: 'Park Street, Kolkata (700016)', workersCount: 3, lat: 22.5510, lng: 88.3530 },
  { name: 'Navrangpura', locality: 'Navrangpura', district: 'Ahmedabad', state: 'Gujarat', pincode: '380009', label: 'Navrangpura, Ahmedabad (380009)', workersCount: 3, lat: 23.0370, lng: 72.5610 },
  { name: 'Boring Road', locality: 'Boring Road', district: 'Patna', state: 'Bihar', pincode: '800001', label: 'Boring Road, Patna (800001)', workersCount: 3, lat: 25.6120, lng: 85.1240 }
];

// Verified coordinates dictionary for instant sub-millisecond mapping
const PINCODE_COORDINATES = {
  '824101': { lat: 24.7538, lng: 84.3736, locality: 'Aurangabad', district: 'Aurangabad (BH)', state: 'Bihar' },
  '143410': { lat: 31.3256, lng: 74.9213, locality: 'Dadeha Sahib / Sarhali', district: 'Amritsar / Tarn Taran', state: 'Punjab' },
  '462011': { lat: 23.2332, lng: 77.4343, locality: 'MP Nagar', district: 'Bhopal', state: 'Madhya Pradesh' },
  '462016': { lat: 23.2100, lng: 77.4330, locality: 'Arera Colony', district: 'Bhopal', state: 'Madhya Pradesh' },
  '462023': { lat: 23.2650, lng: 77.4640, locality: 'Govindpura / BHEL', district: 'Bhopal', state: 'Madhya Pradesh' },
  '462003': { lat: 23.2380, lng: 77.4010, locality: 'New Market', district: 'Bhopal', state: 'Madhya Pradesh' },
  '462042': { lat: 23.1850, lng: 77.4180, locality: 'Kolar Road', district: 'Bhopal', state: 'Madhya Pradesh' },
  '462039': { lat: 23.1990, lng: 77.4290, locality: 'Shahpura', district: 'Bhopal', state: 'Madhya Pradesh' },
  '462001': { lat: 23.2620, lng: 77.4080, locality: 'Old Bhopal GPO', district: 'Bhopal', state: 'Madhya Pradesh' },
  '462030': { lat: 23.2790, lng: 77.3480, locality: 'Bairagarh', district: 'Bhopal', state: 'Madhya Pradesh' },
  '110001': { lat: 28.6315, lng: 77.2167, locality: 'Connaught Place', district: 'Central Delhi', state: 'Delhi' },
  '400058': { lat: 19.1197, lng: 72.8468, locality: 'Andheri West', district: 'Mumbai', state: 'Maharashtra' },
  '560034': { lat: 12.9352, lng: 77.6245, locality: 'Koramangala', district: 'Bengaluru', state: 'Karnataka' },
  '452010': { lat: 22.7533, lng: 75.8937, locality: 'Vijay Nagar', district: 'Indore', state: 'Madhya Pradesh' },
  '500032': { lat: 17.4401, lng: 78.3489, locality: 'Gachibowli', district: 'Hyderabad', state: 'Telangana' },
  '226001': { lat: 26.8500, lng: 80.9500, locality: 'Hazratganj', district: 'Lucknow', state: 'Uttar Pradesh' },
  '302017': { lat: 26.8530, lng: 75.8050, locality: 'Malviya Nagar', district: 'Jaipur', state: 'Rajasthan' },
  '411038': { lat: 18.5074, lng: 73.8077, locality: 'Kothrud', district: 'Pune', state: 'Maharashtra' },
  '700016': { lat: 22.5510, lng: 88.3530, locality: 'Park Street', district: 'Kolkata', state: 'West Bengal' },
  '380009': { lat: 23.0370, lng: 72.5610, locality: 'Navrangpura', district: 'Ahmedabad', state: 'Gujarat' },
  '800001': { lat: 25.6120, lng: 85.1240, locality: 'Boring Road', district: 'Patna', state: 'Bihar' }
};

// Regional state centroid fallbacks by 2-digit PINCODE prefix across India
const REGION_CENTROIDS = {
  '11': { lat: 28.6139, lng: 77.2090, state: 'Delhi' },
  '12': { lat: 29.0588, lng: 76.0856, state: 'Haryana' },
  '13': { lat: 30.1300, lng: 77.2800, state: 'Haryana' },
  '14': { lat: 31.1471, lng: 75.3412, state: 'Punjab' },
  '15': { lat: 30.2110, lng: 74.9455, state: 'Punjab' },
  '16': { lat: 30.7333, lng: 76.7794, state: 'Chandigarh' },
  '17': { lat: 31.1048, lng: 77.1734, state: 'Himachal Pradesh' },
  '18': { lat: 34.0837, lng: 74.7973, state: 'Jammu & Kashmir' },
  '19': { lat: 34.0837, lng: 74.7973, state: 'Jammu & Kashmir' },
  '20': { lat: 28.5355, lng: 77.3910, state: 'Uttar Pradesh' },
  '21': { lat: 25.4358, lng: 81.8463, state: 'Uttar Pradesh' },
  '22': { lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh' },
  '24': { lat: 30.3165, lng: 78.0322, state: 'Uttarakhand' },
  '25': { lat: 28.9845, lng: 77.7064, state: 'Uttar Pradesh' },
  '28': { lat: 25.4484, lng: 78.5685, state: 'Uttar Pradesh' },
  '30': { lat: 26.9124, lng: 75.7873, state: 'Rajasthan' },
  '31': { lat: 24.5854, lng: 73.7125, state: 'Rajasthan' },
  '34': { lat: 26.2389, lng: 73.0243, state: 'Rajasthan' },
  '38': { lat: 23.0225, lng: 72.5714, state: 'Gujarat' },
  '39': { lat: 21.1702, lng: 72.8311, state: 'Gujarat' },
  '40': { lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  '41': { lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  '44': { lat: 21.1458, lng: 79.0882, state: 'Maharashtra' },
  '45': { lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh' },
  '46': { lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh' },
  '47': { lat: 26.2183, lng: 78.1828, state: 'Madhya Pradesh' },
  '48': { lat: 23.1815, lng: 79.9864, state: 'Madhya Pradesh' },
  '49': { lat: 21.2514, lng: 81.6296, state: 'Chhattisgarh' },
  '50': { lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  '52': { lat: 16.5062, lng: 80.6480, state: 'Andhra Pradesh' },
  '53': { lat: 17.6868, lng: 83.2185, state: 'Andhra Pradesh' },
  '56': { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  '57': { lat: 12.9141, lng: 74.8560, state: 'Karnataka' },
  '58': { lat: 15.3647, lng: 75.1240, state: 'Karnataka' },
  '60': { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  '62': { lat: 9.9252, lng: 78.1198, state: 'Tamil Nadu' },
  '64': { lat: 11.0168, lng: 76.9558, state: 'Tamil Nadu' },
  '68': { lat: 9.9312, lng: 76.2673, state: 'Kerala' },
  '69': { lat: 8.5241, lng: 76.9366, state: 'Kerala' },
  '70': { lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  '75': { lat: 20.2961, lng: 85.8245, state: 'Odisha' },
  '78': { lat: 26.1445, lng: 91.7362, state: 'Assam' },
  '80': { lat: 25.5941, lng: 85.1376, state: 'Bihar' },
  '82': { lat: 24.7538, lng: 84.3736, state: 'Bihar' },
  '83': { lat: 23.3441, lng: 85.3096, state: 'Jharkhand' }
};

/**
 * Resolve geographic coordinates for any 6-digit PINCODE across India
 */
async function getCoordinatesForPincode(pin, addresses = []) {
  if (PINCODE_COORDINATES[pin]) {
    return PINCODE_COORDINATES[pin];
  }

  const geoCacheKey = `geo_${pin}`;
  if (pincodeCache.has(geoCacheKey)) {
    return pincodeCache.get(geoCacheKey);
  }

  // 1. Try Nominatim Geocoding API with 2.5s timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${pin}&country=India&format=json`, {
      headers: { 'User-Agent': 'HireLocal-Pincode-Radar/1.0' },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (nomRes.ok) {
      const nomData = await nomRes.json();
      if (Array.isArray(nomData) && nomData.length > 0) {
        const item = nomData[0];
        const result = {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          displayName: item.display_name,
          source: 'nominatim'
        };
        pincodeCache.set(geoCacheKey, result);
        return result;
      }
    }
  } catch (err) {
    // Graceful fallback to postal region centroid
  }

  // 2. Fallback to Postal Circle 2-digit regional centroid
  const prefix = pin.substring(0, 2);
  const regional = REGION_CENTROIDS[prefix] || REGION_CENTROIDS['46'];
  const firstAddr = addresses[0];

  const result = {
    lat: regional.lat,
    lng: regional.lng,
    locality: firstAddr?.name || firstAddr?.locality || regional.state,
    district: firstAddr?.district || regional.state,
    state: firstAddr?.state || regional.state,
    source: 'region_centroid'
  };

  pincodeCache.set(geoCacheKey, result);
  return result;
}

// Rich fallback addresses for key hubs if Postal API is temporarily slow or rate limited
const PINCODE_LOCAL_FALLBACKS = {
  '824101': [
    { name: 'Aurangabad (BH)', block: 'Aurangabad', district: 'Aurangabad(BH)', state: 'Bihar', pincode: '824101', branchType: 'Head Post Office', deliveryStatus: 'Delivery' },
    { name: 'Aurangabad Kutchehry', block: 'Aurangabad', district: 'Aurangabad(BH)', state: 'Bihar', pincode: '824101', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' }
  ],
  '143410': [
    { name: 'Dadeha Sahib', block: 'Sarhali', district: 'Amritsar', state: 'Punjab', pincode: '143410', branchType: 'Branch Post Office', deliveryStatus: 'Delivery' },
    { name: 'Sarhali (Tarn Taran)', block: 'Sarhali', district: 'Tarn Taran', state: 'Punjab', pincode: '143410', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Khara', block: 'Sarhali', district: 'Amritsar', state: 'Punjab', pincode: '143410', branchType: 'Branch Post Office', deliveryStatus: 'Delivery' },
    { name: 'Marhana', block: 'Sarhali', district: 'Amritsar', state: 'Punjab', pincode: '143410', branchType: 'Branch Post Office', deliveryStatus: 'Delivery' },
    { name: 'Sohawa', block: 'Sarhali', district: 'Amritsar', state: 'Punjab', pincode: '143410', branchType: 'Branch Post Office', deliveryStatus: 'Delivery' },
    { name: 'Thatha', block: 'Sarhali', district: 'Amritsar', state: 'Punjab', pincode: '143410', branchType: 'Branch Post Office', deliveryStatus: 'Delivery' },
    { name: 'Gandiwind Dhattal', block: 'Sarhali', district: 'Tarn Taran', state: 'Punjab', pincode: '143410', branchType: 'Branch Post Office', deliveryStatus: 'Delivery' }
  ],
  '462011': [
    { name: 'MP Nagar Zone 1', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462011', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'MP Nagar Zone 2', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462011', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Shiksha Mandal', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462011', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Chetak Bridge', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462011', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'DB City Mall Area', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462011', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' }
  ],
  '462016': [
    { name: 'Arera Colony E-Sector', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462016', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Bittan Market', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462016', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: '10 No. Market', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462016', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Gulmohar Colony', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462016', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' }
  ],
  '462023': [
    { name: 'Govindpura Industrial Area', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462023', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'BHEL Township', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462023', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Indrapuri Sector A & C', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462023', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Piplani Post Office', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462023', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Jubilee Gate', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462023', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' }
  ],
  '462003': [
    { name: 'TT Nagar Head Post Office', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462003', branchType: 'Head Post Office', deliveryStatus: 'Delivery' },
    { name: 'New Market Top N Town', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462003', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Malviya Nagar', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462003', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Roshanpura Square', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462003', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' }
  ],
  '462042': [
    { name: 'Chuna Bhatti', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462042', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Kolar Road D-Mart', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462042', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Sarvdharm Colony', block: 'Huzur', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462042', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' }
  ],
  '110001': [
    { name: 'Connaught Place', block: 'New Delhi', district: 'Central Delhi', state: 'Delhi', pincode: '110001', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Bengali Market', block: 'New Delhi', district: 'Central Delhi', state: 'Delhi', pincode: '110001', branchType: 'Sub Post Office', deliveryStatus: 'Non-Delivery' },
    { name: 'Janpath', block: 'New Delhi', district: 'Central Delhi', state: 'Delhi', pincode: '110001', branchType: 'Sub Post Office', deliveryStatus: 'Non-Delivery' },
    { name: 'Bhagat Singh Market', block: 'New Delhi', district: 'Central Delhi', state: 'Delhi', pincode: '110001', branchType: 'Sub Post Office', deliveryStatus: 'Non-Delivery' },
    { name: 'Parliament House', block: 'New Delhi', district: 'Central Delhi', state: 'Delhi', pincode: '110001', branchType: 'Sub Post Office', deliveryStatus: 'Non-Delivery' },
    { name: 'Supreme Court', block: 'New Delhi', district: 'Central Delhi', state: 'Delhi', pincode: '110001', branchType: 'Sub Post Office', deliveryStatus: 'Non-Delivery' },
    { name: 'Sansad Marg', block: 'New Delhi', district: 'Central Delhi', state: 'Delhi', pincode: '110001', branchType: 'Head Post Office', deliveryStatus: 'Delivery' }
  ],
  '400058': [
    { name: 'Andheri West', block: 'Mumbai', district: 'Mumbai', state: 'Maharashtra', pincode: '400058', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Versova Link Road', block: 'Mumbai', district: 'Mumbai', state: 'Maharashtra', pincode: '400058', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Lokhandwala Complex', block: 'Mumbai', district: 'Mumbai', state: 'Maharashtra', pincode: '400058', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Four Bungalows', block: 'Mumbai', district: 'Mumbai', state: 'Maharashtra', pincode: '400058', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' }
  ],
  '560034': [
    { name: 'Koramangala 1st Block', block: 'Bengaluru South', district: 'Bengaluru', state: 'Karnataka', pincode: '560034', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Koramangala 4th Block', block: 'Bengaluru South', district: 'Bengaluru', state: 'Karnataka', pincode: '560034', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'St. John’s Medical College', block: 'Bengaluru South', district: 'Bengaluru', state: 'Karnataka', pincode: '560034', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Agara Village', block: 'Bengaluru South', district: 'Bengaluru', state: 'Karnataka', pincode: '560034', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' }
  ],
  '452010': [
    { name: 'Vijay Nagar', block: 'Indore', district: 'Indore', state: 'Madhya Pradesh', pincode: '452010', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Scheme No 54', block: 'Indore', district: 'Indore', state: 'Madhya Pradesh', pincode: '452010', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Scheme No 78', block: 'Indore', district: 'Indore', state: 'Madhya Pradesh', pincode: '452010', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' },
    { name: 'Bapat Square', block: 'Indore', district: 'Indore', state: 'Madhya Pradesh', pincode: '452010', branchType: 'Sub Post Office', deliveryStatus: 'Delivery' }
  ]
};

/**
 * Format a raw PostOffice record into standard HireLocal address shape
 */
function formatPostOffice(po) {
  const name = po.Name || po.name;
  const district = po.District || po.district || '';
  const state = po.State || po.state || '';
  const pincode = po.Pincode || po.pincode || '';
  const block = po.Block || po.block || '';
  const branchType = po.BranchType || po.branchType || 'Sub Post Office';
  const deliveryStatus = po.DeliveryStatus || po.deliveryStatus || 'Delivery';
  const country = po.Country || po.country || 'India';

  const blockPart = block && block !== district ? `${block}, ` : '';
  const fullAddress = `${name}, ${blockPart}${district}, ${state} - ${pincode}`;
  const label = `${name}, ${district} (${pincode})`;

  return {
    name,
    locality: name,
    district,
    block,
    state,
    country,
    pincode,
    branchType,
    deliveryStatus,
    fullAddress,
    label,
    city: district
  };
}

/**
 * Fetch ALL postal addresses for a 6-digit PINCODE using official Indian Postal API
 */
async function fetchAllAddressesForPincode(pincode) {
  const pin = pincode.trim();
  const cacheKey = `pin_${pin}`;

  if (pincodeCache.has(cacheKey)) {
    return pincodeCache.get(cacheKey);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const apiRes = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (apiRes.ok) {
      const apiData = await apiRes.json();
      if (Array.isArray(apiData) && apiData[0]?.Status === 'Success' && Array.isArray(apiData[0]?.PostOffice)) {
        const results = apiData[0].PostOffice.map(formatPostOffice);
        if (results.length > 0) {
          pincodeCache.set(cacheKey, results);
          return results;
        }
      }
    }
  } catch (err) {
    console.warn(`[Pincode API] Lookup error for ${pin}:`, err.message);
  }

  // Fallback to local dictionary
  if (PINCODE_LOCAL_FALLBACKS[pin]) {
    const fallbackList = PINCODE_LOCAL_FALLBACKS[pin].map(formatPostOffice);
    pincodeCache.set(cacheKey, fallbackList);
    return fallbackList;
  }

  // Check popular hubs
  const hub = PAN_INDIA_POPULAR_HUBS.find((h) => h.pincode === pin);
  if (hub) {
    const hubAddress = [formatPostOffice({
      name: hub.name,
      district: hub.district,
      state: hub.state,
      pincode: hub.pincode,
      block: hub.district
    })];
    pincodeCache.set(cacheKey, hubAddress);
    return hubAddress;
  }

  return [];
}

/**
 * GET /api/pincode/popular
 * Returns curated Pan-India hubs with PINCODEs
 */
router.get('/popular', (req, res) => {
  res.json({
    success: true,
    data: PAN_INDIA_POPULAR_HUBS
  });
});

/**
 * GET /api/pincode/details/:pincode
 * Returns ALL addresses/localities in the specified 6-digit PINCODE plus geographic coordinates
 */
router.get('/details/:pincode', async (req, res) => {
  const pin = (req.params.pincode || '').trim();

  if (!/^\d{6}$/.test(pin)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid 6-digit PINCODE'
    });
  }

  try {
    const addresses = await fetchAllAddressesForPincode(pin);
    const coordinates = await getCoordinatesForPincode(pin, addresses);

    res.json({
      success: true,
      pincode: pin,
      count: addresses.length,
      coordinates,
      locality: addresses[0]?.name || addresses[0]?.locality || 'Local Area',
      district: addresses[0]?.district || '',
      state: addresses[0]?.state || '',
      data: addresses
    });
  } catch (err) {
    console.error(`Pincode details error for ${pin}:`, err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve addresses for pincode'
    });
  }
});

/**
 * GET /api/pincode/geo/:pincode
 * Returns geographic coordinates, bounding box & postal circle info for map rendering
 */
router.get('/geo/:pincode', async (req, res) => {
  const pin = (req.params.pincode || '').trim();

  if (!/^\d{6}$/.test(pin)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid 6-digit PINCODE'
    });
  }

  try {
    const addresses = await fetchAllAddressesForPincode(pin);
    const coordinates = await getCoordinatesForPincode(pin, addresses);

    const lat = coordinates.lat;
    const lng = coordinates.lng;
    const deltaLat = 0.04;
    const deltaLng = 0.05;

    res.json({
      success: true,
      pincode: pin,
      coordinates: { lat, lng },
      bbox: {
        minLng: (lng - deltaLng).toFixed(4),
        minLat: (lat - deltaLat).toFixed(4),
        maxLng: (lng + deltaLng).toFixed(4),
        maxLat: (lat + deltaLat).toFixed(4)
      },
      osmEmbedUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${(lng - deltaLng).toFixed(4)}%2C${(lat - deltaLat).toFixed(4)}%2C${(lng + deltaLng).toFixed(4)}%2C${(lat + deltaLat).toFixed(4)}&layer=mapnik&marker=${lat}%2C${lng}`,
      locality: addresses[0]?.name || addresses[0]?.locality || 'Local Area',
      district: addresses[0]?.district || '',
      state: addresses[0]?.state || '',
      localities: addresses.slice(0, 10),
      count: addresses.length
    });
  } catch (err) {
    console.error(`Pincode geo error for ${pin}:`, err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve geo coordinates'
    });
  }
});

/**
 * GET /api/pincode/search/:query
 * Universal search by PINCODE or locality name using Postal API
 */
router.get('/search/:query', async (req, res) => {
  const query = (req.params.query || '').trim();

  if (!query || query.length < 2) {
    return res.json({ success: true, data: PAN_INDIA_POPULAR_HUBS });
  }

  const cacheKey = `search_${query.toLowerCase()}`;
  if (pincodeCache.has(cacheKey)) {
    return res.json({ success: true, data: pincodeCache.get(cacheKey), cached: true });
  }

  try {
    const isPincode = /^\d{3,6}$/.test(query);

    if (isPincode) {
      // If exact 6 digits, load all addresses for this PINCODE
      if (query.length === 6) {
        const addresses = await fetchAllAddressesForPincode(query);
        if (addresses.length > 0) {
          pincodeCache.set(cacheKey, addresses);
          return res.json({ success: true, query, count: addresses.length, data: addresses });
        }
      }

      // Partial 3-5 digits or fallback
      let results = [];
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const apiRes = await fetch(`https://api.postalpincode.in/pincode/${query}`, { signal: controller.signal });
        clearTimeout(timeout);

        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (Array.isArray(apiData) && apiData[0]?.Status === 'Success' && Array.isArray(apiData[0]?.PostOffice)) {
            results = apiData[0].PostOffice.map(formatPostOffice);
          }
        }
      } catch (e) {
        console.warn('Pincode prefix search timed out, checking hubs...');
      }

      if (results.length === 0) {
        const q = query.toLowerCase();
        results = PAN_INDIA_POPULAR_HUBS.filter((h) => h.pincode.startsWith(q)).map(formatPostOffice);
      }

      pincodeCache.set(cacheKey, results);
      return res.json({ success: true, query, count: results.length, data: results });
    }

    // Place / Locality name search
    let results = [];
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const targetUrl = `https://api.postalpincode.in/postoffice/${encodeURIComponent(query)}`;
      const apiRes = await fetch(targetUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (Array.isArray(apiData) && apiData[0]?.Status === 'Success' && Array.isArray(apiData[0]?.PostOffice)) {
          results = apiData[0].PostOffice.map(formatPostOffice);
        }
      }
    } catch (e) {
      console.warn('Postoffice place search timed out, checking hubs...');
    }

    if (results.length === 0) {
      const q = query.toLowerCase();
      results = PAN_INDIA_POPULAR_HUBS.filter(
        (h) => h.name.toLowerCase().includes(q) || h.district.toLowerCase().includes(q) || h.state.toLowerCase().includes(q)
      ).map(formatPostOffice);
    }

    // Cap cache at 600 items
    if (pincodeCache.size > 600) {
      const firstKey = pincodeCache.keys().next().value;
      pincodeCache.delete(firstKey);
    }
    pincodeCache.set(cacheKey, results);

    res.json({
      success: true,
      query,
      count: results.length,
      data: results
    });
  } catch (err) {
    console.error(`Pincode search error for "${query}":`, err.message);

    const q = query.toLowerCase();
    const fallbackResults = PAN_INDIA_POPULAR_HUBS.filter(
      (h) => h.pincode.startsWith(q) || h.name.toLowerCase().includes(q) || h.district.toLowerCase().includes(q)
    ).map(formatPostOffice);

    res.json({
      success: true,
      query,
      data: fallbackResults.length > 0 ? fallbackResults : PAN_INDIA_POPULAR_HUBS.slice(0, 6).map(formatPostOffice),
      fallback: true
    });
  }
});

/**
 * Haversine distance in km between two lat/lng pairs
 */
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * GET /api/pincode/reverse
 * Reverse-geocodes GPS coordinates (lat, lng) to 6-digit Indian PINCODE & official postal addresses
 */
router.get('/reverse', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({
      success: false,
      error: 'Valid numeric lat and lng query parameters required'
    });
  }

  // 1. Check if GPS is within 7 km of any pre-seeded hub
  let closestHub = null;
  let minDistance = Infinity;

  for (const hub of PAN_INDIA_POPULAR_HUBS) {
    if (hub.lat && hub.lng) {
      const dist = getDistanceFromLatLonInKm(lat, lng, hub.lat, hub.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestHub = hub;
      }
    }
  }

  if (closestHub && minDistance <= 7.0) {
    const addresses = await fetchAllAddressesForPincode(closestHub.pincode);
    return res.json({
      success: true,
      source: 'hub_proximity',
      distanceKm: minDistance.toFixed(2),
      pincode: closestHub.pincode,
      locality: closestHub.locality || closestHub.name,
      district: closestHub.district,
      state: closestHub.state,
      label: `${closestHub.locality || closestHub.name} (${closestHub.pincode})`,
      coordinates: { lat, lng },
      addresses: addresses.slice(0, 10),
      count: addresses.length
    });
  }

  // 2. Call Nominatim Reverse Geocoding with 3.5s timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
      headers: { 'User-Agent': 'HireLocal-GPS-Reverse/1.0' },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (nomRes.ok) {
      const nomData = await nomRes.json();
      const addr = nomData?.address || {};

      let pin = (addr.postcode || '').replace(/\D/g, '').slice(0, 6);
      const locality = addr.suburb || addr.residential || addr.neighbourhood || addr.city_district || addr.town || addr.city || addr.village || 'My Location';
      const district = addr.state_district || addr.county || addr.city || '';
      const state = addr.state || '';

      if (pin && pin.length === 6) {
        const addresses = await fetchAllAddressesForPincode(pin);
        return res.json({
          success: true,
          source: 'nominatim_gps',
          pincode: pin,
          locality,
          district,
          state,
          label: `${locality} (${pin})`,
          coordinates: { lat, lng },
          addresses: addresses.slice(0, 10),
          count: addresses.length
        });
      }
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode error:', err.message);
  }

  // 3. Fallback to closest hub in India
  const fallback = closestHub || PAN_INDIA_POPULAR_HUBS[0];
  const addresses = await fetchAllAddressesForPincode(fallback.pincode);
  res.json({
    success: true,
    source: 'nearest_hub_fallback',
    pincode: fallback.pincode,
    locality: fallback.locality || fallback.name,
    district: fallback.district,
    state: fallback.state,
    label: `${fallback.locality || fallback.name} (${fallback.pincode})`,
    coordinates: { lat, lng },
    addresses: addresses.slice(0, 10),
    count: addresses.length
  });
});

export default router;

