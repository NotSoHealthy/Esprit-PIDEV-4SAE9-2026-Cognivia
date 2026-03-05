import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../api/api.tokens';
import { RiskScore } from '../../models/cognitive-tests/risk-score.model';

@Injectable({
    providedIn: 'root'
})
export class RiskScoreService {
    private apiBaseUrl = inject(API_BASE_URL);

    constructor(private http: HttpClient) { }

    getAllRisks(): Observable<RiskScore[]> {
        return this.http.get<RiskScore[]>(`${this.apiBaseUrl}/monitoring/risk`);
    }

    getRisksByPatient(patientId: number): Observable<RiskScore[]> {
        return this.http.get<RiskScore[]>(`${this.apiBaseUrl}/monitoring/risk/by-patient/${patientId}`);
    }

    createRisk(risk: RiskScore): Observable<RiskScore> {
        return this.http.post<RiskScore>(`${this.apiBaseUrl}/monitoring/risk`, risk);
    }

    deleteRisk(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiBaseUrl}/monitoring/risk/${id}`);
    }
}
