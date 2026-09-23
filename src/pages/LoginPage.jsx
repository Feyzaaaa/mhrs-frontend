import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, MedicineBoxOutlined, UserSwitchOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../api/authService';

const ROLE_LABELS = {
  PATIENT: 'Hasta',
  DOCTOR: 'Doktor',
  ADMIN: 'Yönetici',
};

// Her rolün kendi giriş ekranı ve giriş sonrası yönlendirileceği portal
const ROLE_ROUTES = {
  PATIENT: { login: '/login/patient', dashboard: '/patient-dashboard' },
  DOCTOR: { login: '/login/doctor', dashboard: '/doctor-dashboard' },
  ADMIN: { login: '/login/admin', dashboard: '/admin-dashboard' },
};

const ROLE_ICONS = {
  PATIENT: <UserOutlined />,
  DOCTOR: <MedicineBoxOutlined />,
  ADMIN: <SafetyCertificateOutlined />,
};

// expectedRole: "PATIENT" | "DOCTOR" | "ADMIN" — bu ekran hangi portal için kullanılıyor.
// Üç rolün girişi kasıtlı olarak ayrı ekranlar: doğru bilgilerle giriş yapılsa bile
// hesabın rolü bu ekranın rolüyle uyuşmuyorsa giriş reddedilir.
export default function LoginPage({ expectedRole }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const roleLabel = ROLE_LABELS[expectedRole] || 'Kullanıcı';
  // Bu ekranın dışındaki diğer portallar (alt kısımda geçiş bağlantısı olarak gösterilir)
  const otherRoles = Object.keys(ROLE_ROUTES).filter((role) => role !== expectedRole);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Gerçek Spring Boot Backend'e istek atıyoruz!
      const response = await authService.login(values);

      // Backend'den gelen yanıt: { id, email, firstName, lastName, role, token }
      const { token, role, ...restOfResponse } = response;

      // AYRI GİRİŞ EKRANI KONTROLÜ: hesabın gerçek rolü bu ekranın beklediği rolle uyuşmuyorsa
      // (örn. bir doktor hesabıyla Hasta Girişi'nden giriş yapılmaya çalışılıyorsa) durduruyoruz.
      if (expectedRole && role !== expectedRole) {
        message.error(
          `Bu bilgiler bir ${ROLE_LABELS[role] || role} hesabına ait. Lütfen ${ROLE_LABELS[role] || role} Girişi'ni kullanın.`
        );
        return;
      }

      // Başhekim (AuthContext) aracılığıyla bilgileri (id dahil) hafızaya ve localStorage'a kaydediyoruz
      login({ ...restOfResponse, username: values.username, token }, role);

      message.success('Giriş başarılı! Yönlendiriliyorsunuz...');

      // Rol bazlı yönlendirme
      navigate(ROLE_ROUTES[role]?.dashboard || '/patient-dashboard');
    } catch (error) {
      console.error('Giriş hatası:', error);
      message.error('Giriş başarısız! Kullanıcı adı veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card title={`MHRS - ${roleLabel} Girişi`} style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <Form name="login" initialValues={{ remember: true }} onFinish={onFinish} layout="vertical">
          <Form.Item name="username" rules={[{ required: true, message: 'Lütfen kullanıcı adınızı girin!' }]}>
            <Input prefix={<UserOutlined />} placeholder="E-posta" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Lütfen şifrenizi girin!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Şifre" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading} icon={ROLE_ICONS[expectedRole] || <UserOutlined />}>
              {roleLabel} Girişi Yap
            </Button>
          </Form.Item>
        </Form>
        <Typography.Paragraph style={{ textAlign: 'center', marginBottom: 8 }}>
          {otherRoles.map((role, index) => (
            <span key={role}>
              {index > 0 && ' · '}
              <Link to={ROLE_ROUTES[role].login}>
                <UserSwitchOutlined /> {ROLE_LABELS[role]} Girişi
              </Link>
            </span>
          ))}
        </Typography.Paragraph>
        {expectedRole === 'PATIENT' && (
          <Typography.Paragraph style={{ textAlign: 'center', marginBottom: 0 }}>
            Hesabınız yok mu? <Link to="/register">Kayıt Ol</Link>
          </Typography.Paragraph>
        )}
      </Card>
    </div>
  );
}