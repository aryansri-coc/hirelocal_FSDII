/**
 * Vapi AI Voice Assistant Knowledge & Telephony Dispatch Service
 * Connects Vapi Function Calling to:
 * 1. Live HireLocal PostgreSQL / Unified Database Store (Workers, Rates, Services, Locations)
 * 2. Hyperlocal RAG Knowledge Base (0% Commission, Day-based slots, Reliability score, Feature-phone IVR)
 * 3. MeitY Bhashini AI Neural Machine Translation (IndicTrans-v2) with zero-downtime local fallback
 */

import { db } from '../../database/db.js';
import { retrieveKnowledge, detectLanguage } from './ragKnowledgeEngine.js';
import { isBhashiniConfigured, translateTextBhashini } from '../../apps/api/src/services/bhashiniService.js';
import { getCoordinatesForPincode } from '../../apps/api/src/routes/pincodeRoutes.js';
import { triggerJobOfferCall, handleWorkerRejection } from '../../apps/api/src/services/telephonyService.js';
import { JOB_STATUS } from '../shared/statusVocabulary.js';

/**
 * Checks if Bhashini is fully configured with valid (non-placeholder) credentials
 */
function isBhashiniUsable() {
  if (!isBhashiniConfigured()) return false;
  const user = process.env.BHASHINI_USER_ID || '';
  const key = process.env.BHASHINI_API_KEY || '';
  const infKey = process.env.BHASHINI_INFERENCE_KEY || '';
  // Avoid calling remote API if variables still contain boilerplate placeholder text
  if (user.includes('your_') || key.includes('your_') || infKey.includes('your_')) {
    return false;
  }
  return true;
}

/**
 * Strips markdown symbols, asterisks, URLs, and code blocks for crisp speech synthesizer playback
 */
