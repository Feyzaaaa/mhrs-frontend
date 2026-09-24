import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api/authService';
const Register = () => {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  };

  const handleRegister = async (e) => {

    e.preventDefault();

    try {

      const response = await authService.register(formData);

      console.log('Kayıt başarılı:', response);

      setMessage('Kayıt Başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
      setTimeout(() => navigate('/login'), 1200);

    } catch (error) {

      console.error('Kayıt hatası:', error);

      if (error.response) {

        // Backend iş kuralı hatalarını düz metin döndürür (örn. şifre politikası);
        // nesne dönen durumlarda mesaj alanına düşeriz.
        const data = error.response.data;
        setMessage(
          typeof data === 'string' && data.trim()
            ? data
            : `Hata: ${data?.message || 'Kayıt tamamlanamadı.'}`
        );

      } else if (error.request) {

        setMessage(
          'Sunucuya ulaşılamıyor. Lütfen backendin çalıştığından emin ol.'
        );

      } else {

        setMessage('Bir hata oluştu.');
      }

    }

  };

  return (

    <div
      style={{
        maxWidth: '400px',
        margin: 'auto',
        padding: '20px'
      }}
    >

      <h2>MHRS - Hasta Kayıt Sistemi</h2>

      <form onSubmit={handleRegister}>

        <div style={{ marginBottom: '10px' }}>

          <input
            type="text"
            name="firstName"
            placeholder="Adınız"
            value={formData.firstName}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px'
            }}
          />

        </div>

        <div style={{ marginBottom: '10px' }}>

          <input
            type="text"
            name="lastName"
            placeholder="Soyadınız"
            value={formData.lastName}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px'
            }}
          />

        </div>

        <div style={{ marginBottom: '10px' }}>

          <input
            type="email"
            name="email"
            placeholder="E-posta Adresiniz"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px'
            }}
          />

        </div>

        <div style={{ marginBottom: '10px' }}>

          <input
            type="password"
            name="password"
            placeholder="Şifreniz"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
            style={{
              width: '100%',
              padding: '8px'
            }}
          />

          {/* Kural sunucuda uygulanır; buradaki metin yalnızca kullanıcıyı bilgilendirir */}
          <small style={{ color: '#666' }}>
            En az 8 karakter, en az bir harf ve bir rakam içermeli.
          </small>

        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007BFF',
            color: 'white',
            border: 'none'
          }}
        >
          Kayıt Ol
        </button>

      </form>

      {message && (

        <p
          style={{
            marginTop: '15px',
            fontWeight: 'bold'
          }}
        >
          {message}
        </p>

      )}

      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        Zaten hesabınız var mı? <Link to="/login">Giriş Yap</Link>
      </p>

    </div>

  );

};

export default Register;