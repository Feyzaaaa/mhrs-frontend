import React, { createContext, useState, useContext } from 'react';

// 1. Başhekimi (Context) Yaratıyoruz
const AuthContext = createContext(null);

// 2. Sistemi Saracak Olan Sağlayıcı (Provider)
export const AuthProvider = ({ children }) => {
  // Kullanıcının kimliğini ve rolünü burada tutuyoruz
  // İleride backend'den gelen gerçek token ve rol buraya dolacak
  const [user, setUser] = useState(null); 

  // Giriş Yapma Fonksiyonu (Senaryo tabanlı rol ataması)
  const login = (userData, role) => {
    // userData: Kimlik bilgileri, role: 'PATIENT', 'DOCTOR' veya 'ADMIN'
    setUser({ ...userData, role });
    // Token'ı tarayıcının hafızasına güvenle saklıyoruz
    localStorage.setItem('mhrs_token', userData.token);
    localStorage.setItem('mhrs_role', role);
  };

  // Çıkış Yapma Fonksiyonu
  const logout = () => {
    setUser(null);
    localStorage.removeItem('mhrs_token');
    localStorage.removeItem('mhrs_role');
  };

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