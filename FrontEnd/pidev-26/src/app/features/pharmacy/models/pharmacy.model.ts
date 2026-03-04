export interface Pharmacy {
  id?: number;
  name: string;
  address?: string;
  description?: string;
  contactInfo?: string;
  latitude?: number | null;
  longitude?: number | null;

  bannerUrl?: string | null;
  logoUrl?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}

export type NewPharmacy = Omit<Pharmacy, 'id' | 'createdAt' | 'updatedAt'>;
