import { CaregiverModel } from './caregiver.model';

export interface PatientModel {
  id: number;
  userId: string;
  firstName: string;
  lastName: string;
  caregiverList: CaregiverModel[];
}
