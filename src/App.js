import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
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

          <Route path="*" element={<div style={{ textAlign: 'center', marginTop: '100px' }}><h2>404 - Sayfa Bulunamadı</h2></div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;