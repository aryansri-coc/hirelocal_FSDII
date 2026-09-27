import { Router } from 'express';
import {
  startCallSession,
  processCallStep,
  telephonyWebhook,
  getCallLogs
} from '../controllers/callbotController.js';

const router = Router();

router.post('/session/start', startCallSession);
router.post('/session/step', processCallStep);
router.post('/webhook', telephonyWebhook);
router.get('/logs', getCallLogs);

export default router;
