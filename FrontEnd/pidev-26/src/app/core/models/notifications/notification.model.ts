export type RecipientType = 'PATIENT' | 'DOCTOR' | 'CAREGIVER' | 'PHARMACY' | 'ADMIN';

export type NotificationPriority = 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface Notification {
    id: string;
    recipientId: number;
    recipientType: RecipientType;
    title: string;
    message: string;
    eventType: string;
    referenceId: number | null;
    seen: boolean;
    readAt: string | null;
    priority: NotificationPriority;
    createdAt: string;
}