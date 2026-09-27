import { db } from '../../../../database/db.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const customUserId = req.headers['x-user-id'];

  let userId = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    userId = token.startsWith('token_') ? token.replace('token_', '') : token;
  } else if (customUserId) {
    userId = customUserId;
  }

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required. Please sign in or provide authorization token.',
        code: 'UNAUTHORIZED'
      }
    });
  }

  const user = db.findById('users', 'user_id', userId);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid session or user not found. Please log in again.',
        code: 'USER_NOT_FOUND'
      }
    });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Your account has been suspended by administration.',
        code: 'ACCOUNT_SUSPENDED'
      }
    });
  }

  if (user.status === 'deactivated') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Your account has been deactivated.',
        code: 'ACCOUNT_DEACTIVATED'
      }
    });
  }

  req.user = user;

  // Always check if user has an associated worker profile
  const workerProfile = db.findById('workers', 'user_id', user.user_id);
  req.worker = workerProfile || null;

  next();
}

/**
 * Role-based authorization middleware
 * Note: Admin is always permitted for maintenance
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required.', code: 'UNAUTHORIZED' }
      });
    }

    if (req.user.role === 'admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    // If endpoint allows 'worker' and user has a worker profile attached
    if (allowedRoles.includes('worker') && req.worker) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
        code: 'FORBIDDEN'
      }
    });
  };
}
