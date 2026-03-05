export interface Patient {
    id: number;
    firstName: string;
    lastName: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    dateOfBirth?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    userId?: string;
    checkInFrequency?: number;
}
