import axios from 'axios';

// AuthContext'in oturum bilgisini (token, rol, kullanıcı verisi) sakladığı localStorage anahtarı
export const AUTH_STORAGE_KEY = 'mhrs_auth';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8081/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// İstek gönderilmeden önce localStorage'dan token'ı ekleyelim (Güvenlik ve yetkilendirme için şart)
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      const auth = raw ? JSON.parse(raw) : null;
      if (auth?.token) {
        config.headers.Authorization = `Bearer ${auth.token}`;
      }
    } catch (error) {
      // Bozuk localStorage verisi varsa token eklemeden devam et
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;