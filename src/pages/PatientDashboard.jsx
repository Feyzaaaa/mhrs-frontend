import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Button, Table, message, Layout, Modal, Select, Row, Col, DatePicker, Popconfirm, Form, Input, InputNumber, Descriptions, Tag } from 'antd';
import {
  LogoutOutlined,
  PlusOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  EditOutlined,
  ExperimentOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { appointmentService } from '../api/appointmentService';
import { patientService } from '../api/patientService';
import { checkAppointmentConflict } from '../utils/conflictValidator';

const { Header, Content, Sider } = Layout;
const { Option } = Select;
const { TextArea } = Input;

// Backend'deki AppointmentScheduleRules ile aynı sınır: en fazla 30 gün sonrasına randevu.
// Bu takvim kısıtı yalnızca kolaylık sağlar; asıl doğrulama sunucu tarafındadır.
const MAX_ADVANCE_DAYS = 30;

// Geçmiş günler ve 30 gün sonrasındaki günler takvimde seçilemez.
// DatePicker'ın verdiği değer üzerinden zaman damgasıyla karşılaştırıyoruz ki
// ek bir tarih kütüphanesi bağımlılığı gerekmesin.
const disabledAppointmentDate = (current) => {
  if (!current) return false;

  const firstDay = new Date();
  firstDay.setHours(0, 0, 0, 0);

  const lastDay = new Date(firstDay);
  lastDay.setDate(lastDay.getDate() + MAX_ADVANCE_DAYS);
  lastDay.setHours(23, 59, 59, 999);

  const selected = current.valueOf();
  return selected < firstDay.getTime() || selected > lastDay.getTime();
};

const BLOOD_TYPES = ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-'];

// Boy (cm) ve kiloya (kg) göre vücut kitle endeksi ve kategorisini hesaplar
const calculateBmi = (height, weight) => {
  if (!height || !weight) return null;
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  let category = 'Normal';
  if (bmi < 18.5) category = 'Zayıf';
  else if (bmi >= 25 && bmi < 30) category = 'Fazla Kilolu';
  else if (bmi >= 30) category = 'Obez';
  return { value: bmi.toFixed(1), category };
};

// Backend LocalDateTime'ı hem "2026-01-15T10:30:00" hem de [2026,1,15,10,30,0] biçiminde dönebilir
const parseAppointmentDate = (value) => {
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0] = value;
    return new Date(year, month - 1, day, hour, minute);
  }
  return new Date(value);
};

const formatAppointmentTime = (value) => {
  const date = parseAppointmentDate(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const STATUS_LABELS = {
  PENDING: 'Onay Bekliyor',
  CONFIRMED: 'Onaylandı',
  CANCELLED: 'İptal Edildi',
  COMPLETED: 'Tamamlandı',
};

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dinamik Veritabanı Verileri
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  // Hasta profili (boy/kilo/yaş/cinsiyet/kan grubu/alerji/iletişim) ve laboratuvar sonuçları
  const [profile, setProfile] = useState(null);
  const [labResults, setLabResults] = useState([]);
  const [labResultsLoading, setLabResultsLoading] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm] = Form.useForm();

  // Kullanıcının Seçimleri
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const fetchAppointments = useCallback(async () => {
    setAppointmentsLoading(true);
    try {
      const data = await appointmentService.getPatientAppointments(user.id);
      // Tarihçe en yeni/yaklaşan en üstte görünsün diye tarihe göre azalan sırala
      const sorted = [...data].sort(
        (a, b) => parseAppointmentDate(b.appointmentDate) - parseAppointmentDate(a.appointmentDate)
      );
      setAppointments(sorted);
    } catch (error) {
      message.error('Randevularınız yüklenirken bir hata oluştu.');
    } finally {
      setAppointmentsLoading(false);
    }
  }, [user]);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await patientService.getProfile(user.id);
      setProfile(data);
    } catch (error) {
      message.error('Sağlık profiliniz yüklenirken bir hata oluştu.');
    }
  }, [user]);

  const fetchLabResults = useCallback(async () => {
    setLabResultsLoading(true);
    try {
      const data = await patientService.getLabResults(user.id);
      setLabResults(data);
    } catch (error) {
      message.error('Laboratuvar sonuçlarınız yüklenirken bir hata oluştu.');
    } finally {
      setLabResultsLoading(false);
    }
  }, [user]);

  const bmi = useMemo(() => calculateBmi(profile?.height, profile?.weight), [profile]);

  // Ana sayfada ortada vurgulanacak, en yakın tarihli yaklaşan randevu
  const nextAppointment = useMemo(() => {
    const now = new Date();
    const upcoming = appointments.filter(
      (appointment) =>
        (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') &&
        parseAppointmentDate(appointment.appointmentDate) >= now
    );
    if (upcoming.length === 0) return null;
    return upcoming.reduce((soonest, current) =>
      parseAppointmentDate(current.appointmentDate) < parseAppointmentDate(soonest.appointmentDate) ? current : soonest
    );
  }, [appointments]);

  // 1. Sayfa Açıldığında Poliklinikleri, Doktorları ve Kendi Randevularını Getir
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
    if (user?.id) {
      fetchAppointments();
      fetchProfile();
      fetchLabResults();
    }
  }, [user, fetchAppointments, fetchProfile, fetchLabResults]);

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
    
    const appointmentDateTime = `${selectedDate.format('YYYY-MM-DD')}T${selectedTime.split(' - ')[0]}:00`;

    // SENARYO TABANLI ÇAKIŞMA YÖNETİMİ: Hasta bu saat diliminde (farklı bir doktordan bile olsa)
    // zaten bir randevuya sahipse, isteği backend'e göndermeden burada durduruyoruz.
    if (checkAppointmentConflict(appointments, appointmentDateTime)) {
      Modal.warning({
        title: 'Zaman Çakışması',
        content: 'Bu saat diliminde zaten mevcut bir randevunuz var. Aynı anda birden fazla doktordan randevu alamazsınız. Lütfen farklı bir saat seçin.',
        okText: 'Anladım',
      });
      return;
    }

    setLoading(true);
    try {
      // Backend'e kaydedilecek gerçek format (Test amaçlı console'da görebilirsin)
      const appointmentData = {
        patient: { id: user.id }, // AuthContext'ten gelen gerçek ID
        doctor: { id: selectedDoctor },
        appointmentDate: appointmentDateTime,
        complaint: 'Genel kontrol'
      };

      await appointmentService.bookAppointment(appointmentData);
      message.success('Randevunuz başarıyla oluşturuldu!');
      handleCancel();
      fetchAppointments();
    } catch (error) {
      // Backend senaryo bazlı bir mesaj döndürüyorsa (örn. "Bu doktorun bu saatte randevusu zaten dolu!")
      // onu olduğu gibi gösteriyoruz; yoksa genel bir mesaja düşüyoruz.
      const backendMessage = error.response?.data;
      message.error(
        typeof backendMessage === 'string'
          ? backendMessage
          : 'Randevu oluşturulurken bir hata oluştu veya saat dolu!'
      );
    } finally {
      setLoading(false);
    }
  };

  const openProfileModal = () => {
    profileForm.setFieldsValue({
      height: profile?.height,
      weight: profile?.weight,
      age: profile?.age,
      gender: profile?.gender,
      bloodType: profile?.bloodType,
      allergies: profile?.allergies,
      phone: profile?.phone,
    });
    setIsProfileModalVisible(true);
  };

  const handleSaveProfile = async () => {
    try {
      const values = await profileForm.validateFields();
      setSavingProfile(true);
      const updated = await patientService.updateProfile(user.id, values);
      setProfile(updated);
      setIsProfileModalVisible(false);
      message.success('Sağlık bilgileriniz güncellendi.');
    } catch (error) {
      if (error?.errorFields) return; // form doğrulama hatası, zaten forma işaretlendi
      message.error('Sağlık bilgileri kaydedilirken bir hata oluştu.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    setCancellingId(appointmentId);
    try {
      await appointmentService.cancelAppointment(appointmentId);
      message.success('Randevunuz iptal edildi.');
      fetchAppointments();
    } catch (error) {
      const backendMessage = error.response?.data;
      message.error(typeof backendMessage === 'string' ? backendMessage : 'Randevu iptal edilirken bir hata oluştu.');
    } finally {
      setCancellingId(null);
    }
  };

  const labColumns = [
    { title: 'Tahlil / Analiz', dataIndex: 'testName', key: 'testName' },
    { title: 'Sonuç', dataIndex: 'result', key: 'result' },
    { title: 'Referans Aralığı', dataIndex: 'referenceRange', key: 'referenceRange', render: (val) => val || '-' },
    { title: 'Tarih', dataIndex: 'testDate', key: 'testDate' },
  ];

  const columns = [
    {
      title: 'Poliklinik',
      key: 'department',
      render: (_, record) => record.doctor?.department?.name || '-',
    },
    {
      title: 'Doktor',
      key: 'doctor',
      render: (_, record) =>
        record.doctor ? `${record.doctor.title || ''} ${record.doctor.user?.firstName || ''} ${record.doctor.user?.lastName || ''}`.trim() : '-',
    },
    {
      title: 'Tarih ve Saat',
      key: 'date',
      render: (_, record) => formatAppointmentTime(record.appointmentDate),
    },
    {
      title: 'Durum',
      key: 'status',
      render: (_, record) => STATUS_LABELS[record.status] || record.status,
    },
    {
      title: 'İşlem',
      key: 'action',
      render: (_, record) => {
        const isCancellable = record.status !== 'CANCELLED' && record.status !== 'COMPLETED';
        return (
          <Popconfirm
            title="Bu randevuyu iptal etmek istediğinize emin misiniz?"
            okText="Evet, İptal Et"
            cancelText="Vazgeç"
            onConfirm={() => handleCancelAppointment(record.id)}
            disabled={!isCancellable}
          >
            <Button
              danger
              icon={<CloseCircleOutlined />}
              disabled={!isCancellable}
              loading={cancellingId === record.id}
            >
              İptal Et
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>🏥 MHRS Hasta Portalı</h3>
        <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout}>Çıkış</Button>
      </Header>

      <Layout style={{ background: '#f0f2f5' }}>
        {/* SOL SABİT PANEL: Kan grubu, alerjiler, VKİ, iletişim bilgileri */}
        <Sider
          width={260}
          theme="light"
          breakpoint="lg"
          collapsedWidth={0}
          style={{
            background: '#fff',
            padding: '20px 16px',
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'auto',
            boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0 }}>Sağlık Kimliğim</h4>
            <Button type="text" icon={<EditOutlined />} onClick={openProfileModal} />
          </div>
          <Descriptions column={1} size="small" colon={false} layout="vertical">
            <Descriptions.Item label="Kan Grubu">
              {profile?.bloodType ? <Tag color="red">{profile.bloodType}</Tag> : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Alerjiler">
              {profile?.allergies || 'Kayıtlı alerji yok'}
            </Descriptions.Item>
            <Descriptions.Item label="Vücut Kitle Endeksi (VKİ)">
              {bmi ? `${bmi.value} — ${bmi.category}` : 'Boy/kilo girilmemiş'}
            </Descriptions.Item>
            <Descriptions.Item label="İletişim">
              <PhoneOutlined /> {profile?.phone || 'Girilmemiş'}
            </Descriptions.Item>
          </Descriptions>
        </Sider>

      <Content style={{ padding: '16px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        {/* YAKLAŞAN RANDEVU VURGUSU: ana sayfanın ortasında, en dikkat çekici alan */}
        <Card
          style={{
            marginBottom: '24px',
            textAlign: 'center',
            background: nextAppointment ? 'linear-gradient(135deg, #1677ff, #4096ff)' : '#fff',
            border: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}
        >
          {nextAppointment ? (
            <div style={{ color: '#fff' }}>
              <CalendarOutlined style={{ fontSize: '28px', marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Yaklaşan Randevunuz
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0' }}>
                {formatAppointmentTime(nextAppointment.appointmentDate)}
              </div>
              <div style={{ fontSize: '16px' }}>
                {nextAppointment.doctor?.title} {nextAppointment.doctor?.user?.firstName} {nextAppointment.doctor?.user?.lastName}
                {nextAppointment.doctor?.department?.name ? ` · ${nextAppointment.doctor.department.name}` : ''}
              </div>
            </div>
          ) : (
            <div style={{ color: '#8c8c8c', padding: '8px 0' }}>
              <CalendarOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
              <div>Yaklaşan bir randevunuz bulunmuyor.</div>
            </div>
          )}
        </Card>

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
            <Card
              title="Genel Bilgilerim"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}
              extra={<Button type="text" icon={<EditOutlined />} onClick={openProfileModal} />}
            >
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Boy">{profile?.height ? `${profile.height} cm` : '-'}</Descriptions.Item>
                <Descriptions.Item label="Kilo">{profile?.weight ? `${profile.weight} kg` : '-'}</Descriptions.Item>
                <Descriptions.Item label="Yaş">{profile?.age || '-'}</Descriptions.Item>
                <Descriptions.Item label="Cinsiyet">{profile?.gender || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: '24px' }}>
          <Card title={<span><ExperimentOutlined /> Laboratuvar Sonuçlarım / Tahliller</span>} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Table
              dataSource={labResults}
              columns={labColumns}
              rowKey="id"
              loading={labResultsLoading}
              pagination={false}
              scroll={{ x: 500 }}
              locale={{ emptyText: 'Henüz kayıtlı laboratuvar sonucunuz yok.' }}
            />
          </Card>
        </div>

        <div style={{ marginTop: '24px' }}>
          <Card title="Randevu Geçmişim (Tarihçe)" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Table
              dataSource={appointments}
              columns={columns}
              rowKey="id"
              loading={appointmentsLoading}
              pagination={false}
              scroll={{ x: 500 }}
            />
          </Card>
        </div>
      </Content>
      </Layout>

      <Modal
        title="Sağlık Bilgilerimi Düzenle"
        open={isProfileModalVisible}
        onOk={handleSaveProfile}
        onCancel={() => setIsProfileModalVisible(false)}
        confirmLoading={savingProfile}
        okText="Kaydet"
        cancelText="Vazgeç"
      >
        <Form form={profileForm} layout="vertical" style={{ marginTop: '16px' }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="height" label="Boy (cm)">
                <InputNumber min={0} max={300} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="weight" label="Kilo (kg)">
                <InputNumber min={0} max={500} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="age" label="Yaş">
                <InputNumber min={0} max={130} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="Cinsiyet">
                <Select placeholder="Seçiniz" allowClear>
                  <Option value="Kadın">Kadın</Option>
                  <Option value="Erkek">Erkek</Option>
                  <Option value="Diğer">Diğer</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="bloodType" label="Kan Grubu">
            <Select placeholder="Seçiniz" allowClear>
              {BLOOD_TYPES.map((type) => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="allergies" label="Alerjiler">
            <TextArea rows={2} placeholder="Örn. Penisilin, polen..." />
          </Form.Item>
          <Form.Item name="phone" label="Telefon">
            <Input placeholder="05xx xxx xx xx" />
          </Form.Item>
        </Form>
      </Modal>

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
              disabledDate={disabledAppointmentDate}
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