import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Welcome from './pages/Welcome';
import LoginPage from './pages/LoginPage';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />
          {/* Hasta, Doktor ve Yönetici girişleri kasıtlı olarak ayrı ekranlar */}
          <Route path="/login/patient" element={<LoginPage expectedRole="PATIENT" />} />
          <Route path="/login/doctor" element={<LoginPage expectedRole="DOCTOR" />} />
          <Route path="/login/admin" element={<LoginPage expectedRole="ADMIN" />} />
          <Route path="/login" element={<Navigate to="/login/patient" replace />} />
          <Route path="/register" element={<Register />} />
          
          <Route 
            path="/patient-dashboard" 
            element={
              <ProtectedRoute allowedRole="PATIENT">
                <PatientDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/doctor-dashboard" 
            element={
              <ProtectedRoute allowedRole="DOCTOR">
                <DoctorDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<div style={{ textAlign: 'center', marginTop: '100px' }}><h2>404 - Sayfa Bulunamadı</h2></div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;