import React, { useState } from 'react';
import { Card, Button, Table, message, Layout, Modal, Input } from 'antd';
import { LogoutOutlined, TeamOutlined, FileTextOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;
const { TextArea } = Input;

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Vaka Notu Modalı İçin State'ler
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [clinicalNote, setClinicalNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    logout();
    message.success('Çıkış yapıldı.');
    navigate('/login');
  };

  // Vaka Notu Modalını Aç
  const openClinicalNoteModal = (record) => {
    setSelectedPatient(record);
    setClinicalNote(record.note || '');
    setIsModalVisible(true);
  };

  // Notu Kaydet Simülasyonu
  const handleSaveNote = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsModalVisible(false);
      message.success(`${selectedPatient.patientName} için vaka notu başarıyla kaydedildi!`);
    }, 800);
  };

  const columns = [
    { title: 'Hasta Adı', dataIndex: 'patientName', key: 'patientName' },
    { title: 'Randevu Saati', dataIndex: 'time', key: 'time' },
    { title: 'Şikayet', dataIndex: 'complaint', key: 'complaint' },
    { 
      title: 'Klinik İşlem', 
      key: 'action', 
      render: (_, record) => (
        <Button 
          type="primary" 
          ghost 
          icon={<FileTextOutlined />} 
          onClick={() => openClinicalNoteModal(record)}
        >
          Vaka Notu / Reçete Gir
        </Button>
      ) 
    },
  ];

  const dataSource = [
    { key: '1', patientName: 'Gizem Demir', time: '14:00', complaint: 'Genel Kontrol', note: 'Boğaz enfeksiyonu şüphesi.' },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2>🩺 MHRS - Doktor Portalı (Klinik Yönetimi)</h2>
        <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout}>
          Çıkış Yap
        </Button>
      </Header>
      
      <Content style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <Card title="Klinik Çalışma Takvimi" style={{ marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <p><TeamOutlined /> Günlük randevu kapasitenizi yönetebilir, hastalarınıza e-reçete ve vaka notu ekleyebilirsiniz.</p>
        </Card>

        <Card title="Bugünkü Randevulu Hastalarım" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Table dataSource={dataSource} columns={columns} pagination={false} scroll={{ x: 600 }} />
        </Card>
      </Content>

      {/* Vaka Notu & Reçete Giriş Modalı */}
      <Modal
        title={`Muayene Notu: ${selectedPatient?.patientName || ''}`}
        open={isModalVisible}
        onOk={handleSaveNote}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
        okText="Notu Kaydet"
        cancelText="İptal"
      >
        <div style={{ marginTop: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Teşhis, Tedavi ve Reçete Bilgileri:</label>
          <TextArea 
            rows={4} 
            value={clinicalNote} 
            onChange={(e) => setClinicalNote(e.target.value)}
            placeholder="Buraya klinik gözlemlerinizi ve reçete detaylarını yazın..."
          />
        </div>
      </Modal>
    </Layout>
  );
}