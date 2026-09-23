import { checkAppointmentConflict, formatAppointmentDate } from './conflictValidator';

/**
 * SENARYO TABANLI ÇAKIŞMA KONTROLÜNÜN TESTİ (istemci katmanı)
 *
 * Bu kontrol, istek sunucuya gönderilmeden önce kullanıcıyı uyarmak içindir.
 * Asıl güvence sunucudaki doğrulama ve veritabanı kısıtlarıdır; buradaki testler
 * arayüzün hangi senaryolarda uyarı verdiğini belgeler.
 */
describe('checkAppointmentConflict', () => {
  const randevu = (tarih, durum = 'PENDING') => ({ appointmentDate: tarih, status: durum });

  test('hastanın hiç randevusu yoksa çakışma yoktur', () => {
    expect(checkAppointmentConflict([], '2026-10-01T10:00:00')).toBe(false);
  });

  test('aynı tarih ve saatte mevcut randevu varsa çakışma bildirilir', () => {
    const mevcut = [randevu('2026-10-01T10:00:00')];
    expect(checkAppointmentConflict(mevcut, '2026-10-01T10:00:00')).toBe(true);
  });

  test('farklı doktordan bile olsa aynı saat çakışmadır', () => {
    // Hastanın aynı anda iki yerde olamaması kuralı: doktor bilgisine bakılmaz
    const mevcut = [{ appointmentDate: '2026-10-01T10:00:00', status: 'CONFIRMED', doctor: { id: 1 } }];
    expect(checkAppointmentConflict(mevcut, '2026-10-01T10:00:00')).toBe(true);
  });

  test('farklı saatteki randevu çakışma sayılmaz', () => {
    const mevcut = [randevu('2026-10-01T10:00:00')];
    expect(checkAppointmentConflict(mevcut, '2026-10-01T10:15:00')).toBe(false);
  });

  test('aynı saat farklı gün çakışma sayılmaz', () => {
    const mevcut = [randevu('2026-10-01T10:00:00')];
    expect(checkAppointmentConflict(mevcut, '2026-10-02T10:00:00')).toBe(false);
  });

  test('iptal edilmiş randevu çakışma sayılmaz (saat tekrar müsait olur)', () => {
    const mevcut = [randevu('2026-10-01T10:00:00', 'CANCELLED')];
    expect(checkAppointmentConflict(mevcut, '2026-10-01T10:00:00')).toBe(false);
  });

  test('tamamlanmış randevu hâlâ o saati doldurur', () => {
    const mevcut = [randevu('2026-10-01T10:00:00', 'COMPLETED')];
    expect(checkAppointmentConflict(mevcut, '2026-10-01T10:00:00')).toBe(true);
  });

  test('çok sayıda randevu arasından yalnızca çakışan bulunur', () => {
    const mevcut = [
      randevu('2026-10-01T09:00:00'),
      randevu('2026-10-01T11:00:00', 'CANCELLED'),
      randevu('2026-10-02T10:00:00'),
      randevu('2026-10-01T14:30:00'),
    ];
    expect(checkAppointmentConflict(mevcut, '2026-10-01T14:30:00')).toBe(true);
    expect(checkAppointmentConflict(mevcut, '2026-10-01T11:00:00')).toBe(false);
    expect(checkAppointmentConflict(mevcut, '2026-10-03T09:00:00')).toBe(false);
  });
});

describe('formatAppointmentDate', () => {
  test('tarihi Türkçe okunur biçime çevirir', () => {
    const sonuc = formatAppointmentDate('2026-10-01T10:00:00');
    expect(sonuc).toContain('2026');
    expect(sonuc).toContain('Ekim');
  });
});
