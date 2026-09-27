/**
 * Worker Reliability Calculator
 * Implements Section 7 of the HireLocal Specification:
 * Reliability Score = (Completed Accepted Jobs / Total Accepted Jobs) * 100
 * Handles neutral state for new workers ("New on HireLocal").
 */

import { RELIABILITY_MIN_JOBS_THRESHOLD } from '../shared/constants.js';

export function calculateWorkerReliability(completedAcceptedJobs = 0, totalAcceptedJobs = 0) {
  if (totalAcceptedJobs < RELIABILITY_MIN_JOBS_THRESHOLD) {
    return {
      score: null,
      isNewWorker: true,
      label: 'New on HireLocal',
      completedJobs: completedAcceptedJobs,
      totalAcceptedJobs
    };
  }

  const rawScore = (completedAcceptedJobs / totalAcceptedJobs) * 100;
  const score = Math.round(Math.min(100, Math.max(0, rawScore)));

  return {
    score,
    isNewWorker: false,
    label: `${score}% Reliability`,
    completedJobs: completedAcceptedJobs,
    totalAcceptedJobs
  };
}

export function updateWorkerReliabilityOnCompletion(worker) {
  const completed = (worker.completed_jobs || 0) + 1;
  const total = (worker.total_accepted_jobs || 0) + 1;
  const reliabilityObj = calculateWorkerReliability(completed, total);

  return {
    completed_jobs: completed,
    total_accepted_jobs: total,
    reliability: reliabilityObj.score
  };
}

export function updateWorkerReliabilityOnCancellation(worker) {
  // If worker cancels after accepting, total accepted increases but completed does not
  const completed = worker.completed_jobs || 0;
  const total = (worker.total_accepted_jobs || 0) + 1;
  const reliabilityObj = calculateWorkerReliability(completed, total);

  return {
    completed_jobs: completed,
    total_accepted_jobs: total,
    reliability: reliabilityObj.score
  };
}
