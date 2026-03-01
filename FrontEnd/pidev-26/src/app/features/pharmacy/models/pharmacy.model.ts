export interface Pharmacy {
  id?: number;
  name: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type NewPharmacy = Omit<Pharmacy, 'id' | 'createdAt' | 'updatedAt'>;