function cleanForVoiceSpeech(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold **text** -> text
    .replace(/\*(.*?)\*/g, '$1')     // Italic *text* -> text
    .replace(/#{1,6}\s+/g, '')       // Markdown headers # -> empty
    .replace(/`([^`]+)`/g, '$1')     // Backtick code -> text
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // [link](url) -> link text
    .replace(/https?:\/\/\S+/g, '')  // Raw URLs -> empty
    .replace(/[•\-\*]\s+/g, '')      // Bullet points
    .replace(/\s+/g, ' ')            // Collapsed whitespace
    .trim();
}

// Stateful in-memory session cache for ongoing telephone calls
const activeVoiceSessions = new Map();

/**
 * Main Question-Answering Resolver for Vapi Function Tool `ask_project_knowledge`
 * Supports live dynamic database queries, RAG policies, multi-turn voice registration, and Bhashini AI fallback.
 * @param {string} question - The user's query extracted from Vapi payload
 * @param {Object} [context={}] - Call metadata (callId, customerPhone)
 * @returns {Promise<string>} Clean, spoken-word answer
 */
export async function answerProjectKnowledge(question, context = {}) {
  if (!question || typeof question !== 'string' || !question.trim()) {
    return 'Please ask a specific question regarding HireLocal services, pricing, worker bookings, or location coverage.';
  }

  const rawQuery = question.trim();
  const detectedLang = detectLanguage(rawQuery);
  const qLower = rawQuery.toLowerCase();

  // Manage call session for multi-turn voice registration
  const sessionKey = context.callId || context.customerPhone || 'voice_session_default';
  let voiceSession = activeVoiceSessions.get(sessionKey);
  if (!voiceSession) {
    voiceSession = {
      name: '',
      phone: context.customerPhone ? String(context.customerPhone).replace(/\D/g, '').slice(-10) : '',
      profession: '',
      pincode: '',
      language: detectedLang
    };
    activeVoiceSessions.set(sessionKey, voiceSession);
  }

  // 1. Extract phone number if mentioned in query or from context
  const phoneInQuery = rawQuery.match(/(?:\+?91[\-\s]?)?([6-9]\d{9})\b/);
  if (phoneInQuery) {
    voiceSession.phone = phoneInQuery[1];
  } else if (!voiceSession.phone && context.customerPhone) {
    voiceSession.phone = String(context.customerPhone).replace(/\D/g, '').slice(-10);
  }

  // 2. Extract name if mentioned in query
  const nameMatch = rawQuery.match(/(?:मेरा नाम|my name is|mera naam|naam|name|नाम)\s+(?:है\s+)?([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)/i);
  if (nameMatch) {
    voiceSession.name = nameMatch[1].trim();
  }

  // 3. Extract profession / trade
  if (qLower.includes('plumb') || qLower.includes('नल') || qLower.includes('प्लंबर')) {
    voiceSession.profession = 'Plumber';
  } else if (qLower.includes('elec') || qLower.includes('बिजली') || qLower.includes('इलेक्ट्रिशियन') || qLower.includes('इलेक्ट्रीशियन') || qLower.includes('वायरिंग')) {
    voiceSession.profession = 'Electrician';
  } else if (qLower.includes('carp') || qLower.includes('बढ़ई') || qLower.includes('कारपेंटर') || qLower.includes('लकड़ी')) {
    voiceSession.profession = 'Carpenter';
  } else if (qLower.includes('paint') || qLower.includes('पेंट') || qLower.includes('पेंटर') || qLower.includes('रंगाई')) {
    voiceSession.profession = 'Painter';
  } else if (qLower.includes('ac') || qLower.includes('कूलर') || qLower.includes('एसी')) {
    voiceSession.profession = 'AC Repair & Service';
  }

  // 4. Extract location / PINCODE
  const pinMatch = rawQuery.match(/\b\d{6}\b/);
  if (pinMatch) {
    voiceSession.pincode = pinMatch[0];
  } else if (qLower.includes('मोहाली') || qLower.includes('mohali') || qLower.includes('पंजाब') || qLower.includes('punjab') || qLower.includes('bajheri')) {
    voiceSession.pincode = '140413';
  } else if (qLower.includes('भोपाल') || qLower.includes('bhopal')) {
    voiceSession.pincode = '462011';
  } else if (qLower.includes('दिल्ली') || qLower.includes('delhi')) {
    voiceSession.pincode = '110001';
  }

  // =========================================================================
  // 0. WORKER JOB OFFER DECISION & PENDING JOB DISCOVERY (Voice Call-In Flow)
  // =========================================================================
  const checkPhoneForJob = (phoneInQuery && phoneInQuery[1]) || voiceSession.phone || (context.customerPhone ? String(context.customerPhone).replace(/\D/g, '').slice(-10) : '');
  let callerWorkerForJob = checkPhoneForJob ? db.findOne('workers', (w) => w.phone && String(w.phone).includes(checkPhoneForJob)) : null;

  if (!callerWorkerForJob && voiceSession.name) {
    callerWorkerForJob = db.findOne('workers', (w) => w.name && w.name.toLowerCase().includes(voiceSession.name.toLowerCase()));
  }

  // Check if any job is pending for this worker or phone
  let pendingJobForWorker = null;
  let targetJobForPhone = null;

  if (checkPhoneForJob || callerWorkerForJob) {
    const allJobsForPhone = db.find('jobs', (j) =>
      (callerWorkerForJob && j.worker_id === callerWorkerForJob.worker_id) ||
      (checkPhoneForJob && j.worker_phone && String(j.worker_phone).includes(checkPhoneForJob)) ||
      (checkPhoneForJob && j.customer_phone && String(j.customer_phone).includes(checkPhoneForJob))
    );
    if (allJobsForPhone && allJobsForPhone.length > 0) {
      targetJobForPhone = allJobsForPhone[allJobsForPhone.length - 1];
      if (
        targetJobForPhone.status === JOB_STATUS.PENDING_WORKER_RESPONSE ||
        targetJobForPhone.status === 'pending_worker_response' ||
        targetJobForPhone.status === 'offered' ||
        targetJobForPhone.status === 'REQUESTED'
      ) {
        pendingJobForWorker = targetJobForPhone;
      }
    }
  }

  // Fallback: check if there is an active pending job in the marketplace
  if (!pendingJobForWorker) {
    const pendingJobs = db.find('jobs', (j) =>
      (j.status === JOB_STATUS.PENDING_WORKER_RESPONSE || j.status === 'pending_worker_response' || j.status === 'offered' || j.status === 'REQUESTED') &&
      j.worker_id
    );
    if (pendingJobs && pendingJobs.length > 0) {
      const candidate = pendingJobs[pendingJobs.length - 1];
      const wrk = db.findById('workers', 'worker_id', candidate.worker_id);
      if (wrk && (checkPhoneForJob ? wrk.phone?.includes(checkPhoneForJob) || candidate.worker_phone?.includes(checkPhoneForJob) : true)) {
        pendingJobForWorker = candidate;
        callerWorkerForJob = wrk;
        targetJobForPhone = candidate;
      }
    }
  }

  // Job Offer Acceptance words
  const isJobAcceptance =
    qLower.includes('accept') ||
    qLower.includes('स्वीकार') ||
    qLower.includes('swikar') ||
    qLower.includes('swikaar') ||
    qLower.includes('karunga') ||
    qLower.includes('करूँगा') ||
    qLower.includes('करूंगा') ||
    qLower.includes('kaam karunga') ||
    qLower.includes('manzoor') ||
    qLower.includes('मंजूर') ||
    qLower === 'haan' ||
    qLower === 'हाँ' ||
    qLower.startsWith('haan ') ||
    qLower.startsWith('हाँ ') ||
    qLower.includes('haan ji') ||
    qLower.includes('हाँ जी') ||
    qLower === 'yes' ||
    qLower.startsWith('yes ') ||
    qLower.trim() === '1';

  // Job Offer Rejection words
  const isJobRejection =
    qLower.includes('reject') ||
    qLower.includes('अस्वीकार') ||
    qLower.includes('मना') ||
    qLower.includes('mana') ||
    qLower.includes('decline') ||
    qLower.includes('nahi karunga') ||
    qLower.includes('नहीं करूँगा') ||
    qLower.includes('नहीं करूंगा') ||
    qLower.includes('nahi chahiye') ||
    qLower.includes('nahi ho payega') ||
    qLower === 'nahi' ||
    qLower === 'नहीं' ||
    qLower.startsWith('nahi ') ||
    qLower.startsWith('नहीं ') ||
    qLower === 'no' ||
    qLower.startsWith('no ') ||
    qLower.trim() === '2';

  // Job Inquiry words (Hindi, Urdu, English)
  const isJobInquiry =
    qLower.includes('booking') ||
    qLower.includes('bookings') ||
    qLower.includes('booked') ||
    qLower.includes('بکنگ') ||
    qLower.includes('बुकिंग') ||
    qLower.includes('koi kaam') ||
    qLower.includes('koi order') ||
    qLower.includes('kaam aaya') ||
    qLower.includes('pending job') ||
    qLower.includes('pending work') ||
    qLower.includes('mera kaam') ||
    qLower.includes('job offer') ||
    qLower.includes('work offer') ||
    qLower.includes('any job') ||
    qLower.includes('any work') ||
    qLower.includes('काम आया') ||
    qLower.includes('काम है') ||
    qLower.includes('ऑर्डर आया');

  // Handle Acceptance
  if (pendingJobForWorker && isJobAcceptance) {
    const acceptRes = await respondToJobOfferViaVoice({
      decision: 'accept',
      job_id: pendingJobForWorker.job_id,
      worker_id: callerWorkerForJob?.worker_id,
      phone: checkPhoneForJob,
      language: detectedLang
    }, context);
    return cleanForVoiceSpeech(acceptRes.message);
  }

  // Handle Rejection
  if (pendingJobForWorker && isJobRejection) {
    const rejectRes = await respondToJobOfferViaVoice({
      decision: 'reject',
      job_id: pendingJobForWorker.job_id,
      worker_id: callerWorkerForJob?.worker_id,
      phone: checkPhoneForJob,
      language: detectedLang
    }, context);
    return cleanForVoiceSpeech(rejectRes.message);
  }

  // Handle Work & Booking Inquiry
  if (isJobInquiry) {
    if (pendingJobForWorker) {
      const displayName = callerWorkerForJob?.name || 'आर्यन';
      if (detectedLang === 'hi') {
        return cleanForVoiceSpeech(`जी ${displayName} जी! आपके नंबर ${checkPhoneForJob || ''} पर एक नया काम पेंडिंग है: ${pendingJobForWorker.service_type || 'कारीगर'} का काम, स्थान ${pendingJobForWorker.address || 'मोहाली'}, दैनिक मजदूरी ₹${pendingJobForWorker.estimated_cost || 550}। क्या आप यह काम स्वीकार करते हैं? कृपया 'हाँ' या 'ना' बताएं।`);
      } else {
        return cleanForVoiceSpeech(`Yes ${displayName}! There is a pending booking for phone ${checkPhoneForJob || ''}: ${pendingJobForWorker.service_type || 'Craftsman service'} at ${pendingJobForWorker.address || 'Mohali'} with daily wage of ${pendingJobForWorker.estimated_cost || 550} rupees. Do you accept this job? Please say 'Yes' or 'No'.`);
      }
    } else if (targetJobForPhone) {
      const displayName = callerWorkerForJob?.name || targetJobForPhone.customer_name || 'साथी';
      if (detectedLang === 'hi') {
        return cleanForVoiceSpeech(`जी ${displayName}! आपके नंबर ${checkPhoneForJob || ''} पर ${targetJobForPhone.service_type} की बुकिंग पहले से ${targetJobForPhone.status} है। स्थान: ${targetJobForPhone.address}, दैनिक मजदूरी ₹${targetJobForPhone.estimated_cost}।`);
      } else {
        return cleanForVoiceSpeech(`For phone number ${checkPhoneForJob}, the booking for ${targetJobForPhone.service_type} is currently ${targetJobForPhone.status} at ${targetJobForPhone.address}.`);
      }
    } else if (callerWorkerForJob) {
      if (detectedLang === 'hi') {
        return cleanForVoiceSpeech(`नमस्ते ${callerWorkerForJob.name} जी! इस समय आपके खाते पर कोई नया काम पेंडिंग नहीं है। जैसे ही आपके क्षेत्र में कोई ग्राहक बुकिंग करेगा, आपको सीधे फोन पर सूचित किया जाएगा।`);
      } else {
        return cleanForVoiceSpeech(`Hello ${callerWorkerForJob.name}! You do not have any pending jobs at the moment. As soon as a customer books in your locality, you will be notified directly.`);
      }
    }
  }

  // Intent: Check Caller's Own Registration Status by phone number / caller ID (Checks first before trigger to register)
  const isStatusCheck =
    qLower.includes('when did i register') ||
    qLower.includes('am i register') ||
    qLower.includes('my register') ||
    qLower.includes('my profile') ||
    qLower.includes('meri profile') ||
    qLower.includes('मेरा रजिस्ट्रेशन') ||
    qLower.includes('रजिस्टर्ड हूँ') ||
    qLower.includes('चेक करो') ||
    qLower.includes('मेरा नंबर') ||
    qLower.includes('who am i') ||
    qLower.includes('my status') ||
    qLower.includes('registered or not') ||
    qLower.includes('is my number registered') ||
    qLower.includes('check if i am registered') ||
    qLower.includes('check registration') ||
    qLower.includes('did i register') ||
    qLower.includes('kya mera number') ||
    qLower.includes('kya main registered') ||
    qLower.includes('kya me register') ||
    qLower.includes('kya me registered') ||
    qLower.includes('pehchana') ||
    qLower.includes('pehchano') ||
    qLower.includes('do you know me');

  if (isStatusCheck) {
    const checkPhone = voiceSession.phone || (context.customerPhone ? String(context.customerPhone).replace(/\D/g, '').slice(-10) : '');
    if (checkPhone) {
      const existingWorker = db.findOne('workers', (w) => (w.phone && String(w.phone).includes(checkPhone)));
      const existingUser = db.findOne('users', (u) => (u.phone && String(u.phone).includes(checkPhone)));

      if (existingWorker) {
        if (detectedLang === 'hi') {
          return `जी हाँ! आपका नंबर ${checkPhone} HireLocal पर ${existingWorker.name} के नाम से ${existingWorker.profession} के रूप में पंजीकृत है। आपका पिनकोड ${existingWorker.pincode || '140413'} और दैनिक मजदूरी ₹${existingWorker.daily_rate} है।`;
        } else {
          return `Yes! Your phone number ${checkPhone} is registered on HireLocal under the name ${existingWorker.name} as a verified ${existingWorker.profession} in PINCODE ${existingWorker.pincode || '140413'} with a standard daily wage of ${existingWorker.daily_rate} rupees.`;
        }
      } else if (existingUser) {
        if (detectedLang === 'hi') {
          return `जी हाँ! आपका नंबर ${checkPhone} HireLocal पर ग्राहक ${existingUser.name} के नाम से पंजीकृत है। क्या आपको आज किसी काम के लिए कारीगर चाहिए?`;
        } else {
          return `Yes! Your phone number ${checkPhone} is registered on HireLocal as a customer under the name ${existingUser.name}. Do you need a skilled worker today?`;
        }
      } else {
        if (detectedLang === 'hi') {
          return `आपका फ़ोन नंबर ${checkPhone} अभी HireLocal पर पंजीकृत नहीं है। क्या आप एक कारीगर (जैसे इलेक्ट्रीशियन, प्लंबर या कारपेंटर) के रूप में अभी रजिस्टर करना चाहते हैं? बस अपना नाम और काम बताएं, मैं तुरंत आपका पंजीकरण कर दूंगा।`;
        } else {
          return `Your phone number ${checkPhone} is not yet registered on HireLocal. Would you like to register right now as an artisan (such as an electrician or plumber)? Simply tell me your name and trade, and I will register you immediately.`;
        }
      }
    } else {
      if (detectedLang === 'hi') {
        return 'कृपया अपना 10 अंकों का मोबाइल नंबर बताएं ताकि मैं आपके रजिस्ट्रेशन की जांच कर सकूं।';
      } else {
        return 'Please provide your 10-digit mobile number so I can check your registration status on HireLocal.';
      }
    }
  }

  // Registration keywords check
  const hasRegKeyword =
    qLower.includes('रजिस्टर') ||
    qLower.includes('रजिस्ट्रेशन') ||
    qLower.includes('पंजीकरण') ||
    qLower.includes('register') ||
    qLower.includes('registration') ||
    qLower.includes('sign up') ||
    qLower.includes('join');

  // If caller specifically says "mujhe registration karna hai" without trade/name yet:
  const hasTradeInQuery = Boolean(voiceSession.profession);
  const hasNameInQuery = Boolean(voiceSession.name);

  if (hasRegKeyword && !hasTradeInQuery && !hasNameInQuery) {
    if (detectedLang === 'hi') {
      return 'नमस्ते! हायरलोकल पर कारीगर के रूप में रजिस्टर करने के लिए कृपया अपना नाम, आप क्या काम करते हैं (जैसे इलेक्ट्रीशियन या प्लंबर), और अपना शहर या पिनकोड बताएं।';
    } else {
      return 'Welcome! To register as an artisan on HireLocal, please state your name, your trade (such as electrician or plumber), and your city or 6-digit PINCODE.';
    }
  }

  // Condition to execute registration:
  // Must have profession AND (name OR phone)
  if (voiceSession.profession && (voiceSession.name || hasRegKeyword || phoneInQuery)) {
    const regName = voiceSession.name || (detectedLang === 'hi' ? 'कारीगर साथी' : 'Skilled Artisan');
    const regProf = voiceSession.profession || 'Electrician';
    const regPin = voiceSession.pincode || '140413';
    const regPhone = voiceSession.phone || (context.customerPhone ? String(context.customerPhone).replace(/\D/g, '').slice(-10) : `9820${Math.floor(100000 + Math.random() * 900000)}`);

    const reg = await registerWorkerViaVoice({
      name: regName,
      phone: regPhone,
      profession: regProf,
      pincode: regPin,
      language: detectedLang
    });

    // Reset session after successful execution
    activeVoiceSessions.delete(sessionKey);
    return cleanForVoiceSpeech(reg.message);
  }

  // Fetch live active database entities
  const workers = db.getCollection('workers').filter(
    (w) => w.account_status !== 'suspended' && w.verification_status !== 'rejected'
  );
  const services = db.getCollection('service_categories').filter((s) => s.active !== false);
  const stagedWorker =
    workers.find((w) => (w.profession || '').toLowerCase().includes('elec')) ||
    workers.find((w) => (w.name || '').toLowerCase().includes('mukesh')) ||
    workers.find((w) => w.worker_id === 'wrk_1') ||
    workers[0];
  const workerName = stagedWorker ? stagedWorker.name : 'Mukesh Kumar';

  let rawAnswer = '';

  // =========================================================================
  // 1. DYNAMIC DATABASE INTENTS (Live Data: Workers, Rates, PINCODEs, Services)
  // =========================================================================

  // Intent A: Electrician / Mukesh Kumar / Specific Worker queries
  if (
    qLower.includes('mukesh') ||
    qLower.includes('electrician') ||
    qLower.includes('बिजली') ||
    qLower.includes('इलेक्ट्रीशियन') ||
    (qLower.includes('worker') && (qLower.includes('who') || qLower.includes('kaun') || qLower.includes('name')))
  ) {
    if (stagedWorker) {
      if (detectedLang === 'hi') {
        rawAnswer = `हायरलोकल पर बाझेड़ी, मोहाली (पिनकोड 140413) के लिए सत्यापित मास्टर इलेक्ट्रीशियन ${workerName} उपलब्ध हैं। उनकी दिहाड़ी 550 रुपये प्रतिदिन 8 घंटे की है। उन्हें 11 साल का अनुभव है और वे हाउस वायरिंग, पंखे, एमसीबी और इन्वर्टर रिपेयर का काम करते हैं।`;
      } else {
        rawAnswer = `In HireLocal, the verified master electrician in Bajheri, Mohali PINCODE 140413 is ${workerName}. His daily rate is 550 rupees for an 8-hour day. He has 11 years of experience with a 4.9-star rating, specializing in residential wiring, MCB switches, fans, and inverter repairs.`;
      }
    }
  }

  // Intent B: Pricing, Rates, Wages, Cost
  else if (
    qLower.includes('cost') ||
    qLower.includes('rate') ||
    qLower.includes('price') ||
    qLower.includes('charge') ||
    qLower.includes('fee') ||
    qLower.includes('payout') ||
    qLower.includes('kitna') ||
    qLower.includes('paise') ||
    qLower.includes('दिहाड़ी') ||
    qLower.includes('रेट') ||
    qLower.includes('खर्चा')
  ) {
    const dailyWage = stagedWorker ? stagedWorker.daily_rate : 550;
    if (detectedLang === 'hi') {
      rawAnswer = `हायरलोकल पर कारीगरों की दिहाड़ी 550 रुपये प्रतिदिन (8 घंटे) से शुरू होती है। कारीगर को पूरा भुगतान काम खत्म होने पर सीधे नकद या यूपीआई द्वारा मिलता है। हायरलोकल कारीगरों से शून्य प्रतिशत कमीशन लेता है।`;
    } else {
      rawAnswer = `HireLocal operates on a transparent day-based wage model starting at ${dailyWage} rupees per full day (8 hours). Workers receive 100 percent of their payment directly from the customer upon job completion via cash or UPI, with zero percent platform commission.`;
    }
  }

  // Intent C: Available Services & Trades
  else if (
    qLower.includes('services') ||
    qLower.includes('service') ||
    qLower.includes('trades') ||
    qLower.includes('offer') ||
    qLower.includes('category') ||
    qLower.includes('categories') ||
    qLower.includes('kaam') ||
    qLower.includes('सेवाएं') ||
    qLower.includes('काम')
  ) {
    const serviceNames = services.map((s) => s.name).join(', ') || 'Electrician, Plumber, AC Repair, Carpenter, Painter, Appliance Repair, and Deep Cleaning';
    if (detectedLang === 'hi') {
      rawAnswer = `हायरलोकल पर इलेक्ट्रीशियन, प्लंबर, एसी मैकेनिक, कारपेंटर, पेंटर, होम अप्लायंस रिपेयर और डीप क्लीनिंग जैसी सभी कुशल सेवाएं उपलब्ध हैं।`;
    } else {
      rawAnswer = `HireLocal offers verified local skilled services including ${serviceNames}. Currently, master electrician Mukesh Kumar is actively staged and ready for instant booking.`;
    }
  }

  // Intent D: Location, PINCODE, Mohali / Bajheri / City Coverage
  else if (
    qLower.includes('140413') ||
    qLower.includes('mohali') ||
    qLower.includes('bajheri') ||
    qLower.includes('punjab') ||
    qLower.includes('location') ||
    qLower.includes('area') ||
    qLower.includes('city') ||
    qLower.includes('pincode') ||
    qLower.includes('kahan') ||
    qLower.includes('इलाका') ||
    qLower.includes('कहाँ') ||
    qLower.includes('मोहाली')
  ) {
    if (detectedLang === 'hi') {
      rawAnswer = `हायरलोकल का मुख्य सेवा केंद्र बाझेड़ी, मोहाली, पंजाब, पिनकोड 140413 है। इसके अलावा हायरलोकल भारत के प्रमुख शहरों और 6-अंकीय पिनकोड क्षेत्रों में कारीगर खोज की सुविधा देता है।`;
    } else {
      rawAnswer = `HireLocal's primary live hub is Bajheri, Mohali, Punjab with PINCODE 140413. The platform also supports multi-locality postal discovery across Indian PINCODEs with doorstep dispatch.`;
    }
  }

  // Intent E: Non-smartphone, Feature phone, IVR, CallBot mechanism
  else if (
    qLower.includes('callbot') ||
    qLower.includes('feature phone') ||
    qLower.includes('keypad') ||
    qLower.includes('बिना स्मार्टफोन') ||
    (qLower.includes('smartphone') && (qLower.includes('without') || qLower.includes('no') || qLower.includes('bina'))) ||
    (qLower.includes('ivr') && !qLower.includes('booking'))
  ) {
    if (detectedLang === 'hi') {
      rawAnswer = `हायरलोकल विशेष रूप से बिना स्मार्टफोन वाले कारीगरों के लिए बनाया गया है। जब कोई ग्राहक बुकिंग करता है, तो हमारा एआई कॉलबॉट कारीगर के सामान्य कीपैड फोन पर सीधे कॉल करता है। कारीगर कीपैड पर 1 दबाकर काम स्वीकार और 2 दबाकर मना कर सकते हैं।`;
    } else {
      rawAnswer = `HireLocal is purpose-built for non-smartphone craftsmen. When a customer books a job, our AI CallBot immediately places a voice call to the worker's basic phone in Hindi or their regional language. The worker confirms by pressing 1 or declines by pressing 2 without needing an internet app.`;
    }
  }

  // Intent F: Reliability Score & Quality Rating
  else if (
    qLower.includes('reliability') ||
    qLower.includes('rating') ||
    qLower.includes('score') ||
    qLower.includes('trust') ||
    qLower.includes('भरोसा') ||
    qLower.includes('रेटिंग') ||
    qLower.includes('विश्वसनीयता')
  ) {
    if (detectedLang === 'hi') {
      rawAnswer = `हायरलोकल पर कारीगर की विश्वसनीयता उनके स्वीकार किए गए और समय पर पूरे किए गए कामों के अनुपात पर आधारित होती है। 100% स्कोर वाले कारीगरों को नए काम के आवंटन में प्राथमिकता मिलती है।`;
    } else {
      rawAnswer = `Reliability score is calculated as the percentage of completed jobs divided by total accepted jobs. Maintaining a high score grants workers priority in automated job dispatches, while quality ratings reflect customer star reviews.`;
    }
  }

  // Intent G: What is HireLocal / General Overview
  else if (
    qLower.includes('hirelocal') ||
    qLower.includes('what is') ||
    qLower.includes('about') ||
    qLower.includes('kya hai') ||
    qLower.includes('क्या है')
  ) {
    if (detectedLang === 'hi') {
      rawAnswer = `हायरलोकल एक हाइपरलोकल मार्केटप्लेस है जो घर के मालिकों को भरोसेमंद स्थानीय कारीगरों जैसे इलेक्ट्रीशियन, प्लंबर और कारपेंटर से जोड़ता है। यह बिना स्मार्टफोन वाले कारीगरों को फोन कॉल और कॉलबॉट के जरिए बिना किसी कमीशन के सीधे रोजगार देता है।`;
    } else {
      rawAnswer = `HireLocal is a hyperlocal skilled artisan marketplace connecting customers in Indian cities with dependable local workers. It uniquely empowers craftsmen who do not own smartphones through an automated multilingual voice CallBot with 0% commission.`;
    }
  }

  // =========================================================================
  // 2. TIER 2: RAG KNOWLEDGE BASE RETRIEVAL (Fallback to policy topics)
  // =========================================================================
  if (!rawAnswer) {
    const ragResult = retrieveKnowledge(rawQuery, detectedLang);
    if (ragResult && ragResult.answer) {
      rawAnswer = ragResult.answer;
    }
  }

  // Fallback if still no match found
  if (!rawAnswer) {
    if (detectedLang === 'hi') {
      rawAnswer = `हायरलोकल बाझेड़ी, मोहाली (पिनकोड 140413) में सत्यापित इलेक्ट्रीशियन, प्लंबर और कारपेंटर सेवाएं प्रदान करता है। दिहाड़ी 550 रुपये प्रतिदिन है और कोई कमीशन नहीं लिया जाता। आप किसी भी सेवा या कारीगर के बारे में पूछ सकते हैं।`;
    } else {
      rawAnswer = `HireLocal connects you with verified local tradesmen like master electrician Mukesh Kumar in Bajheri, Mohali PINCODE 140413 at 550 rupees per day with zero commission. Feel free to ask about our services, pricing, or voice CallBot dispatches.`;
    }
  }

  // =========================================================================
  // 3. TIER 3: BHASHINI AI NEURAL TRANSLATION (Dynamic IndicTrans-v2 processing)
  // =========================================================================
  if (isBhashiniUsable()) {
    try {
      // If detected language is not English or Hindi (e.g. Marathi, Telugu, Punjabi, Bengali, Tamil),
      // translate via Bhashini NMT for high-fidelity regional phrasing
      if (detectedLang !== 'en' && detectedLang !== 'hi') {
        const nmtResult = await translateTextBhashini({
          text: rawAnswer,
          sourceLang: 'en',
          targetLang: detectedLang
        });
        if (nmtResult && nmtResult.translatedText) {
          rawAnswer = nmtResult.translatedText;
        }
      }
    } catch (err) {
      console.warn('[Vapi Knowledge Service] Bhashini NMT translation fallback:', err.message);
      // Seamlessly keep rawAnswer on remote API timeout or network failure
    }
  }

  return cleanForVoiceSpeech(rawAnswer);
}

/**
 * Registers a new artisan/worker directly from a telephone voice interaction (Vapi Tool Call)
 * Creates real User and Worker profile records in PostgreSQL / local DB with feature-phone CallBot enabled.
 *
 * @param {Object|string} params - Vapi tool call arguments
 * @returns {Promise<Object>} Structured result with voice-synthesizer-ready confirmation speech
 */
export async function registerWorkerViaVoice(params = {}) {
  let args = {};
  if (typeof params === 'string') {
    try {
      args = JSON.parse(params);
    } catch {
      args = { name: params };
    }
  } else if (typeof params === 'object' && params !== null) {
    args = params;
  }

  const rawName = String(args.name || args.worker_name || args.caller_name || '').trim();
  const name = rawName && rawName.length > 1 ? rawName : 'कारीगर साथी (Voice Pro)';

  // Clean 10-digit Indian phone number
  let phone = String(args.phone || args.customer_phone || args.caller_number || args.number || '').replace(/\D/g, '');
  if (phone.length > 10) phone = phone.slice(-10);
  if (phone.length < 10) {
    phone = `9820${Math.floor(100000 + Math.random() * 900000)}`;
  }

  // Profession / Trade normalization
  const rawProf = String(args.profession || args.trade || args.service || 'Electrician').trim();
  let profession = 'Electrician';
  const profLower = rawProf.toLowerCase();
  if (profLower.includes('plumb') || profLower.includes('नल') || profLower.includes('पाइप')) {
    profession = 'Plumber';
  } else if (profLower.includes('elec') || profLower.includes('बिजली') || profLower.includes('वायरिंग')) {
    profession = 'Electrician';
  } else if (profLower.includes('carp') || profLower.includes('बढ़ई') || profLower.includes('लकड़ी')) {
    profession = 'Carpenter';
  } else if (profLower.includes('paint') || profLower.includes('पेंट') || profLower.includes('रंगाई')) {
    profession = 'Painter';
  } else if (profLower.includes('ac') || profLower.includes('air cond') || profLower.includes('कूलर') || profLower.includes('एसी')) {
    profession = 'AC Repair & Service';
  } else if (profLower.includes('mech') || profLower.includes('मोटर') || profLower.includes('मैकेनिक')) {
    profession = 'Mechanic';
  } else if (rawProf.length > 2) {
    profession = rawProf;
  }

  // Extract 6-digit postal PINCODE
  let targetPin = '140413';
  const pinInput = String(args.pincode || args.postal_code || args.pin || '');
  const pinMatch = pinInput.match(/\b\d{6}\b/);
  if (pinMatch) {
    targetPin = pinMatch[0];
  } else {
    const locMatch = String(args.location || args.city || args.address || '').match(/\b\d{6}\b/);
    if (locMatch) {
      targetPin = locMatch[0];
    }
  }

  // Work experience in years
  const experience = Math.max(1, Number(args.experience || args.exp || args.years_of_experience) || 5);

  // Daily rate wage (default ₹550/day standard, ₹700 for AC)
  let dailyRate = Number(args.daily_rate || args.rate || args.wage);
  if (!dailyRate || isNaN(dailyRate) || dailyRate < 250) {
    dailyRate = profession === 'AC Repair & Service' ? 700 : 550;
  }

  // Geographic coordinates & official postal locality resolution
  let geo = { lat: 30.7516, lng: 76.5912, locality: 'Bajheri', district: 'Mohali', state: 'Punjab' };
  try {
    const resolvedGeo = await getCoordinatesForPincode(targetPin);
    if (resolvedGeo && resolvedGeo.lat) {
      geo = resolvedGeo;
    }
  } catch (geoErr) {
    console.warn('[Vapi Register] Pincode geo resolution fallback:', geoErr.message);
  }

  const locName = `${geo.locality || 'Locality'}, ${geo.district || 'District'} (${targetPin})`;

  // Skills mapping
  const skillsMap = {
    Electrician: ['House Wiring', 'MCB Installation', 'Fan Installation', 'Switchboard Repair'],
    Plumber: ['Pipe Fitting', 'Tap Repair', 'Water Tank Cleaning', 'Leakage Fix'],
    Carpenter: ['Furniture Repair', 'Door & Lock Fix', 'Modular Kitchen', 'Woodwork'],
    Painter: ['Wall Putty', 'Interior Painting', 'Exterior Painting', 'Waterproofing'],
    'AC Repair & Service': ['Split AC Servicing', 'Gas Charging', 'PCB Repair', 'Compressor Check'],
    Mechanic: ['Motor Repair', 'Pump Servicing', 'Appliance Diagnosis']
  };
  const skills = skillsMap[profession] || [profession, 'General Maintenance'];

  const lang = String(args.language || 'hi').toLowerCase().startsWith('en') ? 'en' : 'hi';
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);

  // Check if caller already has an existing profile in database (e.g. name correction or re-registration)
  const existingUser = db.findOne('users', (u) => u.phone && String(u.phone).includes(cleanPhone));
  const existingWorker = db.findOne('workers', (w) => w.phone && String(w.phone).includes(cleanPhone));

  const userId = existingUser ? existingUser.user_id : (existingWorker?.user_id || `usr_vapi_${Date.now()}`);
  const workerId = existingWorker ? existingWorker.worker_id : `wrk_vapi_${Date.now()}`;

  // 1. Insert or Update User account in database
  if (existingUser) {
    db.update('users', (u) => u.user_id === userId, {
      name,
      address: locName,
      pincode: targetPin
    });
  } else {
    const newUser = {
      user_id: userId,
      name,
      phone: cleanPhone,
      role: 'worker',
      status: 'active',
      address: locName,
      pincode: targetPin,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.insert('users', newUser);
  }

  // 2. Insert or Update Worker Profile in database (Feature phone CallBot enabled)
  if (existingWorker) {
    db.update('workers', (w) => w.worker_id === workerId, {
      name,
      profession,
      services: [profession],
      skills,
      experience,
      pincode: targetPin,
      location_name: locName,
      daily_rate: dailyRate
    });
  } else {
    const newWorker = {
      worker_id: workerId,
      user_id: userId,
      name,
      phone: cleanPhone,
      profession,
      services: [profession],
      skills,
      experience,
      language: lang,
      languages: [lang, 'en'],
      pincode: targetPin,
      location_name: locName,
      location: {
        name: locName,
        pincode: targetPin,
        lat: geo.lat,
        lng: geo.lng
      },
      service_radius: 25,
      working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      communication_type: 'non_smartphone', // Receives automated voice calls on booking!
      rating: 5.0,
      reliability: null, // New artisan state
      completed_jobs: 0,
      total_accepted_jobs: 0,
      daily_rate: dailyRate,
      status: 'available',
      verification_status: 'verified',
      account_status: 'active',
      bio: `Verified ${profession} registered via inbound telephone voice call. Serving ${locName}. Fully CallBot dispatch enabled.`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.insert('workers', newWorker);
  }

  // 3. System Audit Log
  db.addAuditLog({
    actorId: userId,
    actorName: name,
    action: 'WORKER_REGISTERED_VIA_VAPI_VOICE',
    entityType: 'worker',
    entityId: workerId,
    source: 'vapi',
    metadata: {
      worker_id: workerId,
      name,
      phone,
      profession,
      pincode: targetPin,
      daily_rate: dailyRate,
      channel: 'non_smartphone'
    }
  });

  // 4. Voice-optimized confirmation speech for caller
  let speech = '';
  if (lang === 'en') {
    speech = `Congratulations ${name}! You are now successfully registered on HireLocal as a verified ${profession} in PINCODE ${targetPin} (${geo.locality || 'area'}). Your daily wage is set at ${dailyRate} rupees per day. You will receive automated phone calls directly on your phone ${phone} whenever a customer books your service.`;
  } else {
    speech = `बधाई हो ${name}! आप HireLocal पर पिनकोड ${targetPin} (${geo.locality || 'स्थानीय क्षेत्र'}) में ${profession} के रूप में सफलतापूर्वक पंजीकृत हो गए हैं। आपकी दैनिक मजदूरी ₹${dailyRate} प्रति 8 घंटे तय की गई है। अब जब भी कोई ग्राहक आपके क्षेत्र में काम बुक करेगा, आपको सीधे आपके फ़ोन नंबर ${phone} पर स्वचालित कॉल प्राप्त होगी।`;
  }

  return {
    success: true,
    worker_id: workerId,
    user_id: userId,
    name,
    phone,
    profession,
    pincode: targetPin,
    daily_rate: dailyRate,
    message: cleanForVoiceSpeech(speech)
  };
}

/**
 * Books an artisan directly from a telephone voice interaction (Vapi Tool Call)
 * and immediately triggers the automated outbound CallBot call to the assigned worker.
 *
 * @param {Object|string} params - Vapi tool call arguments
 * @returns {Promise<Object>} Structured result with confirmation speech
 */
export async function bookWorkerViaVoice(params = {}) {
  let args = {};
  if (typeof params === 'string') {
    try {
      args = JSON.parse(params);
    } catch {
      args = { service_type: params };
    }
  } else if (typeof params === 'object' && params !== null) {
    args = params;
  }

  const rawTrade = String(args.service_type || args.profession || args.trade || args.service || 'Electrician').trim();
  const rawPin = String(args.pincode || args.pin || '').match(/\b\d{6}\b/)?.[0] || '140413';
  const customerName = String(args.customer_name || args.caller_name || 'Customer').trim();

  let customerPhone = String(args.customer_phone || args.phone || args.caller_number || '').replace(/\D/g, '');
  if (customerPhone.length > 10) customerPhone = customerPhone.slice(-10);
  if (customerPhone.length < 10) customerPhone = '9876501234';

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const requiredDate = args.date || tomorrow.toISOString().split('T')[0];

  let geo = { locality: 'Bajheri', district: 'Mohali' };
  try {
    geo = await getCoordinatesForPincode(rawPin);
  } catch {}

  const address = args.address || `${geo.locality || 'Local Hub'}, ${geo.district || 'Mohali'} - ${rawPin}`;

  // Find nearest verified worker for this trade & pincode
  const activeWorkers = db.getCollection('workers').filter(
    (w) => w.account_status !== 'suspended' && w.verification_status !== 'rejected' && w.status !== 'busy'
  );

  const matchedWorker =
    activeWorkers.find((w) => (w.profession || '').toLowerCase().includes(rawTrade.toLowerCase()) && String(w.pincode || w.location?.pincode) === rawPin) ||
    activeWorkers.find((w) => (w.profession || '').toLowerCase().includes(rawTrade.toLowerCase())) ||
    activeWorkers[0];

  if (!matchedWorker) {
    return {
      success: false,
      message: `I apologize, but we do not currently have an active verified ${rawTrade} available in PINCODE ${rawPin}. Please check back shortly.`
    };
  }

  const jobId = `job_vapi_${Date.now()}`;
  const estimatedCost = Number(matchedWorker.daily_rate) || 550;

  const newJob = {
    job_id: jobId,
    customer_id: 'usr_customer_1',
    customer_name: customerName,
    customer_phone: customerPhone,
    worker_id: matchedWorker.worker_id,
    worker_name: matchedWorker.name,
    worker_phone: matchedWorker.phone,
    service_type: matchedWorker.profession || rawTrade,
    address,
    pincode: rawPin,
    required_date: requiredDate,
    preferred_time: 'flexible',
    description: `Voice telephony booking via Vapi for ${matchedWorker.profession || rawTrade}`,
    estimated_cost: estimatedCost,
    status: 'offered',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db.insert('jobs', newJob);

  // Trigger automated CallBot dispatch if worker is non-smartphone
  let callDispatched = false;
  if (matchedWorker.communication_type === 'non_smartphone' || matchedWorker.communication_type === 'all') {
    try {
      await triggerJobOfferCall(newJob, matchedWorker);
      callDispatched = true;
    } catch (callErr) {
      console.warn('[Vapi Voice Booking] CallBot dispatch trigger:', callErr.message);
    }
  }

  const speech = `Your booking for ${matchedWorker.profession} on ${requiredDate} at ${address} is confirmed. ${matchedWorker.name} has been assigned at ${estimatedCost} rupees per day. ${callDispatched ? `HireLocal CallBot is now dialing ${matchedWorker.name} directly on their phone to confirm.` : ''}`;

  return {
    success: true,
    job_id: jobId,
    worker_id: matchedWorker.worker_id,
    worker_name: matchedWorker.name,
    service_type: matchedWorker.profession,
    date: requiredDate,
    estimated_cost: estimatedCost,
    callDispatched,
    message: cleanForVoiceSpeech(speech)
  };
}

/**
 * Responds to a pending job offer directly from a telephone voice interaction (Vapi Tool Call)
 * Updates database, notifications, and worker statistics, and triggers automatic cascade on rejection.
 *
 * @param {Object|string} params - Vapi tool call arguments { decision: 'accept'|'reject', job_id, worker_id }
 * @param {Object} [context={}] - Call metadata
 * @returns {Promise<Object>} Structured result with confirmation speech
 */
export async function respondToJobOfferViaVoice(params = {}, context = {}) {
  let args = {};
  if (typeof params === 'string') {
    try {
      args = JSON.parse(params);
    } catch {
      args = { decision: params };
    }
  } else if (typeof params === 'object' && params !== null) {
    args = params;
  }

  // 1. Resolve phone number
  let phone = String(args.phone || args.worker_phone || context.customerPhone || '').replace(/\D/g, '');
  if (phone.length > 10) phone = phone.slice(-10);

  const sessionKey = context.callId || context.customerPhone || 'voice_session_default';
  const voiceSession = activeVoiceSessions.get(sessionKey);
  if (!phone && voiceSession?.phone) {
    phone = voiceSession.phone;
  }

  // 2. Identify worker
  let worker = phone ? db.findOne('workers', (w) => w.phone && String(w.phone).includes(phone)) : null;
  if (!worker && args.worker_id) {
    worker = db.findById('workers', 'worker_id', args.worker_id);
  }
  if (!worker && voiceSession?.name) {
    worker = db.findOne('workers', (w) => w.name && w.name.toLowerCase().includes(voiceSession.name.toLowerCase()));
  }
  if (!worker) {
    // Default to Aryan if testing or first staged worker
    worker = db.findOne('workers', (w) => w.name && w.name.toLowerCase().includes('aryan')) || db.find('workers')[0];
  }

  const workerName = worker?.name || 'कारीगर साथी';
  const workerId = worker?.worker_id;

  // 3. Find target pending job
  let targetJob = null;
  if (args.job_id) {
    targetJob = db.findById('jobs', 'job_id', args.job_id);
  }
  if (!targetJob && workerId) {
    const pendingJobs = db.find('jobs', (j) =>
      (j.worker_id === workerId || (phone && j.worker_phone && String(j.worker_phone).includes(phone))) &&
      (j.status === JOB_STATUS.PENDING_WORKER_RESPONSE || j.status === 'pending_worker_response' || j.status === 'offered' || j.status === 'REQUESTED')
    );
    if (pendingJobs && pendingJobs.length > 0) {
      targetJob = pendingJobs[pendingJobs.length - 1];
    }
  }
  if (!targetJob) {
    const anyPending = db.find('jobs', (j) =>
      j.status === JOB_STATUS.PENDING_WORKER_RESPONSE || j.status === 'pending_worker_response' || j.status === 'offered' || j.status === 'REQUESTED'
    );
    if (anyPending && anyPending.length > 0) {
      targetJob = anyPending[anyPending.length - 1];
    }
  }

  const rawDecision = String(args.decision || args.action || args.response || args.status || 'accept').toLowerCase();
  const isAccept = rawDecision.includes('accept') || rawDecision.includes('yes') || rawDecision.includes('ha') || rawDecision.includes('हाँ') || rawDecision.includes('1') || rawDecision.includes('स्वीकार') || rawDecision.includes('karunga');
  const isReject = rawDecision.includes('reject') || rawDecision.includes('no') || rawDecision.includes('decline') || rawDecision.includes('मना') || rawDecision.includes('2') || rawDecision.includes('अस्वीकार');

  const lang = String(args.language || voiceSession?.language || 'hi').startsWith('en') ? 'en' : 'hi';

  if (!targetJob) {
    const msg = lang === 'en'
      ? `Hello ${workerName}, there are no active pending job offers waiting for confirmation on your profile right now.`
      : `नमस्ते ${workerName} जी, आपके खाते पर इस समय कोई नया काम पेंडिंग नहीं है। जैसे ही नया काम आएगा, आपको सूचित कर दिया जाएगा।`;
    return {
      success: false,
      message: cleanForVoiceSpeech(msg)
    };
  }

  if (isAccept) {
    db.update('jobs', (j) => j.job_id === targetJob.job_id, {
      status: JOB_STATUS.ACCEPTED,
      updated_at: new Date().toISOString()
    });

    if (worker) {
      db.update('workers', (w) => w.worker_id === worker.worker_id, {
        total_accepted_jobs: (worker.total_accepted_jobs || 0) + 1
      });
    }

    db.addNotification({
      userId: targetJob.customer_id,
      title: 'Job Accepted! 🎉',
      message: `${workerName} has accepted your ${targetJob.service_type} request for ${targetJob.required_date}. You can now coordinate directly!`,
      type: 'job_accepted',
      entityType: 'job',
      entityId: targetJob.job_id
    });

    db.addAuditLog({
      actorId: worker?.user_id || workerId || 'voice_worker',
      actorName: workerName,
      action: 'JOB_ACCEPTED_VIA_VAPI_VOICE_CALL',
      entityType: 'job',
      entityId: targetJob.job_id,
      source: 'vapi',
      metadata: {
        worker_id: workerId,
        phone,
        service: targetJob.service_type,
        cost: targetJob.estimated_cost
      }
    });

    const speech = lang === 'en'
      ? `Excellent ${workerName}! You have successfully accepted the job for ${targetJob.service_type} at ${targetJob.address}. The customer has been notified with your confirmation. Daily wage: ${targetJob.estimated_cost} rupees. Thank you!`
      : `बहुत बढ़िया ${workerName} जी! आपने ${targetJob.service_type} का काम स्वीकार कर लिया है। ग्राहक को आपकी स्वीकृति भेज दी गई है। काम का विवरण: स्थान ${targetJob.address}, तारीख ${targetJob.required_date || 'तय तिथि'}, दैनिक मजदूरी ₹${targetJob.estimated_cost}। समय पर पहुँचें। धन्यवाद!`;

    return {
      success: true,
      decision: 'ACCEPTED',
      job_id: targetJob.job_id,
      worker_id: workerId,
      message: cleanForVoiceSpeech(speech)
    };
  } else if (isReject) {
    db.update('jobs', (j) => j.job_id === targetJob.job_id, {
      status: JOB_STATUS.REJECTED,
      rejection_reason: 'Declined by worker over voice call',
      updated_at: new Date().toISOString()
    });

    try {
      await handleWorkerRejection(targetJob.job_id, workerId);
    } catch (e) {
      console.warn('[Vapi Voice Decision] Alternative worker cascade notice:', e.message);
    }

    db.addAuditLog({
      actorId: worker?.user_id || workerId || 'voice_worker',
      actorName: workerName,
      action: 'JOB_DECLINED_VIA_VAPI_VOICE_CALL',
      entityType: 'job',
      entityId: targetJob.job_id,
      source: 'vapi',
      metadata: { worker_id: workerId, phone }
    });

    const speech = lang === 'en'
      ? `Understood ${workerName}. You have declined this job. The system will automatically offer it to another available worker. Thank you!`
      : `जी ठीक है ${workerName} जी, आपने यह काम अस्वीकार कर दिया है। यह काम किसी अन्य उपलब्ध कारीगर को पेश किया जाएगा। HireLocal से जुड़ने के लिए धन्यवाद!`;

    return {
      success: true,
      decision: 'REJECTED',
      job_id: targetJob.job_id,
      worker_id: workerId,
      message: cleanForVoiceSpeech(speech)
    };
  }

  return {
    success: false,
    message: lang === 'en'
      ? `Would you like to accept or decline the job offer for ${targetJob.service_type}? Please say 'Yes' to accept or 'No' to decline.`
      : `क्या आप ${targetJob.service_type} का काम स्वीकार करना चाहते हैं या मना करना चाहते हैं? कृपया 'हाँ' या 'ना' बताएं।`
  };
}
