import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest } from './testHelper.js';
import { JOB_STATUS } from '../../../packages/shared/statusVocabulary.js';

describe('Ratings, Reviews & Reputation Management API', () => {
  let customerToken = '';
  let completedJobId = '';
  let assignedWorkerId = 'wrk_4';

  before(async () => {
    await startTestServer();

    // Authenticate customer
    const custLogin = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { phone: '9876543210', otp: '123456' }
    });
    customerToken = custLogin.data.data.token;

    // Authenticate worker (Sunil Verma - wrk_4)
    const wrkLogin = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { phone: '9827044556', otp: '123456' }
    });
    const workerToken = wrkLogin.data.data.token;

    // Create and complete a job to test rating
    const jobRes = await apiRequest('/api/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        worker_id: assignedWorkerId,
        service_type: 'Electrician',
        address: 'Arera Colony, Bhopal',
        required_date: '2026-11-10',
        description: 'Complete wiring test',
        estimated_cost: 500
      }
    });
    completedJobId = jobRes.data.data.job.job_id;

    // Accept & complete job
    await apiRequest(`/api/jobs/${completedJobId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${workerToken}` },
      body: { status: JOB_STATUS.ACCEPTED }
    });
    await apiRequest(`/api/jobs/${completedJobId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${workerToken}` },
      body: { status: JOB_STATUS.COMPLETED }
    });
  });

  after(async () => {
    await stopTestServer();
  });

  test('POST /api/ratings should submit star rating and review for completed job', async () => {
    const res = await apiRequest('/api/ratings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        job_id: completedJobId,
        rating: 5,
        review: 'Excellent work! Punctual, neat wiring, and very courteous.'
      }
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.ok(res.data.data.rating.rating_id);
    assert.equal(res.data.data.rating.rating, 5);
  });

  test('POST /api/ratings should reject duplicate ratings on same job', async () => {
    const res = await apiRequest('/api/ratings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        job_id: completedJobId,
        rating: 4,
        review: 'Duplicate test'
      }
    });

    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
    assert.match(res.data.error.message, /already been rated/i);
  });

  test('GET /api/ratings/worker/:id should list reviews for the worker', async () => {
    const res = await apiRequest(`/api/ratings/worker/${assignedWorkerId}`);

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.some((r) => r.job_id === completedJobId));
  });
});
