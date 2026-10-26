import { db } from '../../../../database/db.js';
import { CallSession } from '../../../../packages/callbot/stateMachine.js';
import { getAlternativeWorkers } from '../../../../packages/services/matchingEngine.js';
import { JOB_STATUS } from '../../../../packages/shared/statusVocabulary.js';
import { activeSessions } from '../controllers/callbotController.js';

/**
 * Telephony Service
 * Manages outbound telephony calls, Twilio PSTN dispatch, and alternative worker cascade on rejection.
 */

export async function makeOutboundPstnCall({ toPhone, sessionId, callbackUrl }) {
  const provider = process.env.TELEPHONY_PROVIDER || 'mock';
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (provider === 'twilio' && accountSid && authToken && fromNumber) {
    try {
      console.log(`[Telephony] Initiating real PSTN Twilio call to ${toPhone} from ${fromNumber}...`);
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const params = new URLSearchParams();
      params.append('To', toPhone.startsWith('+') ? toPhone : `+91${toPhone}`);
      params.append('From', fromNumber);
      params.append('Url', callbackUrl || `${process.env.API_URL || 'http://localhost:5000'}/api/callbot/webhook`);
      params.append('Method', 'POST');

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[Telephony] Twilio API call failed:', data);
        return { success: false, error: data };
      }

      console.log(`[Telephony] Twilio Call SID: ${data.sid}, Status: ${data.status}`);
      return { success: true, sid: data.sid, status: data.status };
    } catch (err) {
      console.error('[Telephony] Twilio network error:', err);
      return { success: false, error: err.message };
    }
  }

  // Mock / In-Memory Simulation Mode
  console.log(`[Telephony Mock] Outbound call placed to ${toPhone} (Session: ${sessionId}). Ready for simulator or webhook.`);
  return { success: true, sid: sessionId, status: 'queued', mock: true };
}

/**
 * Triggers an automated outbound CallBot call to a non-smartphone worker for a new job offer.
 */
export async function triggerJobOfferCall(job, worker) {
  if (!worker || !job) return null;

  const sessionId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const workerPhone = worker.phone || '+919820100000';
  const workerLang = (worker.languages && worker.languages[0]) || worker.language || 'hi';

  const session = new CallSession(sessionId, workerPhone, 'job_notification', job);
  session.workerName = worker.name || 'Worker';
  session.language = workerLang;

  activeSessions.set(sessionId, session);

  // Record initial queued log in call_logs table
  const callRecord = {
    call_id: sessionId,
    worker_id: worker.worker_id,
    job_id: job.job_id,
    call_type: 'job_notification',
    language: workerLang,
    start_time: new Date().toISOString(),
    duration: 0,
    response: 'PENDING',
    status: 'queued',
    metadata: `Automated outbound CallBot triggered for job #${job.job_id} (${job.service_type})`,
    created_at: new Date().toISOString()
  };
  db.insert('call_logs', callRecord);

  // Add system audit log
  db.addAuditLog({
    actorId: 'system',
    actorName: 'AI CallBot Telephony Gateway',
    action: 'CALLBOT_OUTBOUND_DISPATCHED',
    entityType: 'callbot',
    entityId: sessionId,
    source: 'callbot',
    metadata: {
      worker_id: worker.worker_id,
      worker_name: worker.name,
      phone: workerPhone,
      job_id: job.job_id,
      service: job.service_type,
      language: workerLang
    }
  });

  // Execute PSTN dial or mock queue
  const pstnResult = await makeOutboundPstnCall({
    toPhone: workerPhone,
    sessionId,
    callbackUrl: `${process.env.API_URL || 'http://localhost:5000'}/api/callbot/webhook`
  });

  return {
    sessionId,
    callRecord,
    pstnResult
  };
}

/**
 * Alternative Worker Cascade
 * Automatically called when a worker declines or rejects a job via CallBot.
 * Finds the next highest-ranked craftsman and automatically dispatches a call to them!
 */
export async function handleWorkerRejection(jobId, rejectedWorkerId) {
  try {
    const job = db.findById('jobs', 'job_id', jobId);
    if (!job) return { success: false, message: 'Job not found' };

    console.log(`[CallBot Cascade] Worker ${rejectedWorkerId} declined Job #${jobId}. Finding next best alternative craftsman...`);

    const allWorkers = db.find('workers', (w) => w.account_status !== 'suspended' && w.verification_status !== 'rejected');
    const alternatives = getAlternativeWorkers(allWorkers, rejectedWorkerId, {
      service: job.service_type,
      date: job.required_date,
      lat: job.latitude,
      lng: job.longitude
    });

    if (alternatives && alternatives.length > 0) {
      const nextWorker = alternatives[0];
      console.log(`[CallBot Cascade] Found alternative: ${nextWorker.name} (${nextWorker.profession}, Match: ${nextWorker.match_score || 90}%). Reassigning...`);

      // Update job with newly assigned alternative worker
      db.update('jobs', (j) => j.job_id === jobId, {
        worker_id: nextWorker.worker_id,
        worker_name: nextWorker.name,
        status: JOB_STATUS.PENDING_WORKER_RESPONSE,
        updated_at: new Date().toISOString()
      });

      // Notify Customer
      db.addNotification({
        userId: job.customer_id,
        title: `Worker Reassigned: ${nextWorker.name}`,
        message: `Previous craftsman was unavailable. We have automatically matched you with ${nextWorker.name} (${nextWorker.profession}) and dispatched a confirmation call.`,
        type: 'job_reassigned',
        entityType: 'job',
        entityId: jobId
      });

      // Notify new worker
      db.addNotification({
        userId: nextWorker.user_id,
        title: `New Job Request: ${job.service_type}`,
        message: `${job.customer_name} requested your service for ${job.required_date}. Address: ${job.address}`,
        type: 'job_request',
        entityType: 'job',
        entityId: jobId
      });

      // Audit log
      db.addAuditLog({
        actorId: 'system',
        actorName: 'AI CallBot Dispatch Engine',
        action: 'JOB_AUTO_REROUTED_TO_ALTERNATIVE_WORKER',
        entityType: 'job',
        entityId: jobId,
        source: 'callbot',
        metadata: {
          previous_worker_id: rejectedWorkerId,
          new_worker_id: nextWorker.worker_id,
          new_worker_name: nextWorker.name,
          match_score: nextWorker.match_score
        }
      });

      // If the newly assigned worker is non-smartphone, automatically initiate an outbound call!
      if (nextWorker.communication_type === 'non_smartphone') {
        console.log(`[CallBot Cascade] New worker ${nextWorker.name} is non-smartphone. Initiating instant CallBot dispatch call...`);
        const updatedJob = db.findById('jobs', 'job_id', jobId);
        await triggerJobOfferCall(updatedJob, nextWorker);
      }

      return {
        success: true,
        reassigned: true,
        worker: nextWorker
      };
    } else {
      console.log(`[CallBot Cascade] No alternative workers available for Job #${jobId}. Moving to open marketplace pool.`);

      db.update('jobs', (j) => j.job_id === jobId, {
        worker_id: null,
        worker_name: null,
        status: JOB_STATUS.REQUESTED,
        updated_at: new Date().toISOString()
      });

      db.addNotification({
        userId: job.customer_id,
        title: 'Looking for Available Workers',
        message: `Your booking for ${job.service_type} has been placed in the priority dispatch pool. We will notify you as soon as a local pro accepts.`,
        type: 'job_pending_pool',
        entityType: 'job',
        entityId: jobId
      });

      return {
        success: true,
        reassigned: false,
        message: 'No immediate alternative. Placed in open marketplace pool.'
      };
    }
  } catch (err) {
    console.error('[CallBot Cascade Error]', err);
    return { success: false, error: err.message };
  }
}
