import axiosInstance from './axiosInstance';

export const appointmentService = {
  // Veritabanındaki Poliklinikleri Çeker
  getDepartments: async () => {
    const response = await axiosInstance.get('/departments');
    return response.data;
  },
  
  // Veritabanındaki Doktorları Çeker
  getDoctors: async () => {
    const response = await axiosInstance.get('/doctors');
    return response.data;
  },

  // Giriş yapan User (role=DOCTOR) için ilişkili Doctor kaydını (ve doctorId'yi) bulur
  getDoctorByUserId: async (userId) => {
    const response = await axiosInstance.get(`/doctors/by-user/${userId}`);
    return response.data;
  },

  // Doktor Portalı: doktorun izin/görev günleri (kural R7 — o günlere randevu açılmaz)
  getDoctorLeaves: async (doctorId) => {
    const response = await axiosInstance.get(`/doctors/${doctorId}/leaves`);
    return response.data;
  },

  addDoctorLeave: async (doctorId, leaveDate, reason) => {
    const response = await axiosInstance.post(`/doctors/${doctorId}/leaves`, { leaveDate, reason });
    return response.data;
  },

  removeDoctorLeave: async (doctorId, leaveId) => {
    const response = await axiosInstance.delete(`/doctors/${doctorId}/leaves/${leaveId}`);
    return response.data;
  },

  // Doktor Portalı: bir doktora ait tüm randevuları çeker
  getDoctorAppointments: async (doctorId) => {
    const response = await axiosInstance.get(`/appointments/doctor/${doctorId}`);
    return response.data;
  },

  // Doktor Portalı: randevuyu onaylar (Onay Bekliyor -> Onaylandı)
  confirmAppointment: async (appointmentId) => {
    const response = await axiosInstance.patch(`/appointments/${appointmentId}/confirm`);
    return response.data;
  },

  // Doktor Portalı: muayeneyi tamamlandı olarak işaretler
  completeAppointment: async (appointmentId) => {
    const response = await axiosInstance.patch(`/appointments/${appointmentId}/complete`);
    return response.data;
  },

  // Doktor Portalı: bir randevuya vaka notu / reçete bilgisi kaydeder
  saveClinicalNote: async (appointmentId, note) => {
    const response = await axiosInstance.patch(`/appointments/${appointmentId}/note`, { note });
    return response.data;
  },

  // Seçilen doktor ve tarihe göre Backend'den 15 dk'lık boş saatleri çeker
  getAvailableSlots: async (doctorId, date) => {
    const response = await axiosInstance.get(`/appointments/available-slots?doctorId=${doctorId}&date=${date}`);
    return response.data;
  },

  // Optimizasyon motoru: hasta için en uygun randevu adaylarını döndürür
  getRecommendations: async (patientId, departmentId) => {
    const params = new URLSearchParams({ patientId });
    if (departmentId) params.append('departmentId', departmentId);
    const response = await axiosInstance.get(`/appointments/recommendations?${params}`);
    return response.data;
  },

  // --- PROGRAM BOZULMASI (Schedule Disruption) ---

  // Doktor: bozulmanın sonucunu hesaplar ama uygulamaz
  previewDisruption: async (doctorId, date, reason, budget) => {
    const response = await axiosInstance.post(`/doctors/${doctorId}/disruptions/preview`,
      { date, reason, budget });
    return response.data;
  },

  // Doktor: planı uygular ve o gün için izin kaydı oluşturur
  applyDisruption: async (doctorId, date, reason, budget) => {
    const response = await axiosInstance.post(`/doctors/${doctorId}/disruptions/apply`,
      { date, reason, budget });
    return response.data;
  },

  // Hasta: kendisine yapılan yeniden planlama önerileri
  getProposals: async (patientId) => {
    const response = await axiosInstance.get(`/appointments/proposals?patientId=${patientId}`);
    return response.data;
  },

  acceptProposal: async (proposalId) => {
    const response = await axiosInstance.patch(`/appointments/proposals/${proposalId}/accept`);
    return response.data;
  },

  rejectProposal: async (proposalId) => {
    const response = await axiosInstance.patch(`/appointments/proposals/${proposalId}/reject`);
    return response.data;
  },

  bookAppointment: async (appointmentData) => {
    const response = await axiosInstance.post('/appointments', appointmentData);
    return response.data;
  },

  getPatientAppointments: async (patientId) => {
    const response = await axiosInstance.get(`/appointments/patient/${patientId}`);
    return response.data;
  },

  // Hasta veya Doktor Portalı: bir randevuyu iptal eder
  cancelAppointment: async (appointmentId) => {
    const response = await axiosInstance.patch(`/appointments/${appointmentId}/cancel`);
    return response.data;
  },
};