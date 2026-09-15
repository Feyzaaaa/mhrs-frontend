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

  // Seçilen doktor ve tarihe göre Backend'den 15 dk'lık boş saatleri çeker
  getAvailableSlots: async (doctorId, date) => {
    const response = await axiosInstance.get(`/appointments/available-slots?doctorId=${doctorId}&date=${date}`);
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
};