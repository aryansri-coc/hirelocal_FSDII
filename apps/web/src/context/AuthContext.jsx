import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [worker, setWorker] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hirelocal_token') || null);
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Demo mode is FALSE by default as requested in Section 2!
  const [demoMode, setDemoMode] = useState(
    localStorage.getItem('hirelocal_demo_mode') === 'true'
  );

  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleDemoMode = () => {
    const newVal = !demoMode;
    setDemoMode(newVal);
    localStorage.setItem('hirelocal_demo_mode', String(newVal));
    showToast(newVal ? 'Demo Mode enabled (Persona Switcher visible)' : 'Demo Mode disabled (Real Production Experience)', 'info');
  };

  const loadNotifications = async () => {
    if (!localStorage.getItem('hirelocal_token')) return;
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.data);
        setUnreadNotifsCount(res.unread_count || 0);
      }
    } catch (err) {
      // ignore background notification failure
    }
  };

  const loadCurrentUser = async () => {
    const storedToken = localStorage.getItem('hirelocal_token');
    if (!storedToken) {
      setUser(null);
      setWorker(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success) {
        setUser(res.data.user);
        setWorker(res.data.worker);
        setUnreadNotifsCount(res.data.unread_notifications_count || 0);
      } else {
        logout(false);
      }
    } catch (err) {
      console.warn('Session verification failed, logging out:', err.message);
      logout(false);
    } finally {
      setLoading(false);
    }
  };

  const loadDemoAccounts = async () => {
    try {
      const res = await api.getDemoAccounts();
      if (res.success) {
        setDemoAccounts(res.data);
      }
    } catch (err) {
      console.error('Failed to load demo accounts', err);
    }
  };

  const login = async (phone, otp) => {
    try {
      const res = await api.login({ phone, otp });
      if (res.success) {
        const { token: newToken, user: newUser, worker: newWorker } = res.data;
        localStorage.setItem('hirelocal_token', newToken);
        localStorage.setItem('hirelocal_user_id', newUser.user_id);
        setToken(newToken);
        setUser(newUser);
        setWorker(newWorker || null);
        showToast(`Welcome back, ${newUser.name}!`, 'success');
        loadNotifications();
        return res.data;
      }
    } catch (err) {
      showToast(err.message || 'Login failed', 'danger');
      throw err;
    }
  };

  const signup = async (phone, name, email, role = 'customer', otp) => {
    try {
      const res = await api.signup({ phone, name, email, role, otp });
      if (res.success) {
        const { token: newToken, user: newUser } = res.data;
        localStorage.setItem('hirelocal_token', newToken);
        localStorage.setItem('hirelocal_user_id', newUser.user_id);
        setToken(newToken);
        setUser(newUser);
        setWorker(null);
        showToast(`Account created! Welcome, ${newUser.name}.`, 'success');
        loadNotifications();
        return res.data;
      }
    } catch (err) {
      showToast(err.message || 'Signup failed', 'danger');
      throw err;
    }
  };

  const logout = (notify = true) => {
    if (token) {
      api.logout().catch(() => {});
    }
    localStorage.removeItem('hirelocal_token');
    localStorage.removeItem('hirelocal_user_id');
    setUser(null);
    setWorker(null);
    setToken(null);
    setNotifications([]);
    setUnreadNotifsCount(0);
    if (notify) showToast('You have been signed out.', 'info');
  };

  // Demo Persona Switcher - preserved ONLY for DEMO_MODE (Section 2)
  const selectDemoAccount = (demoAcc) => {
    localStorage.setItem('hirelocal_token', demoAcc.token);
    localStorage.setItem('hirelocal_user_id', demoAcc.user_id);
    setToken(demoAcc.token);
    setUser({
      user_id: demoAcc.user_id,
      name: demoAcc.name,
      phone: demoAcc.phone,
      address: demoAcc.address,
      role: demoAcc.role
    });

    if (demoAcc.role === 'worker') {
      api.getWorkerById(demoAcc.worker_id).then((res) => {
        if (res.success) setWorker(res.data);
      }).catch(console.error);
    } else {
      setWorker(null);
    }

    showToast(`Switched persona to ${demoAcc.name} (${demoAcc.role.toUpperCase()})`, 'info');
    loadNotifications();
  };

  useEffect(() => {
    loadCurrentUser();
    loadDemoAccounts();
  }, []);

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        worker,
        token,
        isAuthenticated: !!user,
        demoMode,
        demoAccounts,
        loading,
        toast,
        notifications,
        unreadNotifsCount,
        showToast,
        toggleDemoMode,
        selectDemoAccount,
        login,
        signup,
        logout,
        refreshUser: loadCurrentUser,
        refreshNotifications: loadNotifications
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
