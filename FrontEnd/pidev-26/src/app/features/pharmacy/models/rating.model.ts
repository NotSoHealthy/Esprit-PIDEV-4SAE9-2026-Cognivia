import { Pharmacy } from './pharmacy.model';

export interface Rating {
  id?: number;
  rating?: number | null;
  username?: string | null;
  comment?: string | null;
  isFavorite?: boolean | null;
  pharmacy?: Pharmacy | { id: number };
}

export type NewRating = Omit<Rating, 'id'>;
