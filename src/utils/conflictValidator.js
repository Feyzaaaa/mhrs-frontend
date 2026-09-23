/**
 * Senaryo Tabanlı Çakışma Yönetimi (Conflict Management)
 * Hastanın mevcut randevuları arasında, tam olarak aynı tarih/saate denk gelen
 * (doktor farklı olsa bile) bir randevu olup olmadığını denetler. İptal edilen
 * randevular çakışma sayılmaz.
 */
export const checkAppointmentConflict = (existingAppointments, newAppointmentDateTime) => {
    // existingAppointments: Hastanın backend'den gelen mevcut randevu listesi (appointmentDate, status alanlarıyla)
    // newAppointmentDateTime: Yeni randevu talebinin ISO tarih/saat string'i (örn. "2026-10-01T10:00:00")

    const newTime = new Date(newAppointmentDateTime).getTime();

    const isConflict = existingAppointments.some(
      (appointment) =>
        appointment.status !== 'CANCELLED' &&
        new Date(appointment.appointmentDate).getTime() === newTime
    );

    return isConflict; // Eğer true dönerse çakışma var demektir!
  };
  
  /**
   * Tarih ve Saat Biçimlendirici (Uluslararası Standart)
   */
  export const formatAppointmentDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };