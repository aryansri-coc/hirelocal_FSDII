import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest } from './testHelper.js';
import { JOB_STATUS } from '../../../packages/shared/statusVocabulary.js';

describe('Day-Based Booking Lifecycle & Status Machine API', () => {
  let customerToken = '';
  let customerUser = null;
  let workerToken = '';
  let workerUser = null;
  let testJobId = '';

  before(async () => {
    await startTestServer();

    // Authenticate customer (Aakash Gupta)
    const custLogin = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { phone: '9876543210', otp: '123456' }
    });
    customerToken = custLogin.data.data.token;
    customerUser = custLogin.data.data.user;

    // Authenticate worker (Sunil Verma - wrk_4)
    const wrkLogin = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { phone: '9827044556', otp: '123456' }
    });
    workerToken = wrkLogin.data.data.token;
    workerUser = wrkLogin.data.data.user;
  });

  after(async () => {
    await stopTestServer();
  });

  test('POST /api/jobs should create a day-based booking', async () => {
    const res = await apiRequest('/api/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        worker_id: 'wrk_4',
        service_type: 'Electrician',
        address: 'Flat 102, Shanti Vihar, Bhopal',
        required_date: '2026-11-15',
        preferred_time: 'morning_9_12',
        description: 'Need inverter wiring inspection and battery terminal fix',
        estimated_cost: 500
      }
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.ok(res.data.data.job.job_id);
    assert.equal(res.data.data.job.status, JOB_STATUS.PENDING_WORKER_RESPONSE);
    testJobId = res.data.data.job.job_id;
  });

  test('POST /api/jobs should trigger CallBot outbound dispatch when worker is non-smartphone', async () => {
    const res = await apiRequest('/api/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        worker_id: 'wrk_3', // Mukesh Sharma is non-smartphone
        service_type: 'Electrician',
        address: 'BHEL Colony, Bhopal',
        required_date: '2026-11-16',
        preferred_time: 'afternoon_12_4',
        description: 'Ceiling fan humming sound and regulator repair',
        estimated_cost: 550
      }
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.ok(res.data.data.callbot);
    assert.equal(res.data.data.callbot.status, 'queued');
  });

  test('GET /api/jobs/my should list customer bookings', async () => {
    const res = await apiRequest('/api/jobs/my', {
      method: 'GET',
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.some((j) => j.job_id === testJobId));
  });

  test('GET /api/jobs/:id should return complete job details', async () => {
    const res = await apiRequest(`/api/jobs/${testJobId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.job_id, testJobId);
    assert.equal(res.data.data.service_type, 'Electrician');
  });

  test('PATCH /api/jobs/:id/status should allow assigned worker to accept the job', async () => {
    const res = await apiRequest(`/api/jobs/${testJobId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${workerToken}` },
      body: {
        status: JOB_STATUS.ACCEPTED
      }
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.job.status, JOB_STATUS.ACCEPTED);
  });

  test('PATCH /api/jobs/:id/status should allow completing the job', async () => {
    const res = await apiRequest(`/api/jobs/${testJobId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${workerToken}` },
      body: {
        status: JOB_STATUS.COMPLETED
      }
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.job.status, JOB_STATUS.COMPLETED);
  });

  test('PATCH /api/jobs/:id/status should reject completion with invalid OTP and accept valid OTP', async () => {
    const createRes = await apiRequest('/api/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        service_type: 'Plumber',
        required_date: '2026-11-15',
        preferred_time: 'morning_9_12',
        address: 'Sector 62, Mohali',
        description: 'Tap leakage'
      }
    });
    const newJobId = createRes.data.data.job.job_id;
    const completionOtp = createRes.data.data.job.completion_otp;
    assert.ok(completionOtp, 'Job must have a completion_otp generated');

    await apiRequest(`/api/jobs/${newJobId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${workerToken}` },
      body: { status: JOB_STATUS.ACCEPTED }
    });

    // 1. Invalid OTP
    const resBad = await apiRequest(`/api/jobs/${newJobId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        status: JOB_STATUS.COMPLETED,
        otp: '0000'
      }
    });
    assert.equal(resBad.status, 400);
    assert.ok(resBad.data.error.message.includes('Invalid Completion OTP'));

    // 2. Valid OTP
    const resGood = await apiRequest(`/api/jobs/${newJobId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        status: JOB_STATUS.COMPLETED,
        otp: completionOtp
      }
    });
    assert.equal(resGood.status, 200);
    assert.equal(resGood.data.success, true);
    assert.equal(resGood.data.data.job.status, JOB_STATUS.COMPLETED);
  });
});
