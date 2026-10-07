import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      if (token === 'demo-token-soc-2026') {
        setUser({ name: 'Alex Vance (Lead Analyst)', email: 'analyst@soc-defense.io', role: 'Security Analyst' });
        setLoading(false);
        return;
      }
      api.get('/auth/profile')
        .then((res) => setUser(res.data))
        .catch(() => {
          // If offline or invalid, clear token
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data);
      return res.data;
    } catch (err) {
      // If backend offline or requested demo access:
      if (!err.response || email === 'demo@soc.io' || password === 'demo123') {
        const demoUser = { name: 'Alex Vance (Lead Analyst)', email: email || 'analyst@soc-defense.io', role: 'Security Analyst' };
        localStorage.setItem('token', 'demo-token-soc-2026');
        setUser(demoUser);
        return demoUser;
      }
      throw err;
    }
  };

  const loginDemo = async () => {
    return login('demo@soc.io', 'demo123');
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data);
    return res.data;
  };

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  }, []);

  const logout = useCallback(() => {
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
