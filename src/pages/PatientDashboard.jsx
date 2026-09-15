import React, { useState, useEffect } from 'react';
import { Card, Button, Table, message, Layout, Modal, Select, Row, Col, DatePicker } from 'antd';
import { LogoutOutlined, PlusOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { appointmentService } from '../api/appointmentService';

const { Header, Content } = Layout;
const { Option } = Select;

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dinamik Veritabanı Verileri
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Kullanıcının Seçimleri
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  // 1. Sayfa Açıldığında Poliklinikleri ve Doktorları Getir
  useEffect(() => {
    const fetchData = async () => {
      try {
        const deps = await appointmentService.getDepartments();
        const docs = await appointmentService.getDoctors();
        setDepartments(deps);
        setDoctors(docs);
      } catch (error) {
        message.error('Sistem verileri yüklenemedi.');
      }
    };
    fetchData();
  }, []);

  // 2. Doktor ve Tarih Seçildiğinde 15'er Dakikalık Saatleri Getir
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      const fetchSlots = async () => {
        try {
          const formattedDate = selectedDate.format('YYYY-MM-DD');
          const slots = await appointmentService.getAvailableSlots(selectedDoctor, formattedDate);
          setAvailableSlots(slots);
        } catch (error) {
          message.error('Müsait saatler yüklenemedi.');
        }
      };
      fetchSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const handleLogout = () => {
    logout();
    message.success('Başarıyla çıkış yapıldı.');
    navigate('/login');
  };

  const showModal = () => setIsModalVisible(true);
  
  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedDepartment(null);
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setAvailableSlots([]);
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      message.error('Lütfen doktor, tarih ve saat seçiniz!');
      return;
    }
    
    setLoading(true);
    try {
      // Backend'e kaydedilecek gerçek format (Test amaçlı console'da görebilirsin)
      const appointmentData = {
        patient: { id: user.id }, // AuthContext'ten gelen gerçek ID
        doctor: { id: selectedDoctor },
        appointmentDate: `${selectedDate.format('YYYY-MM-DD')}T${selectedTime.split(' - ')[0]}:00`,
        complaint: 'Genel kontrol'
      };
      
      await appointmentService.bookAppointment(appointmentData);
      message.success('Randevunuz başarıyla oluşturuldu!');
      handleCancel();
    } catch (error) {
      message.error('Randevu oluşturulurken bir hata oluştu veya saat dolu!');
    } finally {
      setLoading(false);
    }
  };

  // ... (Tablo kolonları ve dataSource kısmı aynı kalabilir)
  const columns = [
    { title: 'Poliklinik', dataIndex: 'department', key: 'department' },
    { title: 'Doktor', dataIndex: 'doctor', key: 'doctor' },
    { title: 'Tarih ve Saat', dataIndex: 'date', key: 'date' },
    { title: 'Durum', dataIndex: 'status', key: 'status' },
  ];
  const dataSource = []; 

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>🏥 MHRS Hasta Portalı</h3>
        <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout}>Çıkış</Button>
      </Header>

      <Content style={{ padding: '16px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Hızlı İşlemler" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}>
              <p>Müsait saatleri sorgulayın ve anında randevunuzu alın.</p>
              <Button type="primary" icon={<PlusOutlined />} size="large" onClick={showModal} block>
                Yeni Randevu Al
              </Button>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Sağlık Bilgileri" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}>
              <p><ClockCircleOutlined /> Aktif randevularınızı aşağıdan takip edebilirsiniz.</p>
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: '24px' }}>
          <Card title="Aktif Randevularım" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Table dataSource={dataSource} columns={columns} pagination={false} scroll={{ x: 500 }} />
          </Card>
        </div>
      </Content>

      <Modal 
        title="Canlı Randevu Oluşturma Ekranı" 
        open={isModalVisible} 
        onOk={handleBookAppointment} 
        onCancel={handleCancel}
        confirmLoading={loading}
        okText="Randevuyu Onayla"
        cancelText="Vazgeç"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          
          {/* DİNAMİK POLİKLİNİK SEÇİMİ */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Poliklinik Seçin:</label>
            <Select 
              placeholder="Poliklinik seçiniz" 
              style={{ width: '100%' }} 
              onChange={(val) => {
                setSelectedDepartment(val);
                setSelectedDoctor(null); // Poliklinik değişirse doktoru sıfırla
              }}
              value={selectedDepartment}
            >
              {departments.map(dep => (
                <Option key={dep.id} value={dep.id}>{dep.name}</Option>
              ))}
            </Select>
          </div>

          {/* DİNAMİK DOKTOR SEÇİMİ */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Doktor Seçin:</label>
            <Select 
              placeholder="Önce poliklinik seçiniz" 
              style={{ width: '100%' }} 
              disabled={!selectedDepartment}
              onChange={(val) => setSelectedDoctor(val)}
              value={selectedDoctor}
            >
              {doctors
                .filter(doc => doc.department.id === selectedDepartment)
                .map(doc => (
                  <Option key={doc.id} value={doc.id}>{doc.title} {doc.user.firstName} {doc.user.lastName}</Option>
              ))}
            </Select>
          </div>

          {/* TARİH SEÇİMİ */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Tarih Seçin:</label>
            <DatePicker 
              style={{ width: '100%' }} 
              disabled={!selectedDoctor}
              onChange={(date) => setSelectedDate(date)}
              value={selectedDate}
            />
          </div>

          {/* DİNAMİK 15 DAKİKALIK SAAT SEÇİMİ */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Müsait Saat Dilimi:</label>
            <Select 
              placeholder={availableSlots.length > 0 ? "Saat dilimi seçiniz" : "Tarih ve doktor seçiniz"} 
              style={{ width: '100%' }}
              onChange={(val) => setSelectedTime(val)}
              value={selectedTime}
              disabled={availableSlots.length === 0}
            >
              {availableSlots.map((slot, index) => (
                <Option key={index} value={slot}>{slot}</Option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}