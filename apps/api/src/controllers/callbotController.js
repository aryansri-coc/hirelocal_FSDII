import { db } from '../../../../database/db.js';
import { CallSession } from '../../../../packages/callbot/stateMachine.js';
import { processJobCallStep, LOCALIZED_SCRIPTS } from '../../../../packages/callbot/dialogueEngine.js';
import { JOB_STATUS } from '../../../../packages/shared/statusVocabulary.js';
import { updateWorkerReliabilityOnCompletion } from '../../../../packages/services/reliabilityCalculator.js';

// In-memory active call sessions cache
const activeSessions = new Map();

export async function startCallSession(req, res, next) {
  try {
    const { job_id, worker_id, phone, language = 'hi', mode = 'job_notification' } = req.body;

    let worker = null;
    if (worker_id) {
      worker = db.findById('workers', 'worker_id', worker_id);
    } else if (phone) {
      worker = db.findOne('workers', (w) => w.phone === phone);
    }

    let job = null;
    if (job_id) {
      job = db.findById('jobs', 'job_id', job_id);
    }

    const sessionId = `call_${Date.now()}`;
    const session = new CallSession(sessionId, worker?.phone || phone, mode, job);
    session.workerName = worker?.name || 'Worker';
    session.language = language || worker?.language || 'hi';

    activeSessions.set(sessionId, session);

    // Initial greeting step
    const initialStep = processJobCallStep(session, null);

    return res.json({
      success: true,
      sessionId,
      worker: worker ? { id: worker.worker_id, name: worker.name, phone: worker.phone } : null,
      job: job ? { id: job.job_id, service: job.service_type, date: job.required_date } : null,
      step: initialStep,
      conversationLog: session.callLog
    });
  } catch (err) {
    next(err);
  }
}

export async function processCallStep(req, res, next) {
  try {
    const { sessionId, input, dtmfDigit } = req.body;
    const session = activeSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { message: 'Call session expired or not found.' }
      });
    }

    const userInput = dtmfDigit !== undefined && dtmfDigit !== null ? String(dtmfDigit) : input;
    const stepResult = processJobCallStep(session, userInput);

    // If decision executed, update backend database!
    if (stepResult.action === 'EXECUTE_DECISION') {
      const decisionStatus = stepResult.decision === 'ACCEPTED'
        ? JOB_STATUS.ACCEPTED
        : JOB_STATUS.REJECTED;

      if (session.job?.job_id) {
        db.update('jobs', (j) => j.job_id === session.job.job_id, {
          status: decisionStatus,
          updated_at: new Date().toISOString()
        });

        // If accepted, update worker accepted stats
        if (decisionStatus === JOB_STATUS.ACCEPTED && session.job.worker_id) {
          const wrk = db.findById('workers', 'worker_id', session.job.worker_id);
          if (wrk) {
            db.update('workers', (w) => w.worker_id === wrk.worker_id, {
              total_accepted_jobs: (wrk.total_accepted_jobs || 0) + 1
            });
          }
        }
      }

      // Record call log
      const logRecord = {
        call_id: session.sessionId,
        worker_id: session.job?.worker_id || 'unknown',
        job_id: session.job?.job_id || null,
        call_type: session.mode,
        language: session.language,
        start_time: session.createdAt,
        duration: Math.round((Date.now() - new Date(session.createdAt).getTime()) / 1000),
        response: stepResult.decision,
        status: 'completed',
        metadata: JSON.stringify(session.callLog)
      };
      db.insert('call_logs', logRecord);
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

export async function telephonyWebhook(req, res, next) {
  try {
    const { From, Digits, SpeechResult } = req.body;
    console.log(`[Telephony Webhook] From: ${From}, Digits: ${Digits}, Speech: ${SpeechResult}`);

    // Standard Twilio XML response support
    res.type('text/xml');
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="hi-IN">नमस्ते! HireLocal सेवा में आपका स्वागत है।</Say>
  <Gather numDigits="1" action="/api/callbot/webhook" method="POST">
    <Say language="hi-IN">काम स्वीकार करने के लिए 1 दबाएं। अस्वीकार करने के लिए 2 दबाएं।</Say>
  </Gather>
</Response>`;
    return res.send(twiml);
  } catch (err) {
    next(err);
  }
}

export async function getCallLogs(req, res, next) {
  try {
    const logs = db.getCollection('call_logs');
    logs.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
    return res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    next(err);
  }
}
