import { EquipmentModel } from '../../models/equipment.model';
import { MaintenanceStatus } from './maintenance-status.enum';

export interface Maintenance {
  id?: number;
  equipment: EquipmentModel;
  maintenanceTime: string;
  maintenanceCompletionTime?: string;
  description: string;
  status: MaintenanceStatus;
}