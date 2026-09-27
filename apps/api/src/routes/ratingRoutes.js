import { Router } from 'express';
import { submitRating, getWorkerRatings } from '../controllers/ratingController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authenticate, submitRating);
router.get('/worker/:id', getWorkerRatings);

export default router;
