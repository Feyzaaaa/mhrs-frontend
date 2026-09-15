import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spin } from 'antd';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, isAuthenticated } = useAuth();

  // Eğer kullanıcı giriş yapmadıysa doğrudan login sayfasına yönlendir
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Eğer belirli bir rol şartı varsa ve kullanıcının rolü uymuyorsa ana sayfaya at
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  // Her şey yolundaysa istenen sayfayı göster
  return children;
}