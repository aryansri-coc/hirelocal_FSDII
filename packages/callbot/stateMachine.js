import {
  CALLBOT_REGISTRATION_STATES,
  CALLBOT_JOB_STATES,
  CALLBOT_CUSTOMER_STATES,
  CALLBOT_INTENTS
} from '../shared/statusVocabulary.js';

export class CallSession {
  constructor(sessionId, phone, mode = 'job_notification', initialJob = null, customer = null) {
    this.sessionId = sessionId;
    this.workerPhone = phone;
    this.phone = phone;
    this.mode = mode; // 'registration' | 'job_notification' | 'customer_order'
    this.language = 'hi'; // default Hindi
    this.state = mode === 'registration'
      ? CALLBOT_REGISTRATION_STATES.START
      : mode === 'customer_order'
        ? CALLBOT_CUSTOMER_STATES.START
        : CALLBOT_JOB_STATES.START_CALL;
    this.job = initialJob;
    this.customer = customer;
    this.workerName = null;
    this.registrationData = {};
    this.retries = 0;
    this.maxRetries = 3;
    this.callLog = [];
    this.createdAt = new Date().toISOString();
    this.status = 'active'; // 'active' | 'completed' | 'failed'
    this.decision = null;
  }

  logStep(speaker, message, state) {
    this.callLog.push({
      timestamp: new Date().toISOString(),
      speaker, // 'bot' | 'worker' | 'customer'
      message,
      state
    });
  }
}

/**
 * Maps caller speech text or DTMF keypad digit into a canonical intent
 */
export function parseIntent(input, currentState = null) {
  if (!input) return { intent: 'UNKNOWN', raw: input };

  const str = String(input).trim().toLowerCase();

  // DTMF Keypad mappings
  if (str === '1' || str === 'dtmf_1') {
    return { intent: CALLBOT_INTENTS.ACCEPT, raw: input, confidence: 1.0 };
  }
  if (str === '2' || str === 'dtmf_2') {
    return { intent: CALLBOT_INTENTS.REJECT, raw: input, confidence: 1.0 };
  }
  if (str === '3' || str === 'dtmf_3') {
    return { intent: CALLBOT_INTENTS.REPEAT, raw: input, confidence: 1.0 };
  }
  if (str === '9' || str === 'dtmf_9' || str === '0' || str === 'dtmf_0') {
    return { intent: CALLBOT_INTENTS.HELP, raw: input, confidence: 1.0 };
  }

  // Voice / Natural language keyword matching in Hindi, Marathi, and English
  // Accept / Confirm: haan, yes, karunga, theek hai, accept, bilkul, pakka, ha, okay, confirm, aunga, ho jayega
  if (/^(haan|ha|yes|accept|theek hai|karunga|ho jayega|bilkul|ok|okay|le lunga|aunga|aa jaunga|pakka|confirm|sahi hai|hoel)$/i.test(str) ||
      str.includes('haan') || str.includes('accept') || str.includes('theek hai') || str.includes('yes') || str.includes('confirm') || str.includes('sahi hai')) {
    return { intent: CALLBOT_INTENTS.ACCEPT, raw: input, confidence: 0.95 };
  }

  // Reject / Cancel: nahi, no, reject, nahi hoga, busy hoon, cancel, na, nahi jam raha, radd, band karo
  if (/^(nahi|no|reject|nahi hoga|busy|na|cancel|nahi karunga|nahi aunga|radd|nako|vaddu)$/i.test(str) ||
      str.includes('nahi') || str.includes('reject') || str.includes('busy') || str.includes('no') || str.includes('cancel') || str.includes('radd')) {
    return { intent: CALLBOT_INTENTS.REJECT, raw: input, confidence: 0.95 };
  }

  // Repeat: repeat, dobara, fir se, sunao, again, ek baar aur
  if (/^(repeat|dobara|fir se|phir se|again|sunao|punha)$/i.test(str) ||
      str.includes('dobara') || str.includes('repeat') || str.includes('fir se') || str.includes('phir se') || str.includes('sunao')) {
    return { intent: CALLBOT_INTENTS.REPEAT, raw: input, confidence: 0.95 };
  }

  // Help: madad, help, operator, customer care, sahayata
  if (/^(help|madad|sahayata|operator|madath)$/i.test(str) || str.includes('help') || str.includes('madad') || str.includes('operator')) {
    return { intent: CALLBOT_INTENTS.HELP, raw: input, confidence: 0.95 };
  }

  return { intent: 'UNKNOWN', raw: input, confidence: 0.2 };
}

/**
 * Parses profession / trade from voice input or DTMF key during registration
 */
export function parseProfession(input) {
  if (!input) return 'Electrician';
  const str = String(input).trim().toLowerCase();

  if (str === '1' || str === 'dtmf_1' || str.includes('elect') || str.includes('bijli') || str.includes('इलेक्ट्रीशियन') || str.includes('बिजली')) {
    return 'Electrician';
  }
  if (str === '2' || str === 'dtmf_2' || str.includes('plumb') || str.includes('nal') || str.includes('प्लंबर') || str.includes('नल')) {
    return 'Plumber';
  }
  if (str === '3' || str === 'dtmf_3' || str.includes('carp') || str.includes('badhai') || str.includes('lakdi') || str.includes('कारपेंटर') || str.includes('बढ़ई')) {
    return 'Carpenter';
  }
  if (str === '4' || str === 'dtmf_4' || str.includes('paint') || str.includes('rang') || str.includes('पेंटर') || str.includes('रंग')) {
    return 'Painter';
  }
  if (str === '5' || str === 'dtmf_5' || str.includes('ac') || str.includes('cool') || str.includes('एसी')) {
    return 'AC Repair';
  }

  // Fallback: capitalize input
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Parses language choice from voice input or DTMF key
 */
export function parseLanguage(input) {
  if (!input) return 'hi';
  const str = String(input).trim().toLowerCase();

  if (str === '1' || str === 'dtmf_1' || str.includes('hi') || str.includes('हिंदी') || str.includes('हिन्दी')) {
    return 'hi';
  }
  if (str === '2' || str === 'dtmf_2' || str.includes('en') || str.includes('eng') || str.includes('अंग्रेजी')) {
    return 'en';
  }
  if (str === '3' || str === 'dtmf_3' || str.includes('mr') || str.includes('marathi') || str.includes('मराठी')) {
    return 'mr';
  }
  if (str === '4' || str === 'dtmf_4' || str.includes('te') || str.includes('telugu') || str.includes('तेलुगु')) {
    return 'te';
  }

  return 'hi';
}

/**
 * Parses years of experience from voice input or DTMF key
 */
export function parseExperience(input) {
  if (!input) return 3;
  const match = String(input).match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    return Math.min(Math.max(num, 1), 40);
  }
  if (String(input).includes('ek') || String(input).includes('one')) return 1;
  if (String(input).includes('do') || String(input).includes('two')) return 2;
  if (String(input).includes('teen') || String(input).includes('three')) return 3;
  if (String(input).includes('char') || String(input).includes('four')) return 4;
  if (String(input).includes('paanch') || String(input).includes('five')) return 5;
  if (String(input).includes('das') || String(input).includes('ten')) return 10;
  return 3;
}

