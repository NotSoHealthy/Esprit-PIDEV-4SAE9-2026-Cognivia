export interface AgentLog {
  id?: number;
  actionType: 'ACCEPTED' | 'REJECTED' | 'MODIFIED' | 'REVIEW_REJECTED';
  medicationName: string;
  reason?: string;
  originalData?: string;
  medicationId?: number;
  timestamp: string;
}
