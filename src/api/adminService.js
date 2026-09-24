import axiosInstance from './axiosInstance';

// YÖNETİCİ PORTALI SERVİSİ
// Buradaki tüm uç noktalar backend'de "/api/admin/**" deseniyle ADMIN rolüne kilitlidir;
// hasta veya doktor token'ı ile çağrılırsa sunucu 403 döner.
export const adminService = {
  // Özet: rol dağılımı, randevu durumları, bugünün randevu sayısı
  getStats: async () => {
    const response = await axiosInstance.get('/admin/stats');
    return response.data;
  },

  // Sistemdeki tüm kullanıcılar (rolleriyle birlikte)
  getUsers: async () => {
    const response = await axiosInstance.get('/admin/users');
    return response.data;
  },

  // Bir kullanıcının rolünü değiştirir (PATIENT / DOCTOR / ADMIN)
  updateUserRole: async (userId, role) => {
    const response = await axiosInstance.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  // Denetim: sistemdeki tüm randevular
  getAllAppointments: async () => {
    const response = await axiosInstance.get('/admin/appointments');
    return response.data;
  },

  // Denetim kayıtları: kim, ne zaman, neyi yaptı (yalnızca okunur)
  getAuditLogs: async (page = 0, size = 50, action) => {
    const params = new URLSearchParams({ page, size });
    if (action) params.append('action', action);
    const response = await axiosInstance.get(`/admin/audit-logs?${params}`);
    return response.data;
  },

  // Yeni poliklinik tanımlar
  createDepartment: async (name) => {
    const response = await axiosInstance.post('/admin/departments', { name });
    return response.data;
  },

  // Mevcut bir kullanıcıyı doktor olarak tanımlar (rolünü de DOCTOR'a yükseltir)
  createDoctor: async ({ userId, departmentId, title }) => {
    const response = await axiosInstance.post('/admin/doctors', { userId, departmentId, title });
    return response.data;
  },
};
