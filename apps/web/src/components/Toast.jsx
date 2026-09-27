import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Toast() {
  const { toast } = useAuth();
  if (!toast) return null;

  const bgColors = {
    info: 'var(--primary)',
    success: 'var(--success)',
    danger: 'var(--error)'
  };

  const IconComp = toast.type === 'success' ? CheckCircle : toast.type === 'danger' ? AlertCircle : Info;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: bgColors[toast.type] || bgColors.info,
        color: '#FFFFFF',
        padding: '12px 18px',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 9999,
        fontSize: '14px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <IconComp size={18} />
      <span>{toast.message}</span>
    </div>
  );
}
