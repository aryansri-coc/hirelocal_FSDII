import { db } from '../../../../database/db.js';
import { CallSession } from '../../../../packages/callbot/stateMachine.js';
import {
  processJobCallStep,
  processRegistrationCallStep,
  processCustomerCallStep,
  LOCALIZED_SCRIPTS
} from '../../../../packages/callbot/dialogueEngine.js';
import { JOB_STATUS } from '../../../../packages/shared/statusVocabulary.js';
import { updateWorkerReliabilityOnCompletion } from '../../../../packages/services/reliabilityCalculator.js';
import { handleWorkerRejection } from '../services/telephonyService.js';
import {
  isBhashiniConfigured,
  synthesizeSpeechBhashini,
  transcribeSpeechBhashini,
  translateTextBhashini
} from '../services/bhashiniService.js';

// In-memory active call sessions cache (Session ID -> CallSession)
export const activeSessions = new Map();

// Helper to ensure valid worker_id for PostgreSQL foreign key constraint
function getValidWorkerId(candidateId) {
  if (candidateId && candidateId !== 'unknown' && db.findById('workers', 'worker_id', candidateId)) {
    return candidateId;
  }
  const firstWorker = db.find('workers')[0];
  return firstWorker?.worker_id || 'wrk_001';
}

// Helper to ensure valid job_id for PostgreSQL foreign key constraint
function getValidJobId(candidateId) {
  if (candidateId && candidateId !== 'unknown' && db.findById('jobs', 'job_id', candidateId)) {
    return candidateId;
  }
  return null;
}



/**
 * Initiates a new CallBot voice session (Job Offer, Worker Registration, or Customer Order Check)
 */
