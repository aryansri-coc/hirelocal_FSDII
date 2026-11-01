import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest } from './testHelper.js';

describe('Workers & Onboarding API', () => {
  before(async () => {
    await startTestServer();
  });

  after(async () => {
    await stopTestServer();
  });

  test('GET /api/workers should return list of active workers', async () => {
    const res = await apiRequest('/api/workers');

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.length > 0);
  });

  test('GET /api/workers?profession=Electrician should filter by profession', async () => {
    const res = await apiRequest('/api/workers?profession=Electrician');

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(res.data.data.length > 0);
    for (const w of res.data.data) {
      assert.match(w.profession, /electrician/i);
    }
  });

  test('GET /api/workers?communication_type=non_smartphone should filter CallBot workers', async () => {
    const res = await apiRequest('/api/workers?communication_type=non_smartphone');

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(res.data.data.length > 0);
    for (const w of res.data.data) {
      assert.equal(w.communication_type, 'non_smartphone');
    }
  });

  test('POST /api/workers/register should onboard a new skilled worker', async () => {
    const phone = `97${Math.floor(10000000 + Math.random() * 90000000)}`;
    const res = await apiRequest('/api/workers/register', {
      method: 'POST',
      body: {
        name: 'Arun Carpenter',
        phone,
        profession: 'Carpenter',
        skills: ['Door Repair', 'Furniture Assembly', 'Modular Kitchen'],
        experience: 5,
        daily_rate: 650,
        city: 'Bhopal',
        pincode: '462016',
        communication_type: 'non_smartphone',
        languages: ['hi']
      }
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.ok(res.data.data.worker.worker_id);
    assert.equal(res.data.data.worker.profession, 'Carpenter');
    assert.equal(res.data.data.worker.communication_type, 'non_smartphone');
    assert.equal(res.data.data.worker.daily_rate, 650);
  });

  test('GET /api/workers/:id should return worker profile with reliability info', async () => {
    const listRes = await apiRequest('/api/workers');
    const workerId = listRes.data.data[0].worker_id;

    const res = await apiRequest(`/api/workers/${workerId}`);

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.worker_id, workerId);
    assert.ok(res.data.data.reliability_info);
    assert.ok(Array.isArray(res.data.data.ratings));
  });

  test('PATCH /api/workers/:id should update rate, availability, and working radius', async () => {
    // Login as a worker first
    const loginRes = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { phone: '9827011223', otp: '123456' } // Ramesh Kumar (wrk_1)
    });

    const token = loginRes.data.data.token;
    const workerId = loginRes.data.data.worker.worker_id;

    const res = await apiRequest(`/api/workers/${workerId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        daily_rate: 600,
        service_radius: 20,
        status: 'available'
      }
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.daily_rate, 600);
    assert.equal(res.data.data.service_radius, 20);
  });
});
