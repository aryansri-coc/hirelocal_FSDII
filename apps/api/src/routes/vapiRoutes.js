/**
 * Vapi AI Voice Assistant Routes
 * Endpoints for Vapi Function Tool: `ask_project_knowledge`
 */

import express from 'express';
import {
  handleVapiKnowledgeQuery,
  handleVapiWorkerRegistration,
  handleVapiBooking,
  getVapiIntegrationStatus
} from '../controllers/vapiController.js';

const router = express.Router();

/**
 * Security Middleware: Validates Vapi Secret if configured in .env
 */
function verifyVapiSecurity(req, res, next) {
  const configuredSecret = process.env.VAPI_SECRET;

  // If no secret configured in .env, allow requests (open for development / demo)
  if (!configuredSecret || !configuredSecret.trim()) {
    return next();
  }

  const headerSecret = req.headers['x-vapi-secret'];
  const authHeader = req.headers['authorization'];
  const querySecret = req.query.secret;

  let providedSecret = headerSecret || querySecret;
  if (!providedSecret && authHeader && authHeader.startsWith('Bearer ')) {
    providedSecret = authHeader.replace(/^Bearer\s+/i, '').trim();
  }

  if (providedSecret === configuredSecret.trim()) {
    return next();
  }

  return res.status(401).json({
    success: false,
    error: {
      message: 'Unauthorized: Invalid or missing Vapi secret token. Please check x-vapi-secret or Authorization header.'
    }
  });
}

// 1. Primary Vapi Function Tool Endpoint (Tool name: ask_project_knowledge)
router.post('/ask-project-knowledge', verifyVapiSecurity, handleVapiKnowledgeQuery);

// 2. Dedicated Worker Registration Endpoint (Tool name: register_worker_profile)
router.post('/register-worker', verifyVapiSecurity, handleVapiWorkerRegistration);

// 3. Dedicated Worker Booking Endpoint (Tool name: book_worker_service)
router.post('/book-worker', verifyVapiSecurity, handleVapiBooking);

// 4. Webhook Aliases for unified Vapi Assistant configuration
router.post('/webhook', verifyVapiSecurity, handleVapiKnowledgeQuery);
router.post('/', verifyVapiSecurity, handleVapiKnowledgeQuery);

// 3. Health & Diagnostics Check
router.get('/status', getVapiIntegrationStatus);
router.get('/health', getVapiIntegrationStatus);

export default router;

