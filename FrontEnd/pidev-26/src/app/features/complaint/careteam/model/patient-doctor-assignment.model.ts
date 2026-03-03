import { DoctorModel } from './doctor.model';

export interface PatientDoctorAssignmentModel {
  id: number;
  createdAt: string;
  active: boolean;
  doctor: DoctorModel | null;
  patient: {
    id: number;
  };
}
