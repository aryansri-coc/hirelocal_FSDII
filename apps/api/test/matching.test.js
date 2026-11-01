import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest } from './testHelper.js';
import { matchWorkers, getAlternativeWorkers, calculateDistanceKm } from '../../../packages/services/matchingEngine.js';

describe('Deterministic Matching Engine & Proximity Calculator', () => {
  before(async () => {
    await startTestServer();
  });

  after(async () => {
    await stopTestServer();
  });

  test('calculateDistanceKm should compute accurate haversine distance', () => {
    // Distance between MP Nagar (23.2332, 77.4343) and Arera Colony (23.2100, 77.4330)
    const dist = calculateDistanceKm(23.2332, 77.4343, 23.2100, 77.4330);
    assert.ok(dist >= 2.0 && dist <= 3.5, `Expected ~2.6km, got ${dist}km`);
  });

  test('matchWorkers should deterministically rank eligible workers with score breakdown', () => {
    const mockWorkers = [
      {
        worker_id: 'w1',
        name: 'Worker A',
        profession: 'Electrician',
        rating: 4.8,
        reliability: 95,
        experience: 8,
        status: 'available',
        service_radius: 20,
        location: { lat: 23.2332, lng: 77.4343 }
      },
      {
        worker_id: 'w2',
        name: 'Worker B',
        profession: 'Electrician',
        rating: 3.5,
        reliability: 70,
        experience: 2,
        status: 'available',
        service_radius: 20,
        location: { lat: 23.2332, lng: 77.4343 }
      }
    ];

    const results = matchWorkers(mockWorkers, {
      service: 'Electrician',
      lat: 23.2332,
      lng: 77.4343
    });

    assert.equal(results.length, 2);
    assert.equal(results[0].worker_id, 'w1');
    assert.ok(results[0].match_score > results[1].match_score);
    assert.ok(results[0].score_breakdown.rating_score > 0);
    assert.ok(results[0].score_breakdown.reliability_score > 0);
  });

  test('getAlternativeWorkers should exclude currently chosen worker', () => {
    const mockWorkers = [
      { worker_id: 'w1', profession: 'Plumber', status: 'available' },
      { worker_id: 'w2', profession: 'Plumber', status: 'available' },
      { worker_id: 'w3', profession: 'Plumber', status: 'available' }
    ];

    const alternatives = getAlternativeWorkers(mockWorkers, 'w1', { service: 'Plumber' });
    assert.equal(alternatives.length, 2);
    assert.ok(!alternatives.some((w) => w.worker_id === 'w1'));
  });

  test('GET /api/workers/match should return ranked workers over HTTP', async () => {
    const res = await apiRequest('/api/workers/match?service=Electrician&lat=23.2332&lng=77.4343');

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.length > 0);
    assert.ok(res.data.data[0].match_score !== undefined);
  });

  test('GET /api/workers/alternatives should return alternatives for rejected worker', async () => {
    const listRes = await apiRequest('/api/workers?profession=Electrician');
    const workerId = listRes.data.data[0].worker_id;

    const res = await apiRequest(`/api/workers/alternatives?current_worker_id=${workerId}&service=Electrician`);

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(!res.data.data.some((w) => w.worker_id === workerId));
  });
});

