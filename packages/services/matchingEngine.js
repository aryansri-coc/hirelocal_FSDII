/**
 * Deterministic Worker Matching Engine
 * Implements Section 10 & 11 of the HireLocal Specification:
 * Match Score = w1·Rating + w2·Reliability + w3·Experience + w4·Availability + w5·Location Proximity
 */

import { DEFAULT_MATCHING_WEIGHTS } from '../shared/constants.js';

/**
 * Calculates Haversine distance in kilometers between two geo-coordinates
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 5.0; // Default fallback distance
  const R = 6371; // Earth radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Matches and ranks workers deterministically with explainable score breakdown.
 * @param {Array} workers - Array of all workers from the database
 * @param {Object} criteria - Search criteria { service, date, lat, lng, skill, maxDistanceKm }
 * @param {Object} customWeights - Optional weight overrides
 */
export function matchWorkers(workers, criteria, customWeights = {}) {
  const weights = { ...DEFAULT_MATCHING_WEIGHTS, ...customWeights };
  const { service, date, lat, lng, skill, maxDistanceKm = 30 } = criteria;

  // 1. HARD FILTERS
  const eligibleWorkers = workers.filter((worker) => {
    // Check status
    if (worker.status !== 'available' && worker.status !== 'busy') {
      return false;
    }

    // Check service / profession match
    if (service) {
      const matchService =
        worker.profession.toLowerCase().includes(service.toLowerCase()) ||
        (worker.services && worker.services.some((s) => s.toLowerCase().includes(service.toLowerCase())));
      if (!matchService) return false;
    }

    // Check specific skill if provided
    if (skill && worker.skills) {
      const hasSkill = worker.skills.some((s) => s.toLowerCase().includes(skill.toLowerCase()));
      if (!hasSkill) return false;
    }

    // Check distance / service radius
    const workerLat = worker.location?.lat;
    const workerLng = worker.location?.lng;
    if (lat && lng && workerLat && workerLng) {
      const dist = calculateDistanceKm(lat, lng, workerLat, workerLng);
      const allowedRadius = worker.service_radius || maxDistanceKm;
      if (dist > allowedRadius) return false;
    }

    // Check requested date availability (if worker has blackout/booked dates)
    if (date && worker.booked_dates && worker.booked_dates.includes(date)) {
      return false;
    }

    return true;
  });

  // 2. SCORING & RANKING
  const rankedWorkers = eligibleWorkers.map((worker) => {
    const workerLat = worker.location?.lat;
    const workerLng = worker.location?.lng;
    const distanceKm = lat && lng && workerLat && workerLng
      ? calculateDistanceKm(lat, lng, workerLat, workerLng)
      : (worker.distance_km || 3.5);

    // Normalized Components (0.0 to 1.0)
    // 1. Rating (0 to 5)
    const ratingNorm = (worker.rating || 4.0) / 5.0;

    // 2. Reliability (0 to 100, or 85% prior for neutral new workers)
    const reliabilityNorm = worker.reliability !== null && worker.reliability !== undefined
      ? worker.reliability / 100.0
      : 0.85;

    // 3. Experience (capped at 10 years for 1.0)
    const experienceNorm = Math.min((worker.experience || 0) / 10.0, 1.0);

    // 4. Availability
    const isBooked = date && worker.booked_dates && worker.booked_dates.includes(date);
    const availabilityNorm = isBooked ? 0.0 : 1.0;

    // 5. Proximity (1.0 is 0km, 0.0 is maxDistanceKm or beyond)
    const proximityNorm = Math.max(0.0, 1.0 - (distanceKm / maxDistanceKm));

    // Calculate final weighted score
    const totalScore =
      weights.rating * ratingNorm +
      weights.reliability * reliabilityNorm +
      weights.experience * experienceNorm +
      weights.availability * availabilityNorm +
      weights.locationProximity * proximityNorm;

    const matchPercentage = Math.round(totalScore * 100);

    return {
      ...worker,
      distance_km: distanceKm,
      match_score: matchPercentage,
      score_breakdown: {
        total: matchPercentage,
        rating_score: Math.round(weights.rating * ratingNorm * 100),
        reliability_score: Math.round(weights.reliability * reliabilityNorm * 100),
        experience_score: Math.round(weights.experience * experienceNorm * 100),
        availability_score: Math.round(weights.availability * availabilityNorm * 100),
        proximity_score: Math.round(weights.locationProximity * proximityNorm * 100)
      }
    };
  });

  // Sort descending by match score, secondary by rating, tertiary by completed jobs
  return rankedWorkers.sort((a, b) => {
    if (b.match_score !== a.match_score) {
      return b.match_score - a.match_score;
    }
    if ((b.rating || 0) !== (a.rating || 0)) {
      return (b.rating || 0) - (a.rating || 0);
    }
    return (b.completed_jobs || 0) - (a.completed_jobs || 0);
  });
}

/**
 * Returns alternative eligible workers when a chosen worker rejects or is unavailable.
 * Implements Section 11 of the specification.
 */
export function getAlternativeWorkers(allWorkers, currentWorkerId, jobCriteria) {
  const matches = matchWorkers(allWorkers, jobCriteria);
  return matches.filter((w) => String(w.worker_id) !== String(currentWorkerId));
}
