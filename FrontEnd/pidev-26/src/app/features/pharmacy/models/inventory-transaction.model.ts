import { MedicationModel } from './medication.model';
import { Pharmacy } from './pharmacy.model';

export type TransactionType = 'IN' | 'OUT';

export interface InventoryTransaction {
  id?: number;
  quantity: number;
  type: TransactionType;
  transactionAt?: string | null;
  createdAt?: string | null;
  pharmacy: Pharmacy | { id: number };
  medication: MedicationModel | { id: number };
}

export type NewInventoryTransaction = Omit<InventoryTransaction, 'id' | 'createdAt'>;
