/**
 * CallBot State Machine
 * Implements Sections 13 & 14 of the HireLocal Specification:
 * - Registration State Machine
 * - Job Notification & Decision State Machine
 */

import {
  CALLBOT_REGISTRATION_STATES,
  CALLBOT_JOB_STATES,
  CALLBOT_INTENTS
} from '../shared/statusVocabulary.js';

export class CallSession {
  constructor(sessionId, workerPhone, mode = 'job_notification', initialJob = null) {
    this.sessionId = sessionId;
    this.workerPhone = workerPhone;
    this.mode = mode; // 'registration' or 'job_notification'
    this.language = 'hi'; // default Hindi
    this.state = mode === 'registration'
      ? CALLBOT_REGISTRATION_STATES.START
      : CALLBOT_JOB_STATES.START_CALL;
    this.job = initialJob;
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
      speaker, // 'bot' | 'worker'
      message,
      state
    });
  }
}

/**
 * Maps worker speech text or DTMF keypad digit into a canonical intent
 */
export function parseIntent(input, currentJobState) {
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

  // Voice / Natural language keyword matching in Hindi and English
  // Accept: haan, yes, karunga, theek hai, accept, bilkul, pakka, ha, okay
  if (/^(haan|ha|yes|accept|theek hai|karunga|ho jayega|bilkul|ok|okay|le lunga)$/i.test(str) ||
      str.includes('haan') || str.includes('accept') || str.includes('theek hai') || str.includes('yes')) {
    return { intent: CALLBOT_INTENTS.ACCEPT, raw: input, confidence: 0.95 };
  }

  // Reject: nahi, no, reject, nahi hoga, busy hoon, cancel, na
  if (/^(nahi|no|reject|nahi hoga|busy|na|cancel|nahi karunga)$/i.test(str) ||
      str.includes('nahi') || str.includes('reject') || str.includes('busy') || str.includes('no')) {
    return { intent: CALLBOT_INTENTS.REJECT, raw: input, confidence: 0.95 };
  }

  // Repeat: repeat, dobara, fir se, sunao, again, ek baar aur
  if (/^(repeat|dobara|fir se|phir se|again|sunao)$/i.test(str) ||
      str.includes('dobara') || str.includes('repeat') || str.includes('fir se')) {
    return { intent: CALLBOT_INTENTS.REPEAT, raw: input, confidence: 0.95 };
  }

  // Help: madad, help, operator, customer care
  if (/^(help|madad|sahayata|operator)$/i.test(str) || str.includes('help') || str.includes('madad')) {
    return { intent: CALLBOT_INTENTS.HELP, raw: input, confidence: 0.95 };
  }

  return { intent: 'UNKNOWN', raw: input, confidence: 0.2 };
}
