import { Router } from 'express';
import { createJob, getMyJobs, getJobById, updateJobStatus } from '../controllers/jobController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.post('/', createJob);
router.get('/my', getMyJobs);
router.get('/:id', getJobById);
router.patch('/:id/status', updateJobStatus);

export default router;
