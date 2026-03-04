export interface Patient {
    id: number;
    firstName: string;
    lastName: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    dateOfBirth?: string;
    userId?: string;
    checkInFrequency?: number;
}
