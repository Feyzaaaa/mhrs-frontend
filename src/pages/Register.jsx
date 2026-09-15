import React, { useState } from 'react';
import { authService } from '../api/authService';
const Register = () => {

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

      setMessage('Kayıt Başarılı! Aramıza hoş geldin.');

    } catch (error) {

      console.error('Kayıt hatası:', error);

      if (error.response) {

        setMessage(
          `Hata: ${
            error.response.data?.message ||
            JSON.stringify(error.response.data)
          }`
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
            style={{
              width: '100%',
              padding: '8px'
            }}
          />

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

    </div>

  );

};

export default Register;