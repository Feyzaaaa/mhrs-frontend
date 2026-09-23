import React from 'react';
import { Card, Button, Typography, Divider } from 'antd';
import { UserOutlined, MedicineBoxOutlined, UserAddOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

export default function Welcome() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 420, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          MHRS - Merkezi Sağlık Sistemi
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Devam etmek için hesap tipinize göre giriş yapın.
        </Typography.Paragraph>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <Link to="/login/patient" style={{ flex: 1 }}>
            <Button type="primary" icon={<UserOutlined />} size="large" block>
              Hasta Girişi
            </Button>
          </Link>
          <Link to="/login/doctor" style={{ flex: 1 }}>
            <Button icon={<MedicineBoxOutlined />} size="large" block>
              Doktor Girişi
            </Button>
          </Link>
        </div>
        <div style={{ marginTop: '12px' }}>
          <Link to="/login/admin">
            <Button icon={<SafetyCertificateOutlined />} size="large" block>
              Yönetici Girişi
            </Button>
          </Link>
        </div>
        <Divider style={{ margin: '20px 0' }} />
        <Link to="/register">
          <Button type="link" icon={<UserAddOutlined />}>
            Hesabınız yok mu? Kayıt Ol
          </Button>
        </Link>
      </Card>
    </div>
  );
}
