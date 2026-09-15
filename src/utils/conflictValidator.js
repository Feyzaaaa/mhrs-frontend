/**
 * Senaryo Tabanlı Çakışma Yönetimi (Conflict Management)
 * Aynı doktor için aynı tarih ve saat diliminde çakışan bir randevu olup olmadığını denetler.
 */
export const checkAppointmentConflict = (existingAppointments, newAppointment) => {
    // existingAppointments: Hastanın veya doktorun mevcut randevu listesi
    // newAppointment: { doctorId, date, time } formatındaki yeni randevu talebi
  
    const isConflict = existingAppointments.some(
      (appointment) => 
        appointment.doctor === newAppointment.doctor &&
        appointment.date === newAppointment.date
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