import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Table, message, Layout, Tabs, Tag, Select, Row, Col,
  Statistic, Form, Input, Popconfirm, Space, Modal,
} from 'antd';
import {
  LogoutOutlined, SafetyCertificateOutlined, TeamOutlined,
  ApartmentOutlined, CalendarOutlined, CloseCircleOutlined, PlusOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../api/adminService';
import { appointmentService } from '../api/appointmentService';

const { Header, Content } = Layout;

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
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
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

const ROLE_LABELS = { PATIENT: 'Hasta', DOCTOR: 'Doktor', ADMIN: 'Yönetici' };
const ROLE_COLORS = { PATIENT: 'blue', DOCTOR: 'green', ADMIN: 'purple' };

// Backend hata gövdesi düz metin olarak gelir; okunabilir mesajı ayıklayan yardımcı
const backendError = (error, fallback) => {
  const data = error?.response?.data;
  return typeof data === 'string' && data.trim() ? data : fallback;
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const [isDoctorModalVisible, setIsDoctorModalVisible] = useState(false);
  const [savingDoctor, setSavingDoctor] = useState(false);
  const [doctorForm] = Form.useForm();
  const [departmentForm] = Form.useForm();
  const [savingDepartment, setSavingDepartment] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setStats(await adminService.getStats());
    } catch (error) {
      message.error(backendError(error, 'Özet bilgiler yüklenemedi.'));
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      setUsers(await adminService.getUsers());
    } catch (error) {
      message.error(backendError(error, 'Kullanıcı listesi yüklenemedi.'));
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoadingAppointments(true);
    try {
      setAppointments(await adminService.getAllAppointments());
    } catch (error) {
      message.error(backendError(error, 'Randevu listesi yüklenemedi.'));
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      setDepartments(await appointmentService.getDepartments());
    } catch (error) {
      message.error(backendError(error, 'Poliklinikler yüklenemedi.'));
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchAppointments();
    fetchDepartments();
  }, [fetchStats, fetchUsers, fetchAppointments, fetchDepartments]);

  const handleLogout = () => {
    logout();
    message.success('Çıkış yapıldı.');
    navigate('/login/admin');
  };

  // ROL DEĞİŞTİRME: yetkilendirme matrisini çalışma anında değiştiren en kritik işlem.
  // Backend, kendi rolünü düşürme / doktor kaydı olan kullanıcıyı düşürme gibi senaryoları reddeder.
  const handleRoleChange = async (userId, newRole) => {
    setUpdatingRoleId(userId);
    try {
      const updated = await adminService.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      message.success(`Rol güncellendi: ${ROLE_LABELS[updated.role] || updated.role}`);
      fetchStats();
    } catch (error) {
      message.error(backendError(error, 'Rol güncellenirken bir hata oluştu.'));
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    setCancellingId(appointmentId);
    try {
      await appointmentService.cancelAppointment(appointmentId);
      message.success('Randevu iptal edildi.');
      fetchAppointments();
      fetchStats();
    } catch (error) {
      message.error(backendError(error, 'Randevu iptal edilirken bir hata oluştu.'));
    } finally {
      setCancellingId(null);
    }
  };

  const handleCreateDepartment = async () => {
    try {
      const values = await departmentForm.validateFields();
      setSavingDepartment(true);
      await adminService.createDepartment(values.name);
      departmentForm.resetFields();
      message.success('Poliklinik eklendi.');
      fetchDepartments();
      fetchStats();
    } catch (error) {
      if (error?.errorFields) return; // form doğrulama hatası
      message.error(backendError(error, 'Poliklinik eklenirken bir hata oluştu.'));
    } finally {
      setSavingDepartment(false);
    }
  };

  const handleCreateDoctor = async () => {
    try {
      const values = await doctorForm.validateFields();
      setSavingDoctor(true);
      await adminService.createDoctor(values);
      setIsDoctorModalVisible(false);
      doctorForm.resetFields();
      message.success('Doktor tanımlandı ve kullanıcının rolü DOCTOR olarak güncellendi.');
      fetchUsers();
      fetchStats();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(backendError(error, 'Doktor tanımlanırken bir hata oluştu.'));
    } finally {
      setSavingDoctor(false);
    }
  };

  const userColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    {
      title: 'Ad Soyad',
      key: 'name',
      render: (_, record) => `${record.firstName || ''} ${record.lastName || ''}`.trim() || '-',
    },
    { title: 'E-posta', dataIndex: 'email', key: 'email' },
    {
      title: 'Mevcut Rol',
      key: 'role',
      render: (_, record) => (
        <Space>
          <Tag color={ROLE_COLORS[record.role]}>{ROLE_LABELS[record.role] || record.role}</Tag>
          {record.hasDoctorRecord && <Tag color="cyan">doktor kaydı var</Tag>}
        </Space>
      ),
    },
    {
      title: 'Rol Ata',
      key: 'roleAction',
      render: (_, record) => {
        const isSelf = record.id === user?.id;
        return (
          <Select
            value={record.role}
            style={{ width: 150 }}
            disabled={isSelf}
            loading={updatingRoleId === record.id}
            onChange={(value) => handleRoleChange(record.id, value)}
            options={[
              { value: 'PATIENT', label: 'Hasta' },
              { value: 'DOCTOR', label: 'Doktor' },
              { value: 'ADMIN', label: 'Yönetici' },
            ]}
          />
        );
      },
    },
  ];

  const appointmentColumns = [
    {
      title: 'Hasta',
      key: 'patient',
      render: (_, record) =>
        record.patient ? `${record.patient.firstName} ${record.patient.lastName}` : '-',
    },
    {
      title: 'Doktor',
      key: 'doctor',
      render: (_, record) =>
        record.doctor?.user
          ? `${record.doctor.title || ''} ${record.doctor.user.firstName} ${record.doctor.user.lastName}`.trim()
          : '-',
    },
    {
      title: 'Poliklinik',
      key: 'department',
      render: (_, record) => record.doctor?.department?.name || '-',
    },
    {
      title: 'Tarih / Saat',
      key: 'time',
      render: (_, record) => formatAppointmentTime(record.appointmentDate),
    },
    {
      title: 'Durum',
      key: 'status',
      render: (_, record) => (
        <Tag color={STATUS_COLORS[record.status]}>{STATUS_LABELS[record.status] || record.status}</Tag>
      ),
    },
    {
      title: 'İşlem',
      key: 'action',
      render: (_, record) => {
        const isCancellable = record.status !== 'CANCELLED' && record.status !== 'COMPLETED';
        return (
          <Popconfirm
            title="Bu randevuyu yönetici yetkisiyle iptal etmek istediğinize emin misiniz?"
            okText="Evet, İptal Et"
            cancelText="Vazgeç"
            onConfirm={() => handleCancelAppointment(record.id)}
            disabled={!isCancellable}
          >
            <Button danger icon={<CloseCircleOutlined />} disabled={!isCancellable} loading={cancellingId === record.id}>
              İptal Et
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  // Doktor olarak tanımlanabilecek kullanıcılar: henüz doktor kaydı olmayanlar
  const assignableUsers = users.filter((u) => !u.hasDoctorRecord);

  const tabItems = [
    {
      key: 'summary',
      label: <span><SafetyCertificateOutlined /> Özet</span>,
      children: (
        <>
          <Card title="Rol Dağılımı" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col xs={12} md={6}><Statistic title="Toplam Kullanıcı" value={stats?.totalUsers ?? 0} /></Col>
              <Col xs={12} md={6}><Statistic title="Hasta" value={stats?.patientCount ?? 0} valueStyle={{ color: '#1677ff' }} /></Col>
              <Col xs={12} md={6}><Statistic title="Doktor" value={stats?.doctorCount ?? 0} valueStyle={{ color: '#52c41a' }} /></Col>
              <Col xs={12} md={6}><Statistic title="Yönetici" value={stats?.adminCount ?? 0} valueStyle={{ color: '#722ed1' }} /></Col>
            </Row>
          </Card>
          <Card title="Randevu Durumu">
            <Row gutter={16}>
              <Col xs={12} md={4}><Statistic title="Toplam" value={stats?.totalAppointments ?? 0} /></Col>
              <Col xs={12} md={4}><Statistic title="Bekleyen" value={stats?.pendingCount ?? 0} valueStyle={{ color: '#faad14' }} /></Col>
              <Col xs={12} md={4}><Statistic title="Onaylı" value={stats?.confirmedCount ?? 0} valueStyle={{ color: '#1677ff' }} /></Col>
              <Col xs={12} md={4}><Statistic title="Tamamlanan" value={stats?.completedCount ?? 0} valueStyle={{ color: '#52c41a' }} /></Col>
              <Col xs={12} md={4}><Statistic title="İptal" value={stats?.cancelledCount ?? 0} valueStyle={{ color: '#ff4d4f' }} /></Col>
              <Col xs={12} md={4}><Statistic title="Bugün" value={stats?.todayCount ?? 0} prefix={<CalendarOutlined />} /></Col>
            </Row>
          </Card>
        </>
      ),
    },
    {
      key: 'users',
      label: <span><TeamOutlined /> Kullanıcılar ve Roller</span>,
      children: (
        <Card
          title="Kullanıcı Yetki Yönetimi"
          extra={<Button icon={<PlusOutlined />} onClick={() => setIsDoctorModalVisible(true)}>Doktor Tanımla</Button>}
        >
          <p style={{ color: '#888' }}>
            Bir kullanıcının rolünü değiştirmek, o kullanıcının erişebildiği tüm uç noktaları anında değiştirir.
            Kendi rolünüzü değiştiremezsiniz ve doktor kaydına bağlı bir kullanıcının rolü düşürülemez.
          </p>
          <Table dataSource={users} columns={userColumns} rowKey="id" loading={loadingUsers} pagination={{ pageSize: 10 }} scroll={{ x: 800 }} />
        </Card>
      ),
    },
    {
      key: 'departments',
      label: <span><ApartmentOutlined /> Poliklinikler</span>,
      children: (
        <Card title="Poliklinik Tanımlama">
          <Form form={departmentForm} layout="inline" style={{ marginBottom: 24 }}>
            <Form.Item name="name" rules={[{ required: true, message: 'Poliklinik adı gerekli' }]}>
              <Input placeholder="Örn. Kardiyoloji" style={{ width: 260 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" icon={<PlusOutlined />} loading={savingDepartment} onClick={handleCreateDepartment}>
                Ekle
              </Button>
            </Form.Item>
          </Form>
          <Table
            dataSource={departments}
            columns={[
              { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
              { title: 'Poliklinik Adı', dataIndex: 'name', key: 'name' },
            ]}
            rowKey="id"
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: 'appointments',
      label: <span><CalendarOutlined /> Tüm Randevular</span>,
      children: (
        <Card title="Randevu Denetimi">
          <p style={{ color: '#888' }}>
            Hasta ve doktor yalnızca kendi randevularını görebilirken, yönetici sistemdeki tüm randevuları görür ve iptal edebilir.
          </p>
          <Table
            dataSource={appointments}
            columns={appointmentColumns}
            rowKey="id"
            loading={loadingAppointments}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 900 }}
          />
        </Card>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2>🛡️ MHRS - Yönetici Portalı</h2>
        <Space>
          <span style={{ color: '#888' }}>{user?.firstName} {user?.lastName}</span>
          <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout}>
            Çıkış Yap
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <Tabs defaultActiveKey="summary" items={tabItems} />
      </Content>

      {/* Doktor Tanımlama Modalı: mevcut bir kullanıcıyı poliklinik + unvan ile doktor yapar */}
      <Modal
        title="Doktor Tanımla"
        open={isDoctorModalVisible}
        onOk={handleCreateDoctor}
        onCancel={() => setIsDoctorModalVisible(false)}
        confirmLoading={savingDoctor}
        okText="Tanımla"
        cancelText="Vazgeç"
      >
        <p style={{ color: '#888' }}>
          Seçilen kullanıcı için bir doktor kaydı açılır ve rolü otomatik olarak DOCTOR'a yükseltilir.
        </p>
        <Form form={doctorForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="userId" label="Kullanıcı" rules={[{ required: true, message: 'Kullanıcı seçiniz' }]}>
            <Select
              showSearch
              placeholder="Doktor yapılacak kullanıcıyı seçin"
              optionFilterProp="label"
              options={assignableUsers.map((u) => ({
                value: u.id,
                label: `${u.firstName} ${u.lastName} (${u.email})`,
              }))}
            />
          </Form.Item>
          <Form.Item name="departmentId" label="Poliklinik" rules={[{ required: true, message: 'Poliklinik seçiniz' }]}>
            <Select
              placeholder="Poliklinik seçin"
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
          </Form.Item>
          <Form.Item name="title" label="Unvan">
            <Input placeholder="Örn. Uzm. Dr." />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
