import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest } from './testHelper.js';

describe('Authentication & User Management API', () => {
  before(async () => {
    await startTestServer();
  });

  after(async () => {
    await stopTestServer();
  });

  test('POST /api/auth/send-otp should send OTP for valid Indian mobile number', async () => {
    const res = await apiRequest('/api/auth/send-otp', {
      method: 'POST',
      body: { phone: '9876543210' }
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.phone, '9876543210');
    assert.equal(res.data.data.demoOtp, '123456');
  });

  test('POST /api/auth/send-otp should reject invalid phone numbers', async () => {
    const res = await apiRequest('/api/auth/send-otp', {
      method: 'POST',
      body: { phone: '12345' }
    });

    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
    assert.match(res.data.error.message, /valid 10-digit/i);
  });

  test('POST /api/auth/signup should create a new user account', async () => {
    const randomPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const res = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: {
        phone: randomPhone,
        name: 'Test Customer',
        email: 'test@example.com',
        role: 'customer',
        otp: '123456'
      }
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.ok(res.data.data.token);
    assert.equal(res.data.data.user.name, 'Test Customer');
    assert.equal(res.data.data.user.role, 'customer');
  });

  test('POST /api/auth/login should authenticate an existing user with demo OTP', async () => {
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: {
        phone: '9876543210',
        otp: '123456'
      }
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(res.data.data.token);
    assert.equal(res.data.data.user.phone, '9876543210');
  });

  test('GET /api/auth/me should return current user profile with valid token', async () => {
    const loginRes = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: {
        phone: '9876543210',
        otp: '123456'
      }
    });

    const token = loginRes.data.data.token;
    const res = await apiRequest('/api/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.user.phone, '9876543210');
  });

  test('GET /api/auth/demo-accounts should return seeded personas', async () => {
    const res = await apiRequest('/api/auth/demo-accounts');

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.length > 0);
  });
});

