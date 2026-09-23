import React, { createContext, useState, useContext, useEffect } from 'react';
import { message } from 'antd';
import { AUTH_STORAGE_KEY, SESSION_EXPIRED_EVENT } from '../api/axiosInstance';

// 1. Başhekimi (Context) Yaratıyoruz
const AuthContext = createContext(null);

// Sayfa yenilendiğinde localStorage'daki oturumu geri yükle
const loadStoredUser = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

// 2. Sistemi Saracak Olan Sağlayıcı (Provider)
export const AuthProvider = ({ children }) => {
  // Kullanıcının kimliğini ve rolünü burada tutuyoruz
  const [user, setUser] = useState(loadStoredUser);

  // Giriş Yapma Fonksiyonu (Senaryo tabanlı rol ataması)
  const login = (userData, role) => {
    // userData: Kimlik bilgileri, role: 'PATIENT', 'DOCTOR' veya 'ADMIN'
    const authData = { ...userData, role };
    setUser(authData);
    // Token ve kullanıcı bilgilerini tek bir yerde, tarayıcının hafızasına güvenle saklıyoruz
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
  };

  // Çıkış Yapma Fonksiyonu
  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // Token'ın süresi dolduğunda (backend 401 döndüğünde) oturumu uygulama genelinde kapat.
  // Böylece kullanıcı anlamsız hatalarla ekranda kalmaz; korumalı sayfalar giriş ekranına yönlendirir.
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser((current) => {
        // Uyarıyı yalnızca gerçekten açık bir oturum varken göster
        if (current) {
          message.warning('Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.');
        }
        return null;
      });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  // Başhekimin (Context'in) tüm sisteme dağıtacağı bilgiler
  const value = {
    user,
    role: user?.role,
    isAuthenticated: !!user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Diğer sayfaların Başhekime kolayca ulaşması için özel asistan (Hook)
export const useAuth = () => {
  return useContext(AuthContext);
};