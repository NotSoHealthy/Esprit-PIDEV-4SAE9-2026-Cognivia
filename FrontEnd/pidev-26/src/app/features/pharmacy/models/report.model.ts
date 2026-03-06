import { Pharmacy } from './pharmacy.model';

export enum ReportReason {
  FALSE_LOCATION = 'FALSE_LOCATION',
  BAD_SERVICE = 'BAD_SERVICE',
  STOCK_INCONSISTENCY = 'STOCK_INCONSISTENCY',
  FAKE_PHARMACY = 'FAKE_PHARMACY',
  WRONG_CONTACT_INFO = 'WRONG_CONTACT_INFO',
  OTHER = 'OTHER',
}

export interface Report {
  id?: number;
  reason: ReportReason;
  description?: string | null;
  username?: string | null;
  pharmacy?: Pharmacy | { id: number };
}

export type NewReport = Omit<Report, 'id'>;
