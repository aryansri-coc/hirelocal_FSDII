/**
 * Input validation utility functions for HireLocal
 */

export function isValidIndianPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-\+]/g, '');
  // Matches 10-digit mobile number with optional country code 91 or 0
  const regex = /^(?:(?:\+|0{0,2})91)?[6-9]\d{9}$/;
  return regex.test(cleaned);
}

export function normalizePhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/[\s\-\+]/g, '');
  if (cleaned.length === 10) return cleaned;
  if (cleaned.startsWith('91') && cleaned.length === 12) return cleaned.slice(2);
  if (cleaned.startsWith('0') && cleaned.length === 11) return cleaned.slice(1);
  return cleaned;
}

export function validateWorkerProfile(data) {
  const errors = [];
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters.');
  }
  if (!data.profession || data.profession.trim().length < 2) {
    errors.push('Profession is required.');
  }
  if (data.experience === undefined || isNaN(Number(data.experience)) || Number(data.experience) < 0) {
    errors.push('Experience must be a positive number of years.');
  }
  if (!data.location || !data.location.name) {
    errors.push('Primary location area is required.');
  }
  if (data.daily_rate && (isNaN(Number(data.daily_rate)) || Number(data.daily_rate) <= 0)) {
    errors.push('Daily/service rate must be a valid positive amount.');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateJobCreation(data) {
  const errors = [];
  if (!data.service_type || data.service_type.trim().length === 0) {
    errors.push('Service type is required.');
  }
  if (!data.required_date) {
    errors.push('Required service date is required.');
  } else {
    const reqDate = new Date(data.required_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(reqDate.getTime())) {
      errors.push('Required date must be a valid date.');
    } else if (reqDate < today) {
      errors.push('Required date cannot be in the past.');
    }
  }
  if (!data.address || data.address.trim().length < 5) {
    errors.push('Full address/landmark must be at least 5 characters.');
  }
  if (!data.description || data.description.trim().length < 5) {
    errors.push('Problem description must be at least 5 characters.');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateRatingSubmission(data) {
  const errors = [];
  const ratingNum = Number(data.rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    errors.push('Rating must be an integer between 1 and 5.');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}
