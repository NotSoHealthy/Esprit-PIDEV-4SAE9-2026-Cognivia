import { EquipmentModel } from '../../models/equipment.model';
import { ReservationStatus } from './reservation-status.enum';

export interface ReservationModel {
  id?: number;

  patientId: number;

  equipment: EquipmentModel;

  reservationDate: string;
  returnDate: string;

  status: ReservationStatus;

  userIdAssignedBy: string | number;

  userRoleAssignedBy: string;
}