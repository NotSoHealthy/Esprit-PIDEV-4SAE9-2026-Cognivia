export enum ComplaintStatus {
  SUBMITTED = 'SUBMITTED',
  VALIDATED = 'VALIDATED',
  DISMISSED = 'DISMISSED',
  APPEALED = 'APPEALED',
  UNDER_INVESTIGATION = 'UNDER_INVESTIGATION',
  ACTION_TAKEN = 'ACTION_TAKEN',
  CLOSED = 'CLOSED',
}

export enum ComplaintCategory {
  PROFESSIONAL_MISCONDUCT = 'PROFESSIONAL_MISCONDUCT',
  NEGLIGENCE = 'NEGLIGENCE',
  RUDE_BEHAVIOR = 'RUDE_BEHAVIOR',
  DELAY_IN_SERVICE = 'DELAY_IN_SERVICE',
  MEDICATION_ERROR = 'MEDICATION_ERROR',
  OTHER = 'OTHER',
}

export enum ComplaintPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum UserRole {
  ROLE_DOCTOR = 'ROLE_DOCTOR',
  ROLE_CAREGIVER = 'ROLE_CAREGIVER',
  ROLE_PATIENT = 'ROLE_PATIENT',
}

export interface ComplaintModel {
  id?: number;
  patientId: number;
  targetUserId: number;
  targetUserRole: UserRole;
  category: ComplaintCategory;
  description: string;
  evidenceUrl?: string;
  priority: ComplaintPriority;
  status?: ComplaintStatus;
  handledByAdminId?: number;
  createdAt?: string;
  reviewedAt?: string;
  investigatedAt?: string;
  resolvedAt?: string;
  resolutionDecision?: string;
  appealMessage?: string;
  whiteboardData?: unknown;
}
