export interface RiskScore {
    id?: number;
    patientId: number;
    riskValue: number;
    riskLevel: string;
    generatedAt?: string;
}
