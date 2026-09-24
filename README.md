# MHRS — Merkezi Hastane Randevu Sistemi (Arayüz)

Lisans tezi kapsamında geliştirilen randevu sisteminin React arayüzü.
Tezin iki ekseni: **senaryo tabanlı çakışma yönetimi** ve **rol tabanlı yetkilendirme**.

- **Teknolojiler:** React 19, React Router 7, Ant Design 6, Axios
- **Sunucu (ayrı depo):** Spring Boot — `merkezi-randevu-sistemi`

---

## Çalıştırma

```bash
npm install
npm start     # http://localhost:3000
npm test      # test takımı
npm run build # üretim derlemesi
```

Backend'in `http://localhost:8081` adresinde çalışıyor olması gerekir
(adres: `src/api/axiosInstance.js`).

### Örnek hesaplar

Şifre hepsinde `123456`:

| E-posta | Rol | Portal |
|---|---|---|
| `admin@hastane.com` | Yönetici | `/admin-dashboard` |
| `ahmet@hastane.com` | Doktor | `/doctor-dashboard` |
| (Kayıt Ol ile açılan hesap) | Hasta | `/patient-dashboard` |

---

## Rol tabanlı erişim

Her rolün **ayrı giriş ekranı** vardır (`/login/patient`, `/login/doctor`,
`/login/admin`). Doğru şifreyle giriş yapılsa bile hesabın rolü ekranın rolüyle
uyuşmuyorsa giriş reddedilir — hangi portalın kullanılması gerektiği söylenir.

| Katman | Dosya | Davranış |
|---|---|---|
| Oturum durumu | `context/AuthContext.js` | Oturumu `localStorage`'dan geri yükler, sayfa yenilemede korunur |
| İstek yetkisi | `api/axiosInstance.js` | Her isteğe `Bearer` token ekler |
| Oturum sonu | `api/axiosInstance.js` | **401** → oturumu kapatır ve uyarır; **403** → oturum korunur |
| Sayfa erişimi | `components/ProtectedRoute.jsx` | Giriş yoksa giriş ekranına; yanlış roldeyse kendi portalına yönlendirir |

**401 / 403 ayrımı önemlidir:** 401 "kimliğin doğrulanamadı" (token yok veya
süresi doldu) demektir ve oturumun kapatılmasını gerektirir. 403 ise "kimliğin
geçerli ama bu kaynağa yetkin yok" demektir; kullanıcıyı sistemden atmak yanlış
olur. Giriş denemeleri bu kuralın dışındadır — hatalı şifre de 401 döner, ama
onu giriş ekranının kendisi bildirir.

### Kayıt ve giriş güvenliği

Kayıt ekranı şifre gereksinimini gösterir (en az 8 karakter, harf + rakam) ancak
kural **sunucuda** uygulanır; arayüzdeki metin yalnızca bilgilendirmedir. Ardışık
hatalı girişlerde sunucu kalan deneme hakkını bildirir, eşik aşılınca hesabı
geçici olarak kilitler.

---

## Portallar

**Hasta** (`pages/PatientDashboard.jsx`) — poliklinik/doktor/tarih seçimi ve
sunucudan gelen müsait saatler, randevu alma ve iptal, sağlık profili (boy, kilo,
VKİ, kan grubu, alerji), laboratuvar sonuçları. Takvimde geçmiş günler ve 30 gün
sonrası seçilemez.

**Doktor** (`pages/DoctorDashboard.jsx`) — kendi hasta listesi, vaka notu ve
reçete girişi, tahlil sonucu ekleme, randevu onaylama ve muayene tamamlama,
izin/görev günü yönetimi.

**Yönetici** (`pages/AdminDashboard.jsx`) — rol ve randevu dağılımı özeti,
kullanıcı rollerini değiştirme, poliklinik ve doktor tanımlama, sistemdeki tüm
randevuların denetimi ve **denetim kayıtları** (kim, ne zaman, neyi, hangi
adresten — işlem türüne göre süzülebilir).

---

## Çakışma kontrolü

`utils/conflictValidator.js`, istek sunucuya gönderilmeden önce hastanın aynı
saatte başka randevusu olup olmadığını denetler ve uyarı gösterir. İptal edilmiş
randevular çakışma sayılmaz.

Bu kontrol bir **kolaylıktır, güvence değildir**: tarayıcı arayüzü devre dışı
bırakılıp istek doğrudan API'ye gönderilebilir. Asıl doğrulama sunucudaki kural
katmanında, nihai garanti ise veritabanındaki kısıtlardadır. Aynı ayrım takvim
kısıtı için de geçerlidir — tarih sınırı hem burada hem sunucuda uygulanır.

## Testler

```bash
npm test
```

`utils/conflictValidator.test.js` — 9 senaryo: aynı saat çakışması (doktor farklı
olsa bile), iptal edilen randevunun saatinin serbest kalması, tamamlanmış
randevunun saati doldurması, farklı gün/saat durumları.
