import axios from 'axios';

// AuthContext'in oturum bilgisini (token, rol, kullanıcı verisi) sakladığı localStorage anahtarı
export const AUTH_STORAGE_KEY = 'mhrs_auth';

// BACKEND ADRESİ SABİT YAZILMAZ.
// Sabit "localhost" yazıldığında uygulama yalnızca backend ile aynı makinede çalışır:
// telefondan veya canlı sunucudan açıldığında tarayıcı KENDİ localhost'una istek atar
// ve sistem çalışmaz. Adres bu yüzden iki aşamalı olarak belirlenir:
//
//   1) REACT_APP_API_URL derleme anında verilmişse o kullanılır (canlı yayın için).
//   2) Verilmemişse, sayfanın açıldığı host'un 8081 portu varsayılır. Böylece
//      localhost:3000 -> localhost:8081, 192.168.1.106:3000 -> 192.168.1.106:8081
//      olur ve aynı ağdaki telefondan test hiçbir ayar gerektirmez.
const varsayilanApiAdresi = `${window.location.protocol}//${window.location.hostname}:8081/api`;

export const API_TABAN_ADRESI = process.env.REACT_APP_API_URL || varsayilanApiAdresi;

const axiosInstance = axios.create({
  baseURL: API_TABAN_ADRESI,
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

// Oturum sonlandığında tüm uygulamanın haberdar olması için: AuthContext bu olayı dinler
export const SESSION_EXPIRED_EVENT = 'mhrs:session-expired';

// YANIT DENETİMİ: Backend iki farklı durumu ayrı kodlarla bildirir.
//   401 -> kimlik doğrulanamadı (token yok / süresi dolmuş / bozuk)  => oturumu kapat
//   403 -> kimlik var ama rol veya sahiplik yetersiz                 => oturum korunur
// 403'te oturumu kapatmak yanlış olurdu: kullanıcı geçerli bir oturuma sahiptir,
// yalnızca o kaynağa erişemez.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Giriş/kayıt istekleri hariç tutulur: hatalı şifre de 401 döner ama bu
    // "oturum sona erdi" değildir; o hatayı giriş ekranının kendisi gösterir.
    const requestUrl = error.config?.url || '';
    const isAuthAttempt = requestUrl.includes('/users/login') || requestUrl.includes('/users/register');

    if (error.response?.status === 401 && !isAuthAttempt) {
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch (storageError) {
        // localStorage erişilemiyorsa yine de olayı yayınla
      }
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;