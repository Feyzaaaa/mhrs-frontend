import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../api/authService';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Gerçek Spring Boot Backend'e istek atıyoruz!
      // values içinde { username, password } gönderiliyor
      const response = await authService.login(values);
      
      // Backend'den gelen yanıt (Token ve Rol bilgisi varsayımıyla)
      // Örn: response = { token: 'jwt-...', role: 'PATIENT', username: '...' }
      const token = response.token || 'mock-token';
      const role = response.role || (values.username.toLowerCase().includes('doktor') ? 'DOCTOR' : 'PATIENT');

      // Başhekim (AuthContext) aracılığıyla bilgileri hafızaya ve localStorage'a kaydediyoruz
      login({ username: values.username, token: token }, role);

      message.success('Giriş başarılı! Yönlendiriliyorsunuz...');

      // Rol bazlı yönlendirme
      if (role === 'DOCTOR') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/patient-dashboard');
      }
    } catch (error) {
      console.error('Giriş hatası:', error);
      message.error('Giriş başarısız! Kullanıcı adı veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card title="MHRS - Merkezi Sağlık Sistemi" style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <Form name="login" initialValues={{ remember: true }} onFinish={onFinish} layout="vertical">
          <Form.Item name="username" rules={[{ required: true, message: 'Lütfen kullanıcı adınızı girin!' }]}>
            <Input prefix={<UserOutlined />} placeholder="Kullanıcı Adı / T.C." size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Lütfen şifrenizi girin!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Şifre" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              Giriş Yap
            </Button>
          </Form.Item>
        </Form>
        <Typography.Paragraph style={{ textAlign: 'center', marginBottom: 0 }}>
          Hesabınız yok mu? <Link to="/register">Kayıt Ol</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
}