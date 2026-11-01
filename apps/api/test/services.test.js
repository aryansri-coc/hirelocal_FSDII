import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest } from './testHelper.js';

describe('Service Categories API', () => {
  before(async () => {
    await startTestServer();
  });

  after(async () => {
    await stopTestServer();
  });

  test('GET /api/services should return all active service categories', async () => {
    const res = await apiRequest('/api/services');

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.length >= 5);

    const slugs = res.data.data.map((s) => s.slug);
    assert.ok(slugs.includes('electrician'));
    assert.ok(slugs.includes('plumber'));
    assert.ok(slugs.includes('ac-repair'));
  });

  test('GET /api/services/:id should return details of a specific service', async () => {
    const res = await apiRequest('/api/services/srv_elec');

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.service_id, 'srv_elec');
    assert.equal(res.data.data.name, 'Electrician');
  });

  test('GET /api/services/:id should return 404 for nonexistent category', async () => {
    const res = await apiRequest('/api/services/srv_unknown_999');

    assert.equal(res.status, 404);
    assert.equal(res.data.success, false);
  });
});

