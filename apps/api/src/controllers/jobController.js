import { db } from '../../../../database/db.js';
import { JOB_STATUS } from '../../../../packages/shared/statusVocabulary.js';
import { validateJobCreation } from '../../../../packages/validation/validators.js';
import {
  updateWorkerReliabilityOnCompletion,
  updateWorkerReliabilityOnCancellation
} from '../../../../packages/services/reliabilityCalculator.js';
import { getAlternativeWorkers } from '../../../../packages/services/matchingEngine.js';

export async function createJob(req, res, next) {
  try {
    const customer = req.user;
    const {
      worker_id,
      service_type,
      address,
      latitude,
      longitude,
      required_date,
      preferred_time = 'flexible',
      description,
      estimated_cost
    } = req.body;

    const validation = validateJobCreation({
      service_type,
      required_date,
      address,
      description
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          message: validation.errors.join(' '),
          details: validation.errors
        }
      });
    }

    let selectedWorker = null;
    if (worker_id) {
      selectedWorker = db.findById('workers', 'worker_id', worker_id);
      if (!selectedWorker) {
        return res.status(404).json({
          success: false,
          error: { message: `Selected worker with ID '${worker_id}' not found.` }
        });
      }
      if (selectedWorker.account_status === 'suspended') {
        return res.status(400).json({
          success: false,
          error: { message: 'Selected worker is currently unavailable.' }
        });
      }
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const initialStatus = worker_id
      ? JOB_STATUS.PENDING_WORKER_RESPONSE
      : JOB_STATUS.REQUESTED;

    const newJob = {
      job_id: jobId,
      customer_id: customer.user_id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      worker_id: worker_id || null,
      worker_name: selectedWorker ? selectedWorker.name : null,
      service_type,
      address,
      latitude: latitude || 23.2332,
      longitude: longitude || 77.4343,
      required_date,
      preferred_time,
      description,
      status: initialStatus,
      estimated_cost: estimated_cost || (selectedWorker ? selectedWorker.daily_rate : 500),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.insert('jobs', newJob);

    // Audit Log
    db.addAuditLog({
      actorId: customer.user_id,
      actorName: customer.name,
      action: 'JOB_CREATED',
      entityType: 'job',
      entityId: jobId,
      source: 'web',
      metadata: {
        service_type,
        required_date,
        worker_id: worker_id || null
      }
    });

    // Notify assigned worker (if selected)
    let callbotSession = null;
    if (selectedWorker) {
      db.addNotification({
        userId: selectedWorker.user_id,
        title: `New Job Request: ${service_type}`,
        message: `${customer.name} requested your service for ${required_date} (${preferred_time}). Address: ${address}`,
        type: 'job_request',
        entityType: 'job',
        entityId: jobId
      });

      // If worker is non-smartphone, initiate CallBot outbound session immediately
      if (selectedWorker.communication_type === 'non_smartphone') {
        const callId = `call_${Date.now()}`;
        const logRecord = {
          call_id: callId,
          worker_id: selectedWorker.worker_id,
          job_id: jobId,
          call_type: 'job_notification',
          language: selectedWorker.language || 'hi',
          start_time: new Date().toISOString(),
          duration: 0,
          response: 'PENDING',
          status: 'queued',
          metadata: `Outbound AI CallBot triggered for job #${jobId}`,
          created_at: new Date().toISOString()
        };
        db.insert('call_logs', logRecord);
        callbotSession = { call_id: callId, status: 'queued' };

        db.addAuditLog({
          actorId: 'system',
          actorName: 'AI CallBot Gateway',
          action: 'CALLBOT_STARTED',
          entityType: 'callbot',
          entityId: callId,
          source: 'callbot',
          metadata: { worker_id: selectedWorker.worker_id, job_id: jobId, language: logRecord.language }
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Job request created successfully.',
      data: {
        job: newJob,
        callbot: callbotSession
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyJobs(req, res, next) {
  try {
    const user = req.user;
    const allJobs = db.getCollection('jobs');
    let userJobs = [];

    if (user.role === 'customer') {
      userJobs = allJobs.filter((j) => String(j.customer_id) === String(user.user_id));
    } else if (user.role === 'worker') {
      const worker = req.worker || db.findById('workers', 'user_id', user.user_id);
      if (worker) {
        userJobs = allJobs.filter((j) => String(j.worker_id) === String(worker.worker_id));
      }
    } else if (user.role === 'admin') {
      userJobs = allJobs;
    }

    userJobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({
      success: true,
      count: userJobs.length,
      data: userJobs
    });
  } catch (err) {
    next(err);
  }
}

export async function getJobById(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;
    const job = db.findById('jobs', 'job_id', id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: { message: `Job with ID '${id}' not found.` }
      });
    }

    // Resource Ownership Security (Section 15)
    const isCustomer = String(job.customer_id) === String(user.user_id);
    const isWorker = req.worker && String(job.worker_id) === String(req.worker.worker_id);
    const isAdmin = user.role === 'admin';

    if (!isCustomer && !isWorker && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied. You do not have permission to view this job.' }
      });
    }

    const worker = job.worker_id ? db.findById('workers', 'worker_id', job.worker_id) : null;
    const customer = db.findById('users', 'user_id', job.customer_id);
    const rating = db.findOne('ratings', (r) => r.job_id === job.job_id);

    let alternatives = [];
    if (job.status === JOB_STATUS.REJECTED && job.worker_id) {
      const allWorkers = db.find('workers', (w) => w.account_status !== 'suspended');
      alternatives = getAlternativeWorkers(allWorkers, job.worker_id, {
        service: job.service_type,
        date: job.required_date,
        lat: job.latitude,
        lng: job.longitude
      });
    }

    return res.json({
      success: true,
      data: {
        ...job,
        worker,
        customer: customer ? { name: customer.name, phone: customer.phone, address: customer.address } : null,
        rating: rating || null,
        alternatives
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateJobStatus(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;
    const { status, rejection_reason, alternative_worker_id } = req.body;

    const job = db.findById('jobs', 'job_id', id);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: { message: 'Job not found.' }
      });
    }

    if (!Object.values(JOB_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid status '${status}'. Must be one of: ${Object.values(JOB_STATUS).join(', ')}` }
      });
    }

    const isCustomer = String(job.customer_id) === String(user.user_id);
    const isWorker = req.worker && String(job.worker_id) === String(req.worker.worker_id);
    const isAdmin = user.role === 'admin';

    // 1. Strict Resource Ownership Security Checks (Section 15)
    if (!isCustomer && !isWorker && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { message: 'Unauthorized. You are not associated with this job.' }
      });
    }

    // 2. Strict Role & State Transition Rules (Section 14 & 16)
    if (status === JOB_STATUS.ACCEPTED || status === JOB_STATUS.REJECTED) {
      // Only the assigned worker or admin can accept or reject a request!
      if (!isWorker && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: { message: 'Only the assigned worker can accept or reject this job request.' }
        });
      }
    }

    if (job.status === JOB_STATUS.COMPLETED && status !== JOB_STATUS.COMPLETED) {
      return res.status(400).json({
        success: false,
        error: { message: 'Completed jobs cannot be modified.' }
      });
    }

    const updates = {
      status,
      updated_at: new Date().toISOString()
    };

    if (rejection_reason) {
      updates.rejection_reason = rejection_reason;
    }

    // Reassigning to alternative worker if requested by customer
    if (status === JOB_STATUS.PENDING_WORKER_RESPONSE && alternative_worker_id) {
      const altWorker = db.findById('workers', 'worker_id', alternative_worker_id);
      if (altWorker) {
        updates.worker_id = altWorker.worker_id;
        updates.worker_name = altWorker.name;
        updates.rejection_reason = null;

        // Notify new worker
        db.addNotification({
          userId: altWorker.user_id,
          title: `New Job Request: ${job.service_type}`,
          message: `${job.customer_name} reassigned a job to you for ${job.required_date}.`,
          type: 'job_request',
          entityType: 'job',
          entityId: id
        });
      }
    }

    const worker = job.worker_id ? db.findById('workers', 'worker_id', job.worker_id) : null;

    // Handle Trust Metrics & Notifications based on transition
    if (status === JOB_STATUS.ACCEPTED) {
      if (worker) {
        db.update('workers', (w) => w.worker_id === worker.worker_id, {
          total_accepted_jobs: (worker.total_accepted_jobs || 0) + 1
        });
      }

      // Notify customer
      db.addNotification({
        userId: job.customer_id,
        title: `Job Accepted! 🎉`,
        message: `${job.worker_name || 'Worker'} accepted your request for ${job.required_date}. Click to connect and agree on exact time!`,
        type: 'job_accepted',
        entityType: 'job',
        entityId: id
      });

      db.addAuditLog({
        actorId: user.user_id,
        actorName: user.name,
        action: 'JOB_ACCEPTED',
        entityType: 'job',
        entityId: id,
        source: 'web'
      });
    }

    if (status === JOB_STATUS.REJECTED) {
      // Notify customer of rejection and offer alternatives
      db.addNotification({
        userId: job.customer_id,
        title: `Worker Unavailable`,
        message: `${job.worker_name || 'Worker'} was unavailable for ${job.required_date}. Similar nearby workers are ready to book.`,
        type: 'job_rejected',
        entityType: 'job',
        entityId: id
      });

      db.addAuditLog({
        actorId: user.user_id,
        actorName: user.name,
        action: 'JOB_REJECTED',
        entityType: 'job',
        entityId: id,
        source: 'web',
        metadata: { reason: rejection_reason }
      });
    }

    if (status === JOB_STATUS.COMPLETED) {
      if (worker) {
        const updatedMetrics = updateWorkerReliabilityOnCompletion(worker);
        db.update('workers', (w) => w.worker_id === worker.worker_id, updatedMetrics);
      }

      // Notify customer to submit rating
      db.addNotification({
        userId: job.customer_id,
        title: `Service Completed! ⭐`,
        message: `Your ${job.service_type} work is completed. Please rate and review ${job.worker_name} to help the community!`,
        type: 'job_completed',
        entityType: 'job',
        entityId: id
      });

      db.addAuditLog({
        actorId: user.user_id,
        actorName: user.name,
        action: 'JOB_COMPLETED',
        entityType: 'job',
        entityId: id,
        source: 'web'
      });
    }

    if (status === JOB_STATUS.CANCELLED) {
      if (worker && job.status === JOB_STATUS.ACCEPTED) {
        const updatedMetrics = updateWorkerReliabilityOnCancellation(worker);
        db.update('workers', (w) => w.worker_id === worker.worker_id, updatedMetrics);
      }

      db.addAuditLog({
        actorId: user.user_id,
        actorName: user.name,
        action: 'JOB_CANCELLED',
        entityType: 'job',
        entityId: id,
        source: 'web'
      });
    }

    db.update('jobs', (j) => j.job_id === id, updates);
    const updatedJob = db.findById('jobs', 'job_id', id);

    let alternatives = [];
    if (status === JOB_STATUS.REJECTED && updatedJob.worker_id) {
      const allWorkers = db.find('workers', (w) => w.account_status !== 'suspended');
      alternatives = getAlternativeWorkers(allWorkers, updatedJob.worker_id, {
        service: updatedJob.service_type,
        date: updatedJob.required_date,
        lat: updatedJob.latitude,
        lng: updatedJob.longitude
      });
    }

    return res.json({
      success: true,
      message: `Job status updated to ${status}`,
      data: {
        job: updatedJob,
        alternatives
      }
    });
  } catch (err) {
    next(err);
  }
}
