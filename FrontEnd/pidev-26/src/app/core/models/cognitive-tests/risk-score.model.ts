export interface RiskScore {
    id?: number;
    patientId: number;
    riskValue: number;
    riskLevel: string;
    trendDirection?: string;    // IMPROVING, STABLE, DECLINING
    averageScore?: number;      // Weighted average of last N tests
    scoreCount?: number;        // How many tests this is based on
    previousRiskValue?: number; // Previous risk for comparison
    generatedAt?: string;
}
