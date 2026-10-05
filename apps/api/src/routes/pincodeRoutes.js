import express from 'express';

const router = express.Router();
const pincodeCache = new Map();

// Top Pan-India Hubs with verified postal pincodes & localities
const PAN_INDIA_POPULAR_HUBS = [
  { name: 'MP Nagar', locality: 'MP Nagar', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462011', label: 'MP Nagar, Bhopal (462011)', workersCount: 4 },
  { name: 'Arera Colony', locality: 'Arera Colony', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462016', label: 'Arera Colony, Bhopal (462016)', workersCount: 3 },
  { name: 'Indrapuri / BHEL', locality: 'Govindpura', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462023', label: 'Govindpura / BHEL, Bhopal (462023)', workersCount: 4 },
  { name: 'Kolar Road', locality: 'Kolar Road', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462042', label: 'Kolar Road, Bhopal (462042)', workersCount: 3 },
  { name: 'New Market', locality: 'New Market', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462003', label: 'New Market, Bhopal (462003)', workersCount: 3 },
  { name: 'Shahpura', locality: 'Shahpura', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462039', label: 'Shahpura, Bhopal (462039)', workersCount: 2 },
  { name: 'Connaught Place', locality: 'Connaught Place', district: 'Central Delhi', state: 'Delhi', pincode: '110001', label: 'Connaught Place, Delhi (110001)', workersCount: 5 },
  { name: 'Andheri West', locality: 'Andheri West', district: 'Mumbai', state: 'Maharashtra', pincode: '400058', label: 'Andheri West, Mumbai (400058)', workersCount: 5 },
  { name: 'Koramangala', locality: 'Koramangala', district: 'Bengaluru', state: 'Karnataka', pincode: '560034', label: 'Koramangala, Bengaluru (560034)', workersCount: 4 },
  { name: 'Vijay Nagar', locality: 'Vijay Nagar', district: 'Indore', state: 'Madhya Pradesh', pincode: '452010', label: 'Vijay Nagar, Indore (452010)', workersCount: 3 },
  { name: 'Gachibowli', locality: 'Gachibowli', district: 'Hyderabad', state: 'Telangana', pincode: '500032', label: 'Gachibowli, Hyderabad (500032)', workersCount: 4 },
  { name: 'Hazratganj', locality: 'Hazratganj', district: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001', label: 'Hazratganj, Lucknow (226001)', workersCount: 3 },
  { name: 'Malviya Nagar', locality: 'Malviya Nagar', district: 'Jaipur', state: 'Rajasthan', pincode: '302017', label: 'Malviya Nagar, Jaipur (302017)', workersCount: 3 },
  { name: 'Kothrud', locality: 'Kothrud', district: 'Pune', state: 'Maharashtra', pincode: '411038', label: 'Kothrud, Pune (411038)', workersCount: 3 },
  { name: 'Park Street', locality: 'Park Street', district: 'Kolkata', state: 'West Bengal', pincode: '700016', label: 'Park Street, Kolkata (700016)', workersCount: 3 },
  { name: 'Navrangpura', locality: 'Navrangpura', district: 'Ahmedabad', state: 'Gujarat', pincode: '380009', label: 'Navrangpura, Ahmedabad (380009)', workersCount: 3 },
  { name: 'Boring Road', locality: 'Boring Road', district: 'Patna', state: 'Bihar', pincode: '800001', label: 'Boring Road, Patna (800001)', workersCount: 3 }
];

// Rich fallback addresses for key hubs if Postal API is temporarily slow or rate limited
const PINCODE_LOCAL_FALLBACKS = {
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
 * Returns ALL addresses/localities in the specified 6-digit PINCODE
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

    res.json({
      success: true,
      pincode: pin,
      count: addresses.length,
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

export default router;

