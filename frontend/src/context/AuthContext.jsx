import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const DEMO_OPERATOR = {
  _id: '6ab0f8ed5759298d12e665e6',
  name: 'Alex Vance (Lead Analyst)',
  email: 'demo@soc.io',
  role: 'admin',
  roleTitle: 'Security Analyst / SOC Lead',
  department: 'Computer Science & Engineering',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      if (token === 'demo-token-soc-2026') {
        setUser(DEMO_OPERATOR);
        setLoading(false);
        return;
      }
      api.get('/auth/profile')
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setUser(null);
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    sessionStorage.removeItem('soc_logged_out');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data);
      return res.data;
    } catch (err) {
      // If backend is offline (no network response) and using demo credentials:
      if (!err.response && (email === 'demo@soc.io' || password === 'demo123')) {
        localStorage.setItem('token', 'demo-token-soc-2026');
        setUser(DEMO_OPERATOR);
        return DEMO_OPERATOR;
      }
      throw err;
    }
  };

  const loginDemo = async () => {
    sessionStorage.removeItem('soc_logged_out');
    try {
      const res = await api.post('/auth/login', { email: 'demo@soc.io', password: 'demo123' });
      localStorage.setItem('token', res.data.token);
      setUser(res.data);
      return res.data;
    } catch (err) {
      if (!err.response) {
        localStorage.setItem('token', 'demo-token-soc-2026');
        setUser(DEMO_OPERATOR);
        return DEMO_OPERATOR;
      }
      throw err;
    }
  };

  const register = async (name, email, password) => {
    sessionStorage.removeItem('soc_logged_out');
    const res = await api.post('/auth/register', { name, email, password });
    // Account is pending administrator approval - do not automatically log in or store token
    return res.data;
  };

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  }, []);

  const logout = useCallback(() => {
    sessionStorage.setItem('soc_logged_out', 'true');
    localStorage.removeItem('token');
    localStorage.removeItem('soc_user_profile');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginDemo, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
