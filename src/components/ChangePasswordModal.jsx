import React, { useState } from 'react';
import { Modal, Form, Input, Alert, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { authService } from '../api/authService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Backend'deki PasswordPolicy ile aynı asgari koşullar (kural sunucuda uygulanır)
const MIN_SIFRE_UZUNLUGU = 8;

const yeniSifreKurali = (form) => ({
  validator: (_, deger) => {
    if (!deger) return Promise.reject(new Error('Lütfen yeni şifrenizi girin'));
    if (deger.length < MIN_SIFRE_UZUNLUGU) {
      return Promise.reject(new Error(`Şifre en az ${MIN_SIFRE_UZUNLUGU} karakter olmalıdır`));
    }
    if (!/[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(deger) || !/[0-9]/.test(deger)) {
      return Promise.reject(new Error('Şifre en az bir harf ve bir rakam içermelidir'));
    }
    if (deger === form.getFieldValue('currentPassword')) {
      return Promise.reject(new Error('Yeni şifre mevcut şifrenizle aynı olamaz'));
    }
    return Promise.resolve();
  },
});

/**
 * ŞİFRE DEĞİŞTİRME
 *
 * Mevcut şifre sorulur: sorulmasaydı, çalınmış bir oturum hesabın kalıcı olarak
 * ele geçirilmesine yeterdi. Başarılı değişiklikten sonra sunucu, o ana kadar
 * üretilmiş tüm token'ları geçersiz sayar; bu yüzden kullanıcı çıkışa yönlendirilir.
 */
export default function ChangePasswordModal({ open, onClose }) {
  const [form] = Form.useForm();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hata, setHata] = useState('');
  const [basarili, setBasarili] = useState(false);

  const kapat = () => {
    form.resetFields();
    setHata('');
    setBasarili(false);
    onClose();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setHata('');

      await authService.changePassword(values.currentPassword, values.newPassword);

      setBasarili(true);
      // Eski token artık geçersiz; kullanıcıyı temiz bir oturuma yönlendiriyoruz
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (error) {
      if (error?.errorFields) return; // form doğrulama hatası
      const data = error.response?.data;
      setHata(typeof data === 'string' && data.trim() ? data : 'Şifre değiştirilemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Şifre Değiştir"
      open={open}
      onOk={handleSubmit}
      onCancel={kapat}
      confirmLoading={loading}
      okText="Şifreyi Değiştir"
      cancelText="Vazgeç"
      okButtonProps={{ disabled: basarili }}
      cancelButtonProps={{ disabled: basarili }}
      destroyOnHidden
    >
      {basarili ? (
        <Alert
          type="success"
          showIcon
          message="Şifreniz güncellendi"
          description="Güvenlik gereği açık tüm oturumlar sonlandırıldı. Giriş ekranına yönlendiriliyorsunuz..."
        />
      ) : (
        <>
          <Typography.Paragraph type="secondary">
            Şifrenizi değiştirdiğinizde, bu hesapla açılmış <strong>tüm oturumlar</strong> sonlandırılır.
          </Typography.Paragraph>

          {hata && <Alert type="error" showIcon message={hata} style={{ marginBottom: 16 }} />}

          <Form form={form} layout="vertical" requiredMark={false}>
            <Form.Item
              name="currentPassword"
              label="Mevcut Şifreniz"
              rules={[{ required: true, message: 'Mevcut şifrenizi girin' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Mevcut şifreniz" size="large" />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="Yeni Şifre"
              rules={[yeniSifreKurali(form)]}
              extra={`En az ${MIN_SIFRE_UZUNLUGU} karakter, en az bir harf ve bir rakam içermeli.`}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Yeni şifreniz" size="large" />
            </Form.Item>

            <Form.Item
              name="newPasswordRepeat"
              label="Yeni Şifre (Tekrar)"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Yeni şifrenizi tekrar girin' },
                ({ getFieldValue }) => ({
                  validator: (_, deger) =>
                    !deger || getFieldValue('newPassword') === deger
                      ? Promise.resolve()
                      : Promise.reject(new Error('Şifreler eşleşmiyor')),
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Yeni şifrenizi tekrar girin" size="large" />
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
}
