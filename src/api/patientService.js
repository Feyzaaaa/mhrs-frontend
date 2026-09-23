import axiosInstance from './axiosInstance';

export const patientService = {
  // Hastanın genel sağlık/iletişim profilini çeker (boy, kilo, yaş, cinsiyet, kan grubu, alerjiler, telefon)
  getProfile: async (userId) => {
    const response = await axiosInstance.get(`/patient-profiles/by-user/${userId}`);
    return response.data;
  },

  // Hasta profilini oluşturur/günceller
  updateProfile: async (userId, profileData) => {
    const response = await axiosInstance.put(`/patient-profiles/by-user/${userId}`, profileData);
    return response.data;
  },

  // Hastanın laboratuvar sonuçlarını (tahlil/analiz) çeker
  getLabResults: async (patientId) => {
    const response = await axiosInstance.get(`/lab-results/patient/${patientId}`);
    return response.data;
  },

  // Doktor Portalı: hastaya yeni bir laboratuvar sonucu ekler
  addLabResult: async (labResultData) => {
    const response = await axiosInstance.post('/lab-results', labResultData);
    return response.data;
  },
};
