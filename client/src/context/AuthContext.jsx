import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import api from '../services/api.js';

const AuthContext = createContext(null);
const unwrap = (res) => res?.data?.data ?? res?.data;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => localStorage.getItem('vaultic_token') || sessionStorage.getItem('vaultic_token')
  );
  const [loading, setLoading] = useState(true);

  const applyToken = (t, remember = true) => {
    if (t) {
      localStorage.removeItem('vaultic_token');
      sessionStorage.removeItem('vaultic_token');
      (remember ? localStorage : sessionStorage).setItem('vaultic_token', t);
      axios.defaults.headers.common.Authorization = `Bearer ${t}`;
    } else {
      localStorage.removeItem('vaultic_token');
      sessionStorage.removeItem('vaultic_token');
      delete axios.defaults.headers.common.Authorization;
    }
  };

  const fetchMe = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(unwrap(res) || null);
    } catch {
      setUser(null);
      setToken(null);
      applyToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      applyToken(token);
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [token, fetchMe]);

  const login = async (email, password, remember = true) => {
    const res = await api.post('/auth/login', { email, password });
    const payload = unwrap(res) || {};
    if (payload.token) {
      setToken(payload.token);
      applyToken(payload.token, remember);
    }
    setUser(payload.user || null);
    return payload.user;
  };

  const register = async (form) => {
    const res = await api.post('/auth/signup', form);
    const payload = unwrap(res) || {};
    if (payload.token) {
      setToken(payload.token);
      applyToken(payload.token);
    }
    if (payload.user) setUser(payload.user);
    return payload;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    applyToken(null);
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refresh: fetchMe }),
    [user, token, loading, fetchMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
