/**
 * Shared Application Constants for HireLocal
 */

export const RELIABILITY_MIN_JOBS_THRESHOLD = 3;

export const SUPPORTED_LANGUAGES = Object.freeze([
  { code: 'hi', name: 'हिन्दी (Hindi)', voiceCode: 'hi-IN' },
  { code: 'en', name: 'English', voiceCode: 'en-IN' },
  { code: 'mr', name: 'मराठी (Marathi)', voiceCode: 'mr-IN' },
  { code: 'te', name: 'తెలుగు (Telugu)', voiceCode: 'te-IN' },
  { code: 'bn', name: 'বাংলা (Bengali)', voiceCode: 'bn-IN' }
]);

export const DEFAULT_MATCHING_WEIGHTS = Object.freeze({
  rating: 0.30,
  reliability: 0.25,
  experience: 0.15,
  availability: 0.15,
  locationProximity: 0.15
});

export const POPULAR_LOCATIONS = Object.freeze([
  { name: 'MP Nagar, Bhopal', city: 'Bhopal', lat: 23.2332, lng: 77.4343 },
  { name: 'Arera Colony, Bhopal', city: 'Bhopal', lat: 23.2156, lng: 77.4330 },
  { name: 'Vijay Nagar, Indore', city: 'Indore', lat: 22.7533, lng: 75.8937 },
  { name: 'Palasia, Indore', city: 'Indore', lat: 22.7244, lng: 75.8839 },
  { name: 'Hazratganj, Lucknow', city: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { name: 'Gomti Nagar, Lucknow', city: 'Lucknow', lat: 26.8500, lng: 80.9995 },
  { name: 'Malviya Nagar, Jaipur', city: 'Jaipur', lat: 26.8549, lng: 75.8243 },
  { name: 'Vaishali Nagar, Jaipur', city: 'Jaipur', lat: 26.9075, lng: 75.7396 },
  { name: 'Boring Road, Patna', city: 'Patna', lat: 25.6174, lng: 85.1228 },
  { name: 'Dharampeth, Nagpur', city: 'Nagpur', lat: 21.1458, lng: 79.0669 }
]);

export const BHOPAL_PINCODES_DATA = Object.freeze([
  { pincode: '462011', locality: 'MP Nagar', area: 'Zone 1 & 2', landmark: 'Chetak Bridge / DB Mall', workersCount: 4, district: 'Bhopal', state: 'Madhya Pradesh' },
  { pincode: '462016', locality: 'Arera Colony', area: 'Gulmohar & E-Sector', landmark: '10 No. Market / Bittan Market', workersCount: 3, district: 'Bhopal', state: 'Madhya Pradesh' },
  { pincode: '462042', locality: 'Kolar Road', area: 'Chuna Bhatti & Sarvdharm', landmark: 'D-Mart / Kolar Tiraha', workersCount: 3, district: 'Bhopal', state: 'Madhya Pradesh' },
  { pincode: '462023', locality: 'Indrapuri & BHEL', area: 'Govindpura & Piplani', landmark: 'BHEL Township / Jubilee Gate', workersCount: 4, district: 'Bhopal', state: 'Madhya Pradesh' },
  { pincode: '462003', locality: 'New Market', area: 'TT Nagar & Malviya Nagar', landmark: 'Roshanpura Square / Apex Bank', workersCount: 3, district: 'Bhopal', state: 'Madhya Pradesh' },
  { pincode: '462039', locality: 'Shahpura', area: 'Trilanga & Bawadiya Kalan', landmark: 'Shahpura Lake / Manisha Market', workersCount: 2, district: 'Bhopal', state: 'Madhya Pradesh' },
  { pincode: '462001', locality: 'Old City / GPO', area: 'Hamidia & Bhopal Junction', landmark: 'Bhopal Railway Station', workersCount: 3, district: 'Bhopal', state: 'Madhya Pradesh' },
  { pincode: '462030', locality: 'Huzur / Bairagarh', area: 'Sant Hirdaram Nagar', landmark: 'Halalpur Bus Stand', workersCount: 2, district: 'Bhopal', state: 'Madhya Pradesh' }
]);

export const PAN_INDIA_POPULAR_PINCODES = Object.freeze([
  { pincode: '824101', locality: 'Aurangabad (BH)', district: 'Aurangabad', state: 'Bihar', label: 'Aurangabad, Bihar (824101)', workersCount: 4 },
  { pincode: '143410', locality: 'Sarhali / Dadeha', district: 'Amritsar', state: 'Punjab', label: 'Amritsar / Tarn Taran (143410)', workersCount: 3 },
  { pincode: '462011', locality: 'MP Nagar', district: 'Bhopal', state: 'Madhya Pradesh', label: 'MP Nagar, Bhopal (462011)', workersCount: 4 },
  { pincode: '462016', locality: 'Arera Colony', district: 'Bhopal', state: 'Madhya Pradesh', label: 'Arera Colony, Bhopal (462016)', workersCount: 3 },
  { pincode: '462023', locality: 'Indrapuri / Govindpura', district: 'Bhopal', state: 'Madhya Pradesh', label: 'Govindpura, Bhopal (462023)', workersCount: 4 },
  { pincode: '110001', locality: 'Connaught Place', district: 'Central Delhi', state: 'Delhi', label: 'Connaught Place, Delhi (110001)', workersCount: 5 },
  { pincode: '400058', locality: 'Andheri West', district: 'Mumbai', state: 'Maharashtra', label: 'Andheri West, Mumbai (400058)', workersCount: 5 },
  { pincode: '560034', locality: 'Koramangala', district: 'Bengaluru', state: 'Karnataka', label: 'Koramangala, Bengaluru (560034)', workersCount: 4 },
  { pincode: '452010', locality: 'Vijay Nagar', district: 'Indore', state: 'Madhya Pradesh', label: 'Vijay Nagar, Indore (452010)', workersCount: 3 },
  { pincode: '500032', locality: 'Gachibowli', district: 'Hyderabad', state: 'Telangana', label: 'Gachibowli, Hyderabad (500032)', workersCount: 4 },
  { pincode: '226001', locality: 'Hazratganj', district: 'Lucknow', state: 'Uttar Pradesh', label: 'Hazratganj, Lucknow (226001)', workersCount: 3 },
  { pincode: '302017', locality: 'Malviya Nagar', district: 'Jaipur', state: 'Rajasthan', label: 'Malviya Nagar, Jaipur (302017)', workersCount: 3 },
  { pincode: '411038', locality: 'Kothrud', district: 'Pune', state: 'Maharashtra', label: 'Kothrud, Pune (411038)', workersCount: 3 },
  { pincode: '700016', locality: 'Park Street', district: 'Kolkata', state: 'West Bengal', label: 'Park Street, Kolkata (700016)', workersCount: 3 },
  { pincode: '380009', locality: 'Navrangpura', district: 'Ahmedabad', state: 'Gujarat', label: 'Navrangpura, Ahmedabad (380009)', workersCount: 3 },
  { pincode: '800001', locality: 'Boring Road', district: 'Patna', state: 'Bihar', label: 'Boring Road, Patna (800001)', workersCount: 3 }
]);


