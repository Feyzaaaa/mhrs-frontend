import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Table, message, Layout, Modal, Input, Popconfirm, Space, Form, DatePicker, Tag, Empty } from 'antd';
import { LogoutOutlined, LockOutlined, TeamOutlined, FileTextOutlined, CloseCircleOutlined, ExperimentOutlined, CalendarOutlined, PlusOutlined, DeleteOutlined, CheckCircleOutlined, CheckOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { useNavigate } from 'react-router-dom';
import { appointmentService } from '../api/appointmentService';
import { patientService } from '../api/patientService';

const { Header, Content } = Layout;
const { TextArea } = Input;

// Backend LocalDateTime'ı hem "2024-01-15T10:30:00" hem de [2024,1,15,10,30,0] biçiminde dönebilir
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

const STATUS_COLORS = {
  PENDING: 'gold',
  CONFIRMED: 'blue',
  CANCELLED: 'red',
  COMPLETED: 'green',
};

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sifreModaliAcik, setSifreModaliAcik] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  // İzin / görev günleri (kural R7): bu günlerde hastalara müsait saat sunulmaz
  const [doctorId, setDoctorId] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [leaveForm] = Form.useForm();
  const [savingLeave, setSavingLeave] = useState(false);
  const [removingLeaveId, setRemovingLeaveId] = useState(null);

  // Durum akışı: Onay Bekliyor -> Onaylandı -> Tamamlandı
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  // Vaka Notu Modalı İçin State'ler
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [clinicalNote, setClinicalNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Laboratuvar Sonucu Ekleme Modalı İçin State'ler
  const [isLabModalVisible, setIsLabModalVisible] = useState(false);
  const [labTargetAppointment, setLabTargetAppointment] = useState(null);
  const [savingLab, setSavingLab] = useState(false);
  const [labForm] = Form.useForm();

  const fetchAppointments = useCallback(async () => {
    setTableLoading(true);
    try {
      // User.id ile Doctor.id farklı kayıtlar; önce giriş yapan kullanıcının doktor kaydını buluyoruz
      const doctor = await appointmentService.getDoctorByUserId(user.id);
      setDoctorId(doctor.id);
      const data = await appointmentService.getDoctorAppointments(doctor.id);
      setAppointments(data);
      setLeaves(await appointmentService.getDoctorLeaves(doctor.id));
    } catch (error) {
      message.error('Randevular yüklenirken bir hata oluştu.');
    } finally {
      setTableLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      fetchAppointments();
    }
  }, [user, fetchAppointments]);

  const handleLogout = () => {
    logout();
    message.success('Çıkış yapıldı.');
    navigate('/login');
  };

  // Vaka Notu Modalını Aç
  const openClinicalNoteModal = (record) => {
    setSelectedAppointment(record);
    setClinicalNote(record.note || '');
    setIsModalVisible(true);
  };

  // Notu Backend'e Kaydet
  const handleSaveNote = async () => {
    setSaving(true);
    try {
      const updated = await appointmentService.saveClinicalNote(selectedAppointment.id, clinicalNote);
      setAppointments((prev) =>
        prev.map((appointment) => (appointment.id === updated.id ? updated : appointment))
      );
      setIsModalVisible(false);
      message.success('Vaka notu başarıyla kaydedildi!');
    } catch (error) {
      message.error('Vaka notu kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  // Laboratuvar Sonucu Modalını Aç
  const openLabResultModal = (record) => {
    setLabTargetAppointment(record);
    labForm.resetFields();
    setIsLabModalVisible(true);
  };

  // Laboratuvar Sonucunu Backend'e Kaydet
  const handleSaveLabResult = async () => {
    try {
      const values = await labForm.validateFields();
      setSavingLab(true);
      await patientService.addLabResult({
        patient: { id: labTargetAppointment.patient.id },
        testName: values.testName,
        result: values.result,
        referenceRange: values.referenceRange,
        testDate: values.testDate.format('YYYY-MM-DD'),
      }, values.acilGerekce);
      setIsLabModalVisible(false);
      message.success('Laboratuvar sonucu hastanın profiline eklendi!');
    } catch (error) {
      if (error?.errorFields) return; // form doğrulama hatası
      message.error('Laboratuvar sonucu kaydedilirken bir hata oluştu.');
    } finally {
      setSavingLab(false);
    }
  };

  // İzin günü ekle: backend o günde aktif randevu varsa reddeder
  const handleAddLeave = async () => {
    try {
      const values = await leaveForm.validateFields();
      setSavingLeave(true);
      await appointmentService.addDoctorLeave(doctorId, values.leaveDate.format('YYYY-MM-DD'), values.reason);
      leaveForm.resetFields();
      setLeaves(await appointmentService.getDoctorLeaves(doctorId));
      message.success('İzin günü eklendi. Bu tarihte hastalara randevu saati sunulmayacak.');
    } catch (error) {
      if (error?.errorFields) return; // form doğrulama hatası
      const backendMessage = error.response?.data;
      message.error(typeof backendMessage === 'string' ? backendMessage : 'İzin günü eklenirken bir hata oluştu.');
    } finally {
      setSavingLeave(false);
    }
  };

  const handleRemoveLeave = async (leaveId) => {
    setRemovingLeaveId(leaveId);
    try {
      await appointmentService.removeDoctorLeave(doctorId, leaveId);
      setLeaves((prev) => prev.filter((leave) => leave.id !== leaveId));
      message.success('İzin günü kaldırıldı.');
    } catch (error) {
      const backendMessage = error.response?.data;
      message.error(typeof backendMessage === 'string' ? backendMessage : 'İzin günü kaldırılırken bir hata oluştu.');
    } finally {
      setRemovingLeaveId(null);
    }
  };

  // Randevu durumunu ilerlet. Geçerli olmayan geçişleri backend reddeder
  // (örn. saati gelmemiş randevu tamamlanamaz), mesajı olduğu gibi gösteririz.
  const handleStatusChange = async (appointmentId, action) => {
    setStatusUpdatingId(appointmentId);
    try {
      const updated = action === 'confirm'
        ? await appointmentService.confirmAppointment(appointmentId)
        : await appointmentService.completeAppointment(appointmentId);
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      message.success(action === 'confirm' ? 'Randevu onaylandı.' : 'Muayene tamamlandı olarak işaretlendi.');
    } catch (error) {
      const backendMessage = error.response?.data;
      message.error(typeof backendMessage === 'string' ? backendMessage : 'Randevu durumu güncellenemedi.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    setCancellingId(appointmentId);
    try {
      await appointmentService.cancelAppointment(appointmentId);
      message.success('Randevu iptal edildi.');
      fetchAppointments();
    } catch (error) {
      const backendMessage = error.response?.data;
      message.error(typeof backendMessage === 'string' ? backendMessage : 'Randevu iptal edilirken bir hata oluştu.');
    } finally {
      setCancellingId(null);
    }
  };

  const columns = [
    {
      title: 'Hasta Adı',
      key: 'patientName',
      render: (_, record) =>
        record.patient ? `${record.patient.firstName} ${record.patient.lastName}` : '-',
    },
    {
      title: 'Randevu Saati',
      key: 'time',
      render: (_, record) => formatAppointmentTime(record.appointmentDate),
    },
    { title: 'Şikayet', dataIndex: 'complaint', key: 'complaint' },
    {
      title: 'Durum',
      key: 'status',
      render: (_, record) => (
        <Tag color={STATUS_COLORS[record.status]}>{STATUS_LABELS[record.status] || record.status}</Tag>
      ),
    },
    {
      title: 'Durum İşlemi',
      key: 'statusAction',
      render: (_, record) => {
        const isFinished = record.status === 'CANCELLED' || record.status === 'COMPLETED';
        if (isFinished) return <span style={{ color: '#aaa' }}>—</span>;
        return (
          <Space>
            {record.status === 'PENDING' && (
              <Button
                icon={<CheckOutlined />}
                loading={statusUpdatingId === record.id}
                onClick={() => handleStatusChange(record.id, 'confirm')}
              >
                Onayla
              </Button>
            )}
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={statusUpdatingId === record.id}
              onClick={() => handleStatusChange(record.id, 'complete')}
            >
              Muayene Bitti
            </Button>
          </Space>
        );
      },
    },
    {
      title: 'Klinik İşlem',
      key: 'action',
      render: (_, record) => {
        const isCancellable = record.status !== 'CANCELLED' && record.status !== 'COMPLETED';
        return (
          <Space>
            <Button
              type="primary"
              ghost
              icon={<FileTextOutlined />}
              disabled={record.status === 'CANCELLED'}
              onClick={() => openClinicalNoteModal(record)}
            >
              Vaka Notu / Reçete Gir
            </Button>
            <Button icon={<ExperimentOutlined />} onClick={() => openLabResultModal(record)}>
              Tahlil Ekle
            </Button>
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
          </Space>
        );
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2>🩺 MHRS - Doktor Portalı (Klinik Yönetimi)</h2>
        <Space>
          <Button icon={<LockOutlined />} onClick={() => setSifreModaliAcik(true)}>Şifre Değiştir</Button>
          <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout}>
            Çıkış Yap
          </Button>
        </Space>
      </Header>

      <ChangePasswordModal open={sifreModaliAcik} onClose={() => setSifreModaliAcik(false)} />

      <Content style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <Card title="Klinik Çalışma Takvimi" style={{ marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <p><TeamOutlined /> Günlük randevu kapasitenizi yönetebilir, hastalarınıza e-reçete ve vaka notu ekleyebilirsiniz.</p>
        </Card>

        <Card
          title={<span><CalendarOutlined /> İzin / Görev Günlerim</span>}
          style={{ marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        >
          <p style={{ color: '#888', marginTop: 0 }}>
            Buraya eklediğiniz günlerde hastalara müsait saat gösterilmez ve randevu oluşturulamaz.
            O gün için verilmiş randevunuz varsa önce onu iptal etmeniz gerekir.
          </p>
          <Form form={leaveForm} layout="inline" style={{ marginBottom: '16px' }}>
            <Form.Item name="leaveDate" rules={[{ required: true, message: 'Tarih seçiniz' }]}>
              <DatePicker placeholder="İzin tarihi" disabledDate={(current) => current && current.valueOf() < Date.now() - 86400000} />
            </Form.Item>
            <Form.Item name="reason">
              <Input placeholder="Açıklama (örn. Yıllık izin, Nöbet)" style={{ width: 240 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" icon={<PlusOutlined />} loading={savingLeave} onClick={handleAddLeave} disabled={!doctorId}>
                Ekle
              </Button>
            </Form.Item>
          </Form>

          {leaves.length === 0 ? (
            <Empty description="Yaklaşan izin günü yok" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Space wrap>
              {leaves.map((leave) => (
                <Tag key={leave.id} color="orange" style={{ padding: '6px 10px', fontSize: '14px' }}>
                  {new Date(leave.leaveDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  {leave.reason ? ` — ${leave.reason}` : ''}
                  <Popconfirm
                    title="Bu izin günü kaldırılsın mı?"
                    okText="Evet"
                    cancelText="Vazgeç"
                    onConfirm={() => handleRemoveLeave(leave.id)}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      loading={removingLeaveId === leave.id}
                      style={{ marginLeft: 6 }}
                    />
                  </Popconfirm>
                </Tag>
              ))}
            </Space>
          )}
        </Card>

        <Card title="Randevulu Hastalarım" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Table
            dataSource={appointments}
            columns={columns}
            rowKey="id"
            loading={tableLoading}
            pagination={false}
            scroll={{ x: 600 }}
          />
        </Card>
      </Content>

      {/* Vaka Notu & Reçete Giriş Modalı */}
      <Modal
        title={`Muayene Notu: ${
          selectedAppointment?.patient
            ? `${selectedAppointment.patient.firstName} ${selectedAppointment.patient.lastName}`
            : ''
        }`}
        open={isModalVisible}
        onOk={handleSaveNote}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={saving}
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

      {/* Laboratuvar Sonucu Ekleme Modalı */}
      <Modal
        title={`Tahlil Sonucu Ekle: ${
          labTargetAppointment?.patient
            ? `${labTargetAppointment.patient.firstName} ${labTargetAppointment.patient.lastName}`
            : ''
        }`}
        open={isLabModalVisible}
        onOk={handleSaveLabResult}
        onCancel={() => setIsLabModalVisible(false)}
        confirmLoading={savingLab}
        okText="Kaydet"
        cancelText="İptal"
      >
        <Form form={labForm} layout="vertical" style={{ marginTop: '16px' }}>
          <Form.Item name="testName" label="Tahlil / Analiz Adı" rules={[{ required: true, message: 'Tahlil adı gerekli' }]}>
            <Input placeholder="Örn. Açlık Kan Şekeri" />
          </Form.Item>
          <Form.Item name="result" label="Sonuç" rules={[{ required: true, message: 'Sonuç değeri gerekli' }]}>
            <Input placeholder="Örn. 95 mg/dL" />
          </Form.Item>
          <Form.Item name="referenceRange" label="Referans Aralığı">
            <Input placeholder="Örn. 70-100 mg/dL" />
          </Form.Item>
          <Form.Item name="testDate" label="Tarih" rules={[{ required: true, message: 'Tarih gerekli' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          {/* Bağlam farkındalı erişim politikası: normalde yalnızca kendi hastanıza
              ve mesai içinde ekleyebilirsiniz. Acil durumda gerekçe bildirilerek
              politika aşılabilir; aşım denetim kaydına ayrıca yazılır. */}
          <Form.Item
            name="acilGerekce"
            label="Acil Erişim Gerekçesi (yalnızca gerekiyorsa)"
            extra="Mesai dışındaysanız veya hasta size atanmamışsa gerekçe zorunludur. Girilen gerekçe denetim kaydına yazılır."
          >
            <Input placeholder="Örn. Hasta acil serviste, sonuç ivedi gerekli" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
