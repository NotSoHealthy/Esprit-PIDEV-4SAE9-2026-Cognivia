import { Frequency } from './frequency.enum';

export interface Medication {
  id?: number;
  name: string;
  imageUrl?: string;
}

export interface PrescriptionItem {
  id?: number;
  quantity: number;
  frequency: Frequency;
  medication: Medication;
}

export interface Prescription {
  id?: number;
  code?: string;
  doctorName: string | null;
  createdByDoctorUserId?: string;
  createdByDoctorUsername?: string;
  patientName: string;
  description: string;
  createdAt?: string;
  expiresAt?: string;
  items?: PrescriptionItem[];
}

export interface PharmacyRecommendation {
  pharmacyId: number;
  pharmacyName: string;
  address: string;
  contactInfo: string;
  bannerUrl?: string;
  logoUrl?: string;
  matchCount: number;
  totalMedications: number;
  totalAvailableQuantity: number;
}
