import { Router } from 'express';
import {
  getAdminMetrics,
  getAdminUsers,
  updateUserStatus,
  getAdminWorkers,
  updateWorkerVerification,
  getAdminJobs,
  getAdminRatings,
  getAdminCallbot,
  getAdminAuditLogs,
  resetDatabase
} from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/metrics', getAdminMetrics);
router.get('/users', getAdminUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/workers', getAdminWorkers);
router.patch('/workers/:id/verification', updateWorkerVerification);
router.get('/jobs', getAdminJobs);
router.get('/ratings', getAdminRatings);
router.get('/callbot', getAdminCallbot);
router.get('/audit-logs', getAdminAuditLogs);
router.post('/reset', resetDatabase);

export default router;
