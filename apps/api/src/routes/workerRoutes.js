import { Router } from 'express';
import {
  getAllWorkers,
  getWorkerById,
  matchEligibleWorkers,
  getWorkerAlternatives,
  registerAsWorker,
  updateWorkerProfile
} from '../controllers/workerController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/match', matchEligibleWorkers);
router.get('/alternatives', getWorkerAlternatives);
router.get('/', getAllWorkers);
router.get('/:id', getWorkerById);

router.post('/register', authenticate, registerAsWorker);
router.post('/profile', authenticate, registerAsWorker);
router.patch('/:id', authenticate, updateWorkerProfile);

export default router;
