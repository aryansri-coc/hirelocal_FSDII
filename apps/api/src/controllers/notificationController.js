import { db } from '../../../../database/db.js';

export async function getUserNotifications(req, res, next) {
  try {
    const userId = req.user.user_id;
    const notifications = db.find('notifications', (n) => String(n.user_id) === String(userId));
    notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const unreadCount = notifications.filter((n) => !n.read).length;

    return res.json({
      success: true,
      unread_count: unreadCount,
      count: notifications.length,
      data: notifications
    });
  } catch (err) {
    next(err);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    db.update('notifications', (n) => n.notification_id === id && String(n.user_id) === String(userId), {
      read: true
    });

    return res.json({
      success: true,
      message: 'Notification marked as read.'
    });
  } catch (err) {
    next(err);
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    const userId = req.user.user_id;

    db.update('notifications', (n) => String(n.user_id) === String(userId), {
      read: true
    });

    return res.json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (err) {
    next(err);
  }
}
