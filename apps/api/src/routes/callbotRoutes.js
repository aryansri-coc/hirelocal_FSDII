import { Router } from 'express';
import {
  startCallSession,
  processCallStep,
  telephonyWebhook,
  getCallLogs,
  getBhashiniStatus,
  bhashiniTts,
  bhashiniAsr,
  bhashiniTranslate
} from '../controllers/callbotController.js';

const router = Router();

router.post('/session/start', startCallSession);
router.post('/session/step', processCallStep);
router.post('/webhook', telephonyWebhook);
router.get('/logs', getCallLogs);

// Bhashini AI (MeitY Government of India) Endpoints
router.get('/bhashini/status', getBhashiniStatus);
router.post('/bhashini/tts', bhashiniTts);
router.post('/bhashini/asr', bhashiniAsr);
router.post('/bhashini/translate', bhashiniTranslate);

export default router;

