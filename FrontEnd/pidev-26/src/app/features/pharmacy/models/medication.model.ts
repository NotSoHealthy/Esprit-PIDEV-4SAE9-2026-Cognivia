export interface MedicationModel {
  id?: number;
  name: string;
  status?: 'PENDING' | 'ACCEPTED' | string;
  medicationStatus?: 'PENDING' | 'ACCEPTED' | string;
  imageUrl?: string;
  therapeuticClass?: string;
  description?: string;
  stockQuantity?: number;
  outOfStock?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type NewMedication = Omit<MedicationModel, 'id' | 'createdAt' | 'updatedAt'>;
