# HireLocal REST API Specification

### Authentication
- `POST /api/auth/send-otp`: Sends phone OTP (demo default: `123456`).
- `POST /api/auth/verify-otp`: Validates OTP and returns JWT/session token + user & worker profiles.
- `GET /api/auth/me`: Retrieves currently authenticated user & worker record.
- `GET /api/auth/demo-accounts`: Lists pre-seeded personas for 1-click role switching.

### Services
- `GET /api/services`: Returns all active service categories (AC Repair, Electrician, Plumber, etc.).
- `GET /api/services/:id`: Returns details for a specific service category.

### Workers
- `GET /api/workers`: Returns all active workers with query filters (`profession`, `status`, `communication_type`, `search`).
- `GET /api/workers/:id`: Returns detailed worker profile including calculated reliability and customer reviews.
- `GET /api/workers/match`: Deterministic ranking engine evaluating rating, reliability, experience, availability, and geo-distance.
- `GET /api/workers/alternatives`: Returns instant alternative suggestions excluding a specified worker ID.
- `PATCH /api/workers/:id`: Updates worker profile (rate, availability status, skills, communication channel).

### Jobs (Day-Based Booking Lifecycle)
- `POST /api/jobs`: Creates day-based booking request. If worker is non-smartphone, triggers CallBot dispatch.
- `GET /api/jobs/my`: Lists bookings for current user (filtered by customer or worker context).
- `GET /api/jobs/:id`: Fetches complete job details, status, rating, and alternatives if rejected.
- `PATCH /api/jobs/:id/status`: Advances job status through:
  `REQUESTED` → `PENDING_WORKER_RESPONSE` → `ACCEPTED` → `CUSTOMER_AND_WORKER_CONNECTED` → `IN_PROGRESS` → `COMPLETED` (or `REJECTED`, `CANCELLED`).
  Automatically recalculates worker reliability on completion/cancellation!

### Ratings
- `POST /api/ratings`: Submits star rating (1-5) and review text for a completed job.
- `GET /api/ratings/worker/:id`: Lists customer reviews for a given worker.

### AI CallBot
- `POST /api/callbot/session/start`: Initiates outbound telephony session for worker job dispatch or voice registration.
- `POST /api/callbot/session/step`: Processes voice speech transcription or DTMF keypad digit and advances the dialogue state machine.
- `POST /api/callbot/webhook`: Telephony provider webhook (Twilio / Exotel compliant).
- `GET /api/callbot/logs`: Returns telephony call records and outcome logs.

### Admin
- `GET /api/admin/metrics`: Returns marketplace health metrics (smartphone vs non-smartphone ratio, completion rates, rating averages).
- `POST /api/admin/reset`: Reseeds database back to clean demo state.
