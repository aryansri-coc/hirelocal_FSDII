import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateWorkerReliability,
  updateWorkerReliabilityOnCompletion,
  updateWorkerReliabilityOnCancellation
} from '../../../packages/services/reliabilityCalculator.js';

describe('Worker Reliability Calculator Engine', () => {
  test('calculateWorkerReliability should return neutral state for workers with < 3 jobs', () => {
    const res1 = calculateWorkerReliability(0, 0);
    assert.equal(res1.isNewWorker, true);
    assert.equal(res1.score, null);
    assert.equal(res1.label, 'New on HireLocal');

    const res2 = calculateWorkerReliability(2, 2);
    assert.equal(res2.isNewWorker, true);
    assert.equal(res2.score, null);
  });

  test('calculateWorkerReliability should calculate percentage accurately for >= 3 jobs', () => {
    const res = calculateWorkerReliability(19, 20);
    assert.equal(res.isNewWorker, false);
    assert.equal(res.score, 95);
    assert.equal(res.label, '95% Reliability');
  });

  test('updateWorkerReliabilityOnCompletion should increment both completed and total accepted jobs', () => {
    const worker = {
      completed_jobs: 4,
      total_accepted_jobs: 5
    };

    const updated = updateWorkerReliabilityOnCompletion(worker);
    assert.equal(updated.completed_jobs, 5);
    assert.equal(updated.total_accepted_jobs, 6);
    assert.equal(updated.reliability, 83); // 5/6 = 83.33% -> 83%
  });

  test('updateWorkerReliabilityOnCancellation should increment total accepted jobs but NOT completed jobs', () => {
    const worker = {
      completed_jobs: 5,
      total_accepted_jobs: 5
    };

    const updated = updateWorkerReliabilityOnCancellation(worker);
    assert.equal(updated.completed_jobs, 5);
    assert.equal(updated.total_accepted_jobs, 6);
    assert.equal(updated.reliability, 83); // 5/6 -> drops from 100% to 83%
  });
});

