import express from 'express';

const router = express.Router();
const pincodeCache = new Map();

// Top Pan-India Hubs for instant fallback & quick picker
const PAN_INDIA_POPULAR_HUBS = [
  { name: 'MP Nagar', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462011', label: 'MP Nagar, Bhopal (462011)' },
  { name: 'Arera Colony', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462016', label: 'Arera Colony, Bhopal (462016)' },
  { name: 'Kolar Road', district: 'Bhopal', state: 'Madhya Pradesh', pincode: '462042', label: 'Kolar Road, Bhopal (462042)' },
  { name: 'Connaught Place', district: 'Central Delhi', state: 'Delhi', pincode: '110001', label: 'Connaught Place, Delhi (110001)' },
  { name: 'Andheri West', district: 'Mumbai', state: 'Maharashtra', pincode: '400058', label: 'Andheri West, Mumbai (400058)' },
  { name: 'Koramangala', district: 'Bengaluru', state: 'Karnataka', pincode: '560034', label: 'Koramangala, Bengaluru (560034)' },
  { name: 'Vijay Nagar', district: 'Indore', state: 'Madhya Pradesh', pincode: '452010', label: 'Vijay Nagar, Indore (452010)' },
  { name: 'Gachibowli', district: 'Hyderabad', state: 'Telangana', pincode: '500032', label: 'Gachibowli, Hyderabad (500032)' },
  { name: 'Hazratganj', district: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001', label: 'Hazratganj, Lucknow (226001)' },
  { name: 'Malviya Nagar', district: 'Jaipur', state: 'Rajasthan', pincode: '302017', label: 'Malviya Nagar, Jaipur (302017)' },
  { name: 'Kothrud', district: 'Pune', state: 'Maharashtra', pincode: '411038', label: 'Kothrud, Pune (411038)' },
  { name: 'Park Street', district: 'Kolkata', state: 'West Bengal', pincode: '700016', label: 'Park Street, Kolkata (700016)' },
  { name: 'Navrangpura', district: 'Ahmedabad', state: 'Gujarat', pincode: '380009', label: 'Navrangpura, Ahmedabad (380009)' },
  { name: 'Boring Road', district: 'Patna', state: 'Bihar', pincode: '800001', label: 'Boring Road, Patna (800001)' }
];

/**
 * GET /api/pincode/popular
 * Returns curated Pan-India hubs
 */
router.get('/popular', (req, res) => {
  res.json({
    success: true,
    data: PAN_INDIA_POPULAR_HUBS
  });
});

/**
 * GET /api/pincode/search/:query
 * Searches all of India using official Indian Postal PINcode API
 */
router.get('/search/:query', async (req, res) => {
  const query = (req.params.query || '').trim();

  if (!query || query.length < 2) {
    return res.json({ success: true, data: PAN_INDIA_POPULAR_HUBS });
  }

  // Check cache
  const cacheKey = query.toLowerCase();
  if (pincodeCache.has(cacheKey)) {
    return res.json({ success: true, data: pincodeCache.get(cacheKey), cached: true });
  }

  try {
    const isPincode = /^\d{3,6}$/.test(query);
    let targetUrl;

    if (isPincode) {
      targetUrl = `https://api.postalpincode.in/pincode/${query}`;
    } else {
      targetUrl = `https://api.postalpincode.in/postoffice/${encodeURIComponent(query)}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const apiRes = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!apiRes.ok) {
      throw new Error(`Postal API returned ${apiRes.status}`);
    }

    const apiData = await apiRes.json();
    let results = [];

    if (Array.isArray(apiData) && apiData[0]?.Status === 'Success' && Array.isArray(apiData[0]?.PostOffice)) {
      results = apiData[0].PostOffice.slice(0, 15).map((po) => ({
        name: po.Name,
        district: po.District,
        state: po.State,
        pincode: po.Pincode,
        label: `${po.Name}, ${po.District} (${po.Pincode})`
      }));
    }

    // If external API returned 0 results, check local Pan-India hubs
    if (results.length === 0) {
      const q = query.toLowerCase();
      results = PAN_INDIA_POPULAR_HUBS.filter(
        (h) => h.pincode.startsWith(q) || h.name.toLowerCase().includes(q) || h.district.toLowerCase().includes(q)
      );
    }

    // Save to cache (cap cache at 500 items)
    if (pincodeCache.size > 500) {
      const firstKey = pincodeCache.keys().next().value;
      pincodeCache.delete(firstKey);
    }
    pincodeCache.set(cacheKey, results);

    res.json({
      success: true,
      query,
      data: results
    });
  } catch (err) {
    console.error(`Pincode lookup error for "${query}":`, err.message);

    // Fallback to local filtering on network/timeout error
    const q = query.toLowerCase();
    const fallbackResults = PAN_INDIA_POPULAR_HUBS.filter(
      (h) => h.pincode.startsWith(q) || h.name.toLowerCase().includes(q) || h.district.toLowerCase().includes(q)
    );

    res.json({
      success: true,
      query,
      data: fallbackResults.length > 0 ? fallbackResults : PAN_INDIA_POPULAR_HUBS.slice(0, 6),
      fallback: true
    });
  }
});

export default router;