export async function startCallSession(req, res, next) {
  try {
    const {
      job_id,
      worker_id,
      customer_id,
      phone,
      language = 'hi',
      mode = 'job_notification'
    } = req.body;

    let worker = null;
    let customer = null;
    let job = null;

    if (worker_id) {
      worker = db.findById('workers', 'worker_id', worker_id);
    } else if (phone && mode !== 'customer_order') {
      worker = db.findOne('workers', (w) => w.phone === phone);
    }

    if (customer_id) {
      customer = db.findById('users', 'user_id', customer_id);
    } else if (phone && mode === 'customer_order') {
      customer = db.findOne('users', (u) => u.phone === phone);
    }

    if (job_id) {
      job = db.findById('jobs', 'job_id', job_id);
    } else if (customer) {
      // Find latest pending or active job for this customer
      const customerJobs = db.find('jobs', (j) => j.customer_id === customer.user_id);
      customerJobs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      job = customerJobs[0] || null;
    } else if (worker) {
      // Find latest pending job for this worker
      const workerJobs = db.find('jobs', (j) => j.worker_id === worker.worker_id && j.status === JOB_STATUS.PENDING_WORKER_RESPONSE);
      job = workerJobs[0] || null;
    }

    const sessionId = `call_${Date.now()}`;
    const callerPhone = worker?.phone || customer?.phone || phone || '+919820100000';
    const session = new CallSession(sessionId, callerPhone, mode, job, customer);

    session.workerName = worker?.name || 'Worker';
    session.language = language || worker?.language || 'hi';

    activeSessions.set(sessionId, session);

    // Initial greeting step based on mode
    let initialStep;
    if (mode === 'registration') {
      initialStep = processRegistrationCallStep(session, null);
    } else if (mode === 'customer_order') {
      initialStep = processCustomerCallStep(session, null);
    } else {
      initialStep = processJobCallStep(session, null);
    }

    return res.json({
      success: true,
      sessionId,
      mode,
      worker: worker ? { id: worker.worker_id, name: worker.name, phone: worker.phone } : null,
      customer: customer ? { id: customer.user_id, name: customer.name, phone: customer.phone } : null,
      job: job ? { id: job.job_id, service: job.service_type, date: job.required_date, status: job.status } : null,
      step: initialStep,
      conversationLog: session.callLog
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Processes incoming speech or DTMF digit in an active CallBot session
 */
export async function processCallStep(req, res, next) {
  try {
    const { sessionId, input, dtmfDigit, mode, language, job_id, currentState } = req.body;
    let session = activeSessions.get(sessionId);

    // Dynamic Auto-Recovery: Reconstruct session if server reloaded mid-call in development/demo
    if (!session && sessionId) {
      const recoveredMode = mode || 'job_notification';
      const recoveredLang = language || 'hi';
      const job = job_id ? db.findById('jobs', 'job_id', job_id) : (db.find('jobs')[0] || null);
      const customer = job?.customer_id ? db.findById('users', 'user_id', job.customer_id) : null;
      const worker = job?.worker_id ? db.findById('workers', 'worker_id', job.worker_id) : null;

      session = new CallSession(sessionId, worker?.phone || '+919820100000', recoveredMode, job, customer);
      session.workerName = worker?.name || 'Worker Ji';
      session.language = recoveredLang;

      // Restore last known state if provided, or default to initial step
      if (currentState) {
        session.state = currentState;
      } else if (recoveredMode === 'job_notification') {
        session.state = 'INTRODUCE_JOB';
      } else if (recoveredMode === 'customer_order') {
        session.state = 'ORDER_STATUS';
      }

      activeSessions.set(sessionId, session);
    }

    if (!session) {
      return res.status(404).json({
        success: false,
        sessionExpired: true,
        error: { message: 'Call session ended. Please click "Dial Outbound Call" to restart.' }
      });
    }

    const userInput = dtmfDigit !== undefined && dtmfDigit !== null ? String(dtmfDigit) : input;
    let stepResult;

    // Route step to appropriate state machine processor
    if (session.mode === 'registration') {
      stepResult = processRegistrationCallStep(session, userInput);

      // Execute worker registration into database
      if (stepResult.action === 'EXECUTE_REGISTRATION') {
        const regData = stepResult.registrationData || {};
        const cleanPhone = session.phone || `9820${Math.floor(100000 + Math.random() * 900000)}`;
        const userId = `usr_call_${Date.now()}`;
        const workerId = `wrk_call_${Date.now()}`;

        // Create user record
        const newUser = {
          user_id: userId,
          name: regData.name || 'Skilled Craftsman',
          phone: cleanPhone,
          role: 'worker',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        db.insert('users', newUser);

        // Create worker record with non-smartphone channel
        const newWorker = {
          worker_id: workerId,
          user_id: userId,
          name: regData.name || 'Skilled Craftsman',
          phone: cleanPhone,
          profession: regData.profession || 'Electrician',
          skills: [regData.profession || 'Electrician'],
          experience: Number(regData.experience) || 3,
          rating: 5.0,
          total_ratings: 0,
          completed_jobs: 0,
          total_accepted_jobs: 0,
          daily_rate: regData.profession === 'AC Repair' ? 850 : 650,
          communication_type: 'non_smartphone',
          languages: [session.language || 'hi'],
          status: 'available',
          verification_status: 'verified',
          location_name: regData.location || 'Bhopal (462011)',
          location: {
            name: regData.location || 'Bhopal (462011)',
            lat: 23.2332,
            lng: 77.4343,
            pincode: '462011'
          },
          service_radius: 15,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        db.insert('workers', newWorker);

        // Add audit log
        db.addAuditLog({
          actorId: userId,
          actorName: newWorker.name,
          action: 'WORKER_REGISTERED_VIA_CALLBOT',
          entityType: 'worker',
          entityId: workerId,
          source: 'callbot',
          metadata: {
            phone: cleanPhone,
            trade: newWorker.profession,
            language: session.language,
            channel: 'non_smartphone'
          }
        });

        // Record call log
        db.insert('call_logs', {
          call_id: session.sessionId,
          worker_id: workerId,
          job_id: null,
          call_type: 'registration',
          language: session.language,
          start_time: session.createdAt,
          duration: Math.round((Date.now() - new Date(session.createdAt).getTime()) / 1000),
          response: 'REGISTERED',
          status: 'completed',
          metadata: JSON.stringify(session.callLog)
        });
      }
    } else if (session.mode === 'customer_order') {
      stepResult = processCustomerCallStep(session, userInput);

      if (stepResult.action === 'EXECUTE_CUSTOMER_CONFIRMATION' && session.job?.job_id) {
        db.update('jobs', (j) => j.job_id === session.job.job_id, {
          customer_confirmed: true,
          updated_at: new Date().toISOString()
        });

        db.addAuditLog({
          actorId: session.customer?.user_id || 'customer',
          actorName: session.customer?.name || 'Customer',
          action: 'JOB_CUSTOMER_CONFIRMED_VIA_CALLBOT',
          entityType: 'job',
          entityId: session.job.job_id,
          source: 'callbot'
        });

        db.insert('call_logs', {
          call_id: session.sessionId,
          worker_id: getValidWorkerId(session.job?.worker_id),
          job_id: getValidJobId(session.job?.job_id),
          call_type: 'customer_order',
          language: session.language,
          start_time: session.createdAt,
          duration: Math.round((Date.now() - new Date(session.createdAt).getTime()) / 1000),
          response: 'CONFIRMED',
          status: 'completed',
          metadata: JSON.stringify(session.callLog)
        });
      } else if (stepResult.action === 'EXECUTE_CUSTOMER_CANCELLATION' && session.job?.job_id) {
        db.update('jobs', (j) => j.job_id === session.job.job_id, {
          status: JOB_STATUS.CANCELLED,
          updated_at: new Date().toISOString()
        });

        db.addAuditLog({
          actorId: session.customer?.user_id || 'customer',
          actorName: session.customer?.name || 'Customer',
          action: 'JOB_CANCELLED_VIA_CALLBOT',
          entityType: 'job',
          entityId: session.job.job_id,
          source: 'callbot'
        });

        db.insert('call_logs', {
          call_id: session.sessionId,
          worker_id: getValidWorkerId(session.job?.worker_id),
          job_id: getValidJobId(session.job?.job_id),
          call_type: 'customer_order',
          language: session.language,
          start_time: session.createdAt,
          duration: Math.round((Date.now() - new Date(session.createdAt).getTime()) / 1000),
          response: 'CANCELLED',
          status: 'completed',
          metadata: JSON.stringify(session.callLog)
        });
      }
    } else {
      // Outbound job notification to worker
      stepResult = processJobCallStep(session, userInput);

      if (stepResult.action === 'EXECUTE_DECISION') {
        const decisionStatus = stepResult.decision === 'ACCEPTED'
          ? JOB_STATUS.ACCEPTED
          : JOB_STATUS.REJECTED;

        if (session.job?.job_id) {
          db.update('jobs', (j) => j.job_id === session.job.job_id, {
            status: decisionStatus,
            updated_at: new Date().toISOString()
          });

          if (decisionStatus === JOB_STATUS.ACCEPTED && session.job.worker_id) {
            const wrk = db.findById('workers', 'worker_id', session.job.worker_id);
            if (wrk) {
              db.update('workers', (w) => w.worker_id === wrk.worker_id, {
                total_accepted_jobs: (wrk.total_accepted_jobs || 0) + 1
              });
            }
          } else if (decisionStatus === JOB_STATUS.REJECTED && session.job?.job_id) {
            // Trigger auto-reroute to alternative worker cascade
            await handleWorkerRejection(session.job.job_id, session.job.worker_id);
          }
        }


        db.insert('call_logs', {
          call_id: session.sessionId,
          worker_id: getValidWorkerId(session.job?.worker_id),
          job_id: getValidJobId(session.job?.job_id),
          call_type: 'job_notification',
          language: session.language,
          start_time: session.createdAt,
          duration: Math.round((Date.now() - new Date(session.createdAt).getTime()) / 1000),
          response: stepResult.decision,
          status: 'completed',
          metadata: JSON.stringify(session.callLog)
        });
      }
    }

    return res.json({
      success: true,
      sessionId,
      step: stepResult,
      isComplete: stepResult.isComplete,
      conversationLog: session.callLog
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Dynamic Telephony Webhook (Twilio / Exotel compliant)
 * Automatically resolves caller, transitions state machine, and streams TwiML XML responses.
 */
export async function telephonyWebhook(req, res, next) {
  try {
    const { From, Digits, SpeechResult, CallSid } = req.body;
    console.log(`[Telephony Webhook] CallSid: ${CallSid}, From: ${From}, Digits: ${Digits}, Speech: ${SpeechResult}`);

    const callerPhone = (From || '').replace(/^\+91/, '').trim();
    const sessionId = CallSid || `call_${callerPhone || Date.now()}`;
    let session = activeSessions.get(sessionId);

    // If new incoming call, auto-determine flow from database caller ID
    if (!session) {
      const existingWorker = db.findOne('workers', (w) => (w.phone || '').includes(callerPhone));
      const existingCustomer = db.findOne('users', (u) => (u.phone || '').includes(callerPhone) && u.role === 'customer');

      let mode = 'registration';
      let targetJob = null;

      if (existingWorker) {
        mode = 'job_notification';
        const pendingJobs = db.find('jobs', (j) => j.worker_id === existingWorker.worker_id && j.status === JOB_STATUS.PENDING_WORKER_RESPONSE);
        targetJob = pendingJobs[0] || null;
      } else if (existingCustomer) {
        mode = 'customer_order';
        const customerJobs = db.find('jobs', (j) => j.customer_id === existingCustomer.user_id);
        customerJobs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        targetJob = customerJobs[0] || null;
      }

      session = new CallSession(sessionId, callerPhone, mode, targetJob, existingCustomer);
      session.workerName = existingWorker?.name || null;
      activeSessions.set(sessionId, session);
    }

    const userInput = Digits !== undefined && Digits !== '' ? Digits : SpeechResult;
    let stepResult;

    if (session.mode === 'registration') {
      stepResult = processRegistrationCallStep(session, userInput);
    } else if (session.mode === 'customer_order') {
      stepResult = processCustomerCallStep(session, userInput);
    } else {
      stepResult = processJobCallStep(session, userInput);
    }

    // Build standard TwiML response
    res.type('text/xml');
    let twiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n`;
    twiml += `  <Say language="${session.language === 'hi' ? 'hi-IN' : 'en-IN'}">${stepResult.speechText}</Say>\n`;

    if (!stepResult.isComplete) {
      twiml += `  <Gather input="dtmf speech" numDigits="1" timeout="5" action="/api/callbot/webhook" method="POST">\n`;
      twiml += `    <Say language="${session.language === 'hi' ? 'hi-IN' : 'en-IN'}">कृपया अपना उत्तर दें।</Say>\n`;
      twiml += `  </Gather>\n`;
    } else {
      twiml += `  <Hangup/>\n`;
    }
    twiml += `</Response>`;

    return res.send(twiml);
  } catch (err) {
    next(err);
  }
}

/**
 * Returns CallBot logs and metrics
 */
export async function getCallLogs(req, res, next) {
  try {
    const logs = db.getCollection('call_logs');
    logs.sort((a, b) => new Date(b.start_time || 0) - new Date(a.start_time || 0));
    return res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Checks whether Bhashini AI credentials are setup
 */
export async function getBhashiniStatus(req, res, next) {
  try {
    return res.json({
      success: true,
      configured: isBhashiniConfigured(),
      provider: 'Bhashini AI (MeitY, Government of India)',
      supportedTasks: ['asr', 'tts', 'translation']
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Generates natural Indian language speech audio (WAV Base64) using Bhashini Indic-TTS
 */
export async function bhashiniTts(req, res, next) {
  try {
    const { text, language = 'hi', gender = 'female' } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: { message: 'text parameter is required' } });
    }
    const result = await synthesizeSpeechBhashini({ text, language, gender });
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Transcribes spoken Indian audio using Bhashini Indic-ASR
 */
export async function bhashiniAsr(req, res, next) {
  try {
    const { audioBase64, language = 'hi', audioFormat = 'wav' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ success: false, error: { message: 'audioBase64 parameter is required' } });
    }
    const result = await transcribeSpeechBhashini({ audioBase64, language, audioFormat });
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Translates text between Indian languages using Bhashini NMT
 */
export async function bhashiniTranslate(req, res, next) {
  try {
    const { text, sourceLang = 'en', targetLang = 'hi' } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: { message: 'text parameter is required' } });
    }
    const result = await translateTextBhashini({ text, sourceLang, targetLang });
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

