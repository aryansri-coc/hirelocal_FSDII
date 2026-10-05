const BASE_URL = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('hirelocal_token');
  const userId = localStorage.getItem('hirelocal_user_id');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (userId) {
    headers['x-user-id'] = userId;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Authentication (Section 3)
  sendOtp: (phone) =>
    apiRequest('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  signup: (payload) =>
    apiRequest('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () =>
    apiRequest('/auth/logout', { method: 'POST' }),
  getMe: () =>
    apiRequest('/auth/me'),
  updateProfile: (profileData) =>
    apiRequest('/auth/profile', { method: 'PATCH', body: JSON.stringify(profileData) }),
  getDemoAccounts: () =>
    apiRequest('/auth/demo-accounts'),

  // Services
  getServices: () => apiRequest('/services'),
  getServiceById: (id) => apiRequest(`/services/${id}`),

  // Workers & Onboarding (Section 6 & 7)
  getWorkers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/workers${query ? `?${query}` : ''}`);
  },
  getWorkerById: (id) => apiRequest(`/workers/${id}`),
  registerWorker: (workerData) =>
    apiRequest('/workers/register', { method: 'POST', body: JSON.stringify(workerData) }),
  matchWorkers: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/workers/match?${query}`);
  },
  getAlternatives: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/workers/alternatives?${query}`);
  },
  updateWorkerProfile: (id, updates) =>
    apiRequest(`/workers/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),

  // Jobs (Section 8 & 9)
  createJob: (jobData) =>
    apiRequest('/jobs', { method: 'POST', body: JSON.stringify(jobData) }),
  getMyJobs: () =>
    apiRequest('/jobs/my'),
  getJobById: (id) =>
    apiRequest(`/jobs/${id}`),
  updateJobStatus: (id, status, extra = {}) =>
    apiRequest(`/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...extra })
    }),

  // Ratings (Section 19)
  submitRating: (payload) =>
    apiRequest('/ratings', { method: 'POST', body: JSON.stringify(payload) }),
  getWorkerRatings: (workerId) =>
    apiRequest(`/ratings/worker/${workerId}`),

  // Notifications (Section 28)
  getNotifications: () =>
    apiRequest('/notifications'),
  markNotificationRead: (id) =>
    apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    apiRequest('/notifications/read-all', { method: 'POST' }),

  // CallBot (Section 25 & 29)
  startCallSession: (payload) =>
    apiRequest('/callbot/session/start', { method: 'POST', body: JSON.stringify(payload) }),
  processCallStep: (payload) =>
    apiRequest('/callbot/session/step', { method: 'POST', body: JSON.stringify(payload) }),
  getCallLogs: () =>
    apiRequest('/callbot/logs'),

  // Admin (Section 20 - 27)
  getAdminMetrics: () =>
    apiRequest('/admin/metrics'),
  getAdminUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users${query ? `?${query}` : ''}`);
  },
  updateUserStatus: (id, status) =>
    apiRequest(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getAdminWorkers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/workers${query ? `?${query}` : ''}`);
  },
  updateWorkerVerification: (id, verification_status) =>
    apiRequest(`/admin/workers/${id}/verification`, { method: 'PATCH', body: JSON.stringify({ verification_status }) }),
  getAdminJobs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/jobs${query ? `?${query}` : ''}`);
  },
  getAdminRatings: () =>
    apiRequest('/admin/ratings'),
  getAdminCallbot: () =>
    apiRequest('/admin/callbot'),
  getAdminAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/audit-logs${query ? `?${query}` : ''}`);
  },
  resetDatabase: () =>
    apiRequest('/admin/reset', { method: 'POST' }),

  // Pan-India Pincode API
  searchPincodes: (query) =>
    apiRequest(`/pincode/search/${encodeURIComponent(query)}`),
  getPincodeAddresses: (pincode) =>
    apiRequest(`/pincode/details/${encodeURIComponent(pincode)}`),
  getPincodeGeo: (pincode) =>
    apiRequest(`/pincode/geo/${encodeURIComponent(pincode)}`),
  reverseGeocode: (lat, lng) =>
    apiRequest(`/pincode/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`),
  getPopularPincodes: () =>
    apiRequest('/pincode/popular')
};
