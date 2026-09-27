import { db } from '../../../../database/db.js';

export async function getAdminMetrics(req, res, next) {
  try {
    const users = db.getCollection('users');
    const workers = db.getCollection('workers');
    const jobs = db.getCollection('jobs');
    const ratings = db.getCollection('ratings');
    const callLogs = db.getCollection('call_logs');

    const smartphoneWorkers = workers.filter((w) => w.communication_type === 'smartphone').length;
    const nonSmartphoneWorkers = workers.filter((w) => w.communication_type === 'non_smartphone').length;

    const completedJobs = jobs.filter((j) => j.status === 'COMPLETED').length;
    const activeJobs = jobs.filter((j) => ['ACCEPTED', 'CUSTOMER_AND_WORKER_CONNECTED', 'IN_PROGRESS'].includes(j.status)).length;
    const pendingJobs = jobs.filter((j) => ['REQUESTED', 'PENDING_WORKER_RESPONSE'].includes(j.status)).length;
    const cancelledJobs = jobs.filter((j) => ['CANCELLED', 'REJECTED'].includes(j.status)).length;

    const completionRate = jobs.length > 0 ? Math.round((completedJobs / jobs.length) * 100) : 100;

    const avgRating = ratings.length > 0
      ? Math.round((ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length) * 10) / 10
      : 5.0;

    return res.json({
      success: true,
      data: {
        total_users: users.length,
        total_customers: users.filter((u) => u.role === 'customer').length,
        total_workers: workers.length,
        verified_workers: workers.filter((w) => w.verification_status === 'verified').length,
        pending_workers: workers.filter((w) => w.verification_status === 'pending').length,
        smartphone_workers: smartphoneWorkers,
        non_smartphone_workers: nonSmartphoneWorkers,
        total_jobs: jobs.length,
        active_jobs: activeJobs,
        pending_jobs: pendingJobs,
        completed_jobs: completedJobs,
        cancelled_jobs: cancelledJobs,
        completion_rate: completionRate,
        total_ratings: ratings.length,
        average_rating: avgRating,
        total_callbot_calls: callLogs.length
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminUsers(req, res, next) {
  try {
    const { search, role, status } = req.query;
    let users = db.getCollection('users');

    if (role) users = users.filter((u) => u.role === role);
    if (status) users = users.filter((u) => (u.status || 'active') === status);
    if (search) {
      const q = search.toLowerCase();
      users = users.filter((u) => u.name.toLowerCase().includes(q) || u.phone.includes(q));
    }

    users.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'deactivated'].includes(status)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid status' } });
    }

    db.update('users', (u) => u.user_id === id, { status });

    db.addAuditLog({
      actorId: req.user.user_id,
      actorName: req.user.name,
      action: status === 'suspended' ? 'ACCOUNT_SUSPENDED' : 'USER_STATUS_UPDATED',
      entityType: 'user',
      entityId: id,
      source: 'web',
      metadata: { new_status: status }
    });

    return res.json({
      success: true,
      message: `User status updated to ${status}`
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminWorkers(req, res, next) {
  try {
    const { search, verification_status, communication_type } = req.query;
    let workers = db.getCollection('workers');

    if (verification_status) workers = workers.filter((w) => (w.verification_status || 'verified') === verification_status);
    if (communication_type) workers = workers.filter((w) => w.communication_type === communication_type);
    if (search) {
      const q = search.toLowerCase();
      workers = workers.filter((w) => w.name.toLowerCase().includes(q) || w.profession.toLowerCase().includes(q));
    }

    workers.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return res.json({
      success: true,
      count: workers.length,
      data: workers
    });
  } catch (err) {
    next(err);
  }
}

export async function updateWorkerVerification(req, res, next) {
  try {
    const { id } = req.params;
    const { verification_status } = req.body;

    if (!['pending', 'verified', 'rejected', 'suspended'].includes(verification_status)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid verification status' } });
    }

    db.update('workers', (w) => w.worker_id === id, {
      verification_status,
      account_status: verification_status === 'suspended' ? 'suspended' : 'active'
    });

    db.addAuditLog({
      actorId: req.user.user_id,
      actorName: req.user.name,
      action: verification_status === 'verified' ? 'WORKER_VERIFIED' : 'WORKER_SUSPENDED',
      entityType: 'worker',
      entityId: id,
      source: 'web',
      metadata: { verification_status }
    });

    return res.json({
      success: true,
      message: `Worker verification status updated to ${verification_status}`
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminJobs(req, res, next) {
  try {
    const { status, service, search } = req.query;
    let jobs = db.getCollection('jobs');

    if (status) jobs = jobs.filter((j) => j.status === status);
    if (service) jobs = jobs.filter((j) => j.service_type.toLowerCase().includes(service.toLowerCase()));
    if (search) {
      const q = search.toLowerCase();
      jobs = jobs.filter((j) =>
        j.job_id.toLowerCase().includes(q) ||
        (j.customer_name && j.customer_name.toLowerCase().includes(q)) ||
        (j.worker_name && j.worker_name.toLowerCase().includes(q)) ||
        j.description.toLowerCase().includes(q)
      );
    }

    jobs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminRatings(req, res, next) {
  try {
    let ratings = db.getCollection('ratings');
    ratings.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return res.json({
      success: true,
      count: ratings.length,
      data: ratings
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminCallbot(req, res, next) {
  try {
    const logs = db.getCollection('call_logs');
    logs.sort((a, b) => new Date(b.start_time || 0) - new Date(a.start_time || 0));

    const total = logs.length;
    const accepted = logs.filter((l) => l.response === 'ACCEPTED').length;
    const rejected = logs.filter((l) => l.response === 'REJECTED').length;
    const completed = logs.filter((l) => l.status === 'completed').length;
    const failed = logs.filter((l) => l.status === 'failed').length;

    const avgDuration = total > 0
      ? Math.round(logs.reduce((acc, l) => acc + (l.duration || 0), 0) / total)
      : 0;

    return res.json({
      success: true,
      metrics: {
        total_calls: total,
        successful_calls: completed,
        failed_calls: failed,
        accepted_jobs: accepted,
        rejected_jobs: rejected,
        average_call_duration_seconds: avgDuration
      },
      logs
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminAuditLogs(req, res, next) {
  try {
    const { action, search } = req.query;
    let logs = db.getCollection('audit_logs');

    if (action) logs = logs.filter((l) => l.action === action);
    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter((l) =>
        (l.actor_name && l.actor_name.toLowerCase().includes(q)) ||
        l.action.toLowerCase().includes(q) ||
        (l.metadata && l.metadata.toLowerCase().includes(q))
      );
    }

    logs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    return res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    next(err);
  }
}

export async function resetDatabase(req, res, next) {
  try {
    const result = db.resetToSeed();
    return res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
}
