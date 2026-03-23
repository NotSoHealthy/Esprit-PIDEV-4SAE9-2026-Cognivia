import { MedicationModel } from './medication.model';
import { Pharmacy } from './pharmacy.model';

export interface MedicationStock {
  id?: number;
  quantity: number;
  pharmacy: Pharmacy | { id: number };
  medication: MedicationModel | { id: number };
}

export type NewMedicationStock = Omit<MedicationStock, 'id'>;
