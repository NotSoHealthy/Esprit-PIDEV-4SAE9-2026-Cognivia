export interface TaskHistoryEvent {
  type: string;
  title: string;
  description?: string;
  eventDate: string;
  actor?: string;
  actorType?: 'PATIENT' | 'CAREGIVER' | 'SYSTEM' | 'ADMIN';
  comment?: string;
  statusBefore?: string;
  statusAfter?: string;
  /** INFO | SUCCESS | WARNING | DANGER */
  status: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
}
