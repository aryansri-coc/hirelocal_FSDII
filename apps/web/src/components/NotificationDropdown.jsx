import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Bell, Check, Clock } from 'lucide-react';

export default function NotificationDropdown({ onSelectNotification }) {
  const { notifications, unreadNotifsCount, refreshNotifications } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = async (notif) => {
    try {
      if (!notif.read) {
        await api.markNotificationRead(notif.notification_id);
        refreshNotifications();
      }
      setIsOpen(false);
      if (onSelectNotification) onSelectNotification(notif);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        style={{ position: 'relative', padding: '8px 10px' }}
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <Bell size={16} />
        {unreadNotifsCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            backgroundColor: 'var(--error)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-pill)',
            fontSize: '10px',
            fontWeight: 700,
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unreadNotifsCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="card" style={{
          position: 'absolute',
          top: '44px',
          right: 0,
          width: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 1000,
          padding: '16px',
          boxShadow: 'var(--shadow-lg)',
          backgroundColor: 'var(--surface)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700 }}>
              Notifications ({notifications.length})
            </span>
            {unreadNotifsCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
              No notifications yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map((notif) => (
                <div
                  key={notif.notification_id}
                  onClick={() => handleItemClick(notif)}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: notif.read ? 'transparent' : 'var(--primary-light)',
                    border: `1px solid ${notif.read ? 'var(--border)' : '#BFDBFE'}`,
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  <div style={{
                    fontWeight: notif.read ? 600 : 700,
                    color: notif.read ? 'var(--text-main)' : 'var(--primary)',
                    marginBottom: '2px'
                  }}>
                    {notif.title}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4, fontSize: '12px' }}>
                    {notif.message}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
