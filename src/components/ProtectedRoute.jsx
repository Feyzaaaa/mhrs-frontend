import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Her rolün giriş sonrası ait olduğu portal
const ROLE_HOME = {
  PATIENT: '/patient-dashboard',
  DOCTOR: '/doctor-dashboard',
  ADMIN: '/admin-dashboard',
};

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, isAuthenticated } = useAuth();

  // Eğer kullanıcı giriş yapmadıysa doğrudan login sayfasına yönlendir
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Giriş yapmış ama bu sayfanın rolüne sahip değilse: oturumu kapatmadan kendi portalına geri gönder
  // (örn. yönetici hesabıyla /patient-dashboard adresi elle yazıldığında)
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
  }

  // Her şey yolundaysa istenen sayfayı göster
  return children;
}
