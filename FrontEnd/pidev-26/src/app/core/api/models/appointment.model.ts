export type AppointmentStatus = 'PENDING' | 'APPROVED' | 'CANCELLED' | 'COMPLETED';

export interface Appointment {
  id?: number;
  caregiverId: number;
  patientId: number;
  doctorId: number;
  appointmentDate: string; // ISO string
  status?: AppointmentStatus;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}