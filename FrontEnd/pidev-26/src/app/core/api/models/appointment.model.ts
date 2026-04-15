export type AppointmentStatus = 'PENDING' | 'APPROVED' | 'CANCELLED' | 'COMPLETED';

export interface Appointment {
  id?: number;

  caregiverId: number;
  patientId: number;
  doctorId: number;

  appointmentDate: string; // ISO string

  // ✅ recommandé (souvent obligatoire backend)
  durationMinutes?: number;

  status?: AppointmentStatus;
  notes?: string | null;
  meetLink?: string;


  createdAt?: string;
  updatedAt?: string;
}