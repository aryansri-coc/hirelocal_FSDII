import { db } from '../../../../database/db.js';
import { isValidIndianPhone, normalizePhone } from '../../../../packages/validation/validators.js';
import { config } from '../config/env.js';

// In-memory OTP store for verification
const otpStore = new Map();

export async function sendOtp(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone || !isValidIndianPhone(phone)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please provide a valid 10-digit Indian mobile number.' }
      });
    }

    const cleanPhone = normalizePhone(phone);
    const otp = config.defaultDemoOtp || '123456';

    otpStore.set(cleanPhone, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    console.log(`[AUTH] Sent OTP ${otp} to phone ${cleanPhone}`);

    return res.json({
      success: true,
      message: `OTP sent to +91 ${cleanPhone}. (Use OTP: ${otp})`,
      data: {
        phone: cleanPhone,
        demoOtp: otp
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function signup(req, res, next) {
  try {
    const { phone, name, email, role = 'customer', otp } = req.body;

    if (!phone || !isValidIndianPhone(phone)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid 10-digit mobile number format.' }
      });
    }

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: { message: 'Full name must be at least 2 characters.' }
      });
    }

    const cleanPhone = normalizePhone(phone);
    const cached = otpStore.get(cleanPhone);
    const isDemoOverride = otp === '123456' || (cached && cached.otp === otp);

    if (!isDemoOverride) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid OTP code. Please enter 123456.' }
      });
    }

    // Check if user already exists
    const existing = db.findOne('users', (u) => normalizePhone(u.phone) === cleanPhone);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { message: 'An account with this mobile number already exists. Please log in instead.' }
      });
    }

    otpStore.delete(cleanPhone);

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newUser = {
      user_id: userId,
      name: name.trim(),
      phone: cleanPhone,
      email: email?.trim() || null,
      address: 'Bhopal, MP',
      role: role === 'worker' ? 'worker' : 'customer',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.insert('users', newUser);

    // Add Audit Log
    db.addAuditLog({
      actorId: userId,
      actorName: newUser.name,
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: userId,
      source: 'web',
      metadata: { role: newUser.role, phone: cleanPhone }
    });

    // Welcome Notification
    db.addNotification({
      userId,
      title: 'Welcome to HireLocal!',
      message: `Hello ${newUser.name}, your HireLocal account is active. Browse nearby skilled workers or create a day-based booking!`,
      type: 'info'
    });

    const token = `token_${userId}`;

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: {
        token,
        user: newUser,
        worker: null
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { phone, otp } = req.body;

    if (!phone || !isValidIndianPhone(phone)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please provide a valid 10-digit mobile number.' }
      });
    }

    const cleanPhone = normalizePhone(phone);
    const cached = otpStore.get(cleanPhone);
    const isDemoOverride = otp === '123456' || (cached && cached.otp === otp);

    if (!isDemoOverride) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid OTP code. Please enter 123456.' }
      });
    }

    otpStore.delete(cleanPhone);

    const user = db.findOne('users', (u) => normalizePhone(u.phone) === cleanPhone);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'No HireLocal account found with this phone number. Please click "Sign Up" to register.' }
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: { message: 'Your account has been suspended by administration. Please contact support.' }
      });
    }

    if (user.status === 'deactivated') {
      return res.status(403).json({
        success: false,
        error: { message: 'This account is deactivated.' }
      });
    }

    // Attach worker profile if exists
    const workerProfile = db.findById('workers', 'user_id', user.user_id);
    const token = `token_${user.user_id}`;

    // Add Audit Log
    db.addAuditLog({
      actorId: user.user_id,
      actorName: user.name,
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: user.user_id,
      source: 'web',
      metadata: { role: user.role }
    });

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      data: {
        token,
        user,
        worker: workerProfile
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req, res, next) {
  // Bridge method supporting either signup or login dynamically
  try {
    const { phone, otp, name, role = 'customer' } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: { message: 'Phone is required.' } });
    }

    const cleanPhone = normalizePhone(phone);
    const existing = db.findOne('users', (u) => normalizePhone(u.phone) === cleanPhone);

    if (existing) {
      return login(req, res, next);
    } else {
      return signup(req, res, next);
    }
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    if (req.user) {
      db.addAuditLog({
        actorId: req.user.user_id,
        actorName: req.user.name,
        action: 'USER_LOGOUT',
        entityType: 'user',
        entityId: req.user.user_id,
        source: 'web'
      });
    }
    return res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function getCurrentUser(req, res, next) {
  try {
    const notifications = db.find('notifications', (n) => String(n.user_id) === String(req.user.user_id));
    const unreadCount = notifications.filter((n) => !n.read).length;

    return res.json({
      success: true,
      data: {
        user: req.user,
        worker: req.worker || null,
        unread_notifications_count: unreadCount
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, email, address } = req.body;
    const userId = req.user.user_id;

    const updates = {};
    if (name && name.trim().length >= 2) updates.name = name.trim();
    if (email !== undefined) updates.email = email.trim();
    if (address !== undefined) updates.address = address.trim();

    db.update('users', (u) => u.user_id === userId, updates);

    // If user is also a worker, update worker name as well
    if (req.worker) {
      db.update('workers', (w) => w.worker_id === req.worker.worker_id, {
        name: updates.name || req.worker.name
      });
    }

    const updatedUser = db.findById('users', 'user_id', userId);
    const updatedWorker = db.findById('workers', 'user_id', userId);

    db.addAuditLog({
      actorId: userId,
      actorName: updatedUser.name,
      action: 'USER_PROFILE_UPDATED',
      entityType: 'user',
      entityId: userId,
      source: 'web',
      metadata: updates
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: updatedUser,
        worker: updatedWorker
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getDemoAccounts(req, res, next) {
  try {
    const users = db.getCollection('users');
    const workers = db.getCollection('workers');

    const demoProfiles = users.map((u) => {
      const worker = workers.find((w) => w.user_id === u.user_id);
      return {
        user_id: u.user_id,
        name: u.name,
        phone: u.phone,
        role: u.role,
        address: u.address,
        worker_id: worker ? worker.worker_id : null,
        profession: worker ? worker.profession : null,
        communication_type: worker ? worker.communication_type : null,
        token: `token_${u.user_id}`
      };
    });

    return res.json({
      success: true,
      data: demoProfiles
    });
  } catch (err) {
    next(err);
  }
}
