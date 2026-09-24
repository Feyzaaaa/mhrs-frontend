import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Divider } from 'antd';
import {
  UserOutlined, LockOutlined, MailOutlined, IdcardOutlined,
  UserAddOutlined, UserSwitchOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api/authService';

// Backend'deki PasswordPolicy ile aynı asgari koşullar.
// Buradaki kontrol yalnızca kullanıcıyı erken uyarmak içindir; kural sunucuda uygulanır
// ve istek doğrudan API'ye gönderildiğinde tek geçerli denetim odur.
const MIN_SIFRE_UZUNLUGU = 8;

const sifreKuraliniDogrula = (_, deger) => {
  if (!deger) return Promise.reject(new Error('Lütfen bir şifre belirleyin'));
  if (deger.length < MIN_SIFRE_UZUNLUGU) {
    return Promise.reject(new Error(`Şifre en az ${MIN_SIFRE_UZUNLUGU} karakter olmalıdır`));
  }
  if (!/[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(deger) || !/[0-9]/.test(deger)) {
    return Promise.reject(new Error('Şifre en az bir harf ve bir rakam içermelidir'));
  }
  return Promise.resolve();
};

export default function Register() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [hata, setHata] = useState('');
  const [basarili, setBasarili] = useState(false);

  const handleRegister = async (values) => {
    setLoading(true);
    setHata('');
    try {
      await authService.register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      });

      setBasarili(true);
      setTimeout(() => navigate('/login/patient'), 1500);
    } catch (error) {
      // Backend iş kuralı hatalarını düz metin döndürür (şifre politikası, kullanılan e-posta)
      const data = error.response?.data;
      if (typeof data === 'string' && data.trim()) {
        setHata(data);
      } else if (error.response) {
        setHata(data?.message || 'Kayıt tamamlanamadı.');
      } else if (error.request) {
        setHata('Sunucuya ulaşılamıyor. Lütfen backend’in çalıştığından emin olun.');
      } else {
        setHata('Beklenmeyen bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5', padding: '24px 16px' }}>
      <Card
        title="MHRS - Hasta Kayıt"
        style={{ width: 440, maxWidth: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      >
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          Kayıt olan her hesap <strong>hasta</strong> rolüyle açılır. Doktor ve yönetici
          hesapları yalnızca yönetici tarafından tanımlanır.
        </Typography.Paragraph>

        {basarili && (
          <Alert
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            message="Kayıt başarılı!"
            description="Giriş sayfasına yönlendiriliyorsunuz..."
            style={{ marginBottom: 16 }}
          />
        )}

        {hata && (
          <Alert
            type="error"
            showIcon
            message={hata}
            closable
            onClose={() => setHata('')}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleRegister} disabled={basarili} requiredMark={false}>
          <Form.Item
            name="firstName"
            label="Adınız"
            rules={[{ required: true, message: 'Lütfen adınızı girin' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Adınız" size="large" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Soyadınız"
            rules={[{ required: true, message: 'Lütfen soyadınızı girin' }]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="Soyadınız" size="large" />
          </Form.Item>

          <Form.Item
            name="email"
            label="E-posta"
            rules={[
              { required: true, message: 'Lütfen e-posta adresinizi girin' },
              { type: 'email', message: 'Geçerli bir e-posta adresi girin' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="ornek@eposta.com" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Şifre"
            rules={[{ validator: sifreKuraliniDogrula }]}
            extra={`En az ${MIN_SIFRE_UZUNLUGU} karakter, en az bir harf ve bir rakam içermeli.`}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Şifreniz" size="large" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8, marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              icon={<UserAddOutlined />}
            >
              Kayıt Ol
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '16px 0' }} />

        <Typography.Paragraph style={{ textAlign: 'center', marginBottom: 0 }}>
          Zaten hesabınız var mı?{' '}
          <Link to="/login/patient">
            <UserSwitchOutlined /> Giriş Yap
          </Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
