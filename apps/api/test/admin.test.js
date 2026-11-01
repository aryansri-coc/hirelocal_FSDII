import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest } from './testHelper.js';

describe('Admin Control Center, Auditing & Metrics API', () => {
  let adminToken = '';

  before(async () => {
    await startTestServer();

    // Authenticate admin (Admin Officer)
    const adminLogin = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { phone: '9999999999', otp: '123456' }
    });
    adminToken = adminLogin.data.data.token;
  });

  after(async () => {
    await stopTestServer();
  });

  test('GET /api/admin/metrics should calculate real marketplace health metrics', async () => {
    const res = await apiRequest('/api/admin/metrics', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(res.data.data.total_users > 0);
    assert.ok(res.data.data.total_workers > 0);
    assert.ok(res.data.data.smartphone_workers >= 0);
    assert.ok(res.data.data.non_smartphone_workers >= 0);
    assert.ok(typeof res.data.data.completion_rate === 'number');
  });

  test('GET /api/admin/users should list registered marketplace users', async () => {
    const res = await apiRequest('/api/admin/users', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.length > 0);
  });

  test('PATCH /api/admin/workers/:id/verification should update worker verification status', async () => {
    const res = await apiRequest('/api/admin/workers/wrk_1/verification', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { verification_status: 'verified' }
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.verification_status, 'verified');
  });

  test('GET /api/admin/audit-logs should return immutable audit logs', async () => {
    const res = await apiRequest('/api/admin/audit-logs', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.length > 0);
  });

  test('POST /api/admin/reset should successfully reseed database to demo state', async () => {
    const res = await apiRequest('/api/admin/reset', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
  });
});
