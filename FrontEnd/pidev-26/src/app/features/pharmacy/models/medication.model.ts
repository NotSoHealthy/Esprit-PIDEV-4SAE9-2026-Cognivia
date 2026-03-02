export interface MedicationModel {
  id?: number;
  name: string;
  imageUrl?: string;
  therapeuticClass?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type NewMedication = Omit<MedicationModel, 'id' | 'createdAt' | 'updatedAt'>;
