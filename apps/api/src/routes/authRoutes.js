import { Router } from 'express';
import {
  sendOtp,
  signup,
  login,
  verifyOtp,
  logout,
  getCurrentUser,
  updateProfile,
  getDemoAccounts
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/send-otp', sendOtp);
router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);
router.patch('/profile', authenticate, updateProfile);
router.get('/demo-accounts', getDemoAccounts);

export default router;
