import { db } from '../../../../database/db.js';
import { validateRatingSubmission } from '../../../../packages/validation/validators.js';
import { JOB_STATUS } from '../../../../packages/shared/statusVocabulary.js';

export async function submitRating(req, res, next) {
  try {
    const customer = req.user;
    const { job_id, rating, review } = req.body;

    const validation = validateRatingSubmission({ rating });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: { message: validation.errors.join(' ') }
      });
    }

    const job = db.findById('jobs', 'job_id', job_id);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: { message: 'Job not found.' }
      });
    }

    // Ownership check (Section 15 & 19): Customer must be the owner of the job
    if (String(job.customer_id) !== String(customer.user_id) && customer.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only the customer who booked this job can submit a rating.' }
      });
    }

    if (job.status !== JOB_STATUS.COMPLETED) {
      return res.status(400).json({
        success: false,
        error: { message: 'Ratings can only be submitted for completed jobs.' }
      });
    }

    const existing = db.findOne('ratings', (r) => r.job_id === job_id);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { message: 'This job has already been rated and reviewed.' }
      });
    }

    const ratingId = `rat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRating = {
      rating_id: ratingId,
      job_id,
      customer_id: customer.user_id,
      customer_name: customer.name,
      worker_id: job.worker_id,
      rating: Number(rating),
      review: review?.trim() || '',
      moderation_status: 'approved',
      created_at: new Date().toISOString()
    };

    db.insert('ratings', newRating);

    // Recalculate worker average rating
    const workerRatings = db.find('ratings', (r) => r.worker_id === job.worker_id && r.moderation_status === 'approved');
    const sum = workerRatings.reduce((acc, r) => acc + r.rating, 0);
    const avg = Math.round((sum / workerRatings.length) * 10) / 10;

    db.update('workers', (w) => w.worker_id === job.worker_id, {
      rating: avg
    });

    // Notify worker
    const worker = db.findById('workers', 'worker_id', job.worker_id);
    if (worker) {
      db.addNotification({
        userId: worker.user_id,
        title: `New Rating Received: ${rating} Stars! ⭐`,
        message: `${customer.name} reviewed your work: "${review || 'Great service!'}"`,
        type: 'rating_received',
        entityType: 'rating',
        entityId: ratingId
      });
    }

    // Audit log
    db.addAuditLog({
      actorId: customer.user_id,
      actorName: customer.name,
      action: 'RATING_SUBMITTED',
      entityType: 'rating',
      entityId: ratingId,
      source: 'web',
      metadata: { rating: Number(rating), worker_id: job.worker_id, job_id }
    });

    return res.status(201).json({
      success: true,
      message: 'Rating and review submitted successfully.',
      data: {
        rating: newRating,
        worker_new_average: avg
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getWorkerRatings(req, res, next) {
  try {
    const { id } = req.params;
    const ratings = db.find('ratings', (r) => String(r.worker_id) === String(id) && r.moderation_status !== 'hidden');
    ratings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({
      success: true,
      count: ratings.length,
      data: ratings
    });
  } catch (err) {
    next(err);
  }
}
