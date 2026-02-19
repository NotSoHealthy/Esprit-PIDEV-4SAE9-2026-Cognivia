import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../constants/cognitive-tests/api.constants';
import { RiskScore } from '../../models/cognitive-tests/risk-score.model';

@Injectable({
    providedIn: 'root'
})
export class RiskScoreService {
    constructor(private http: HttpClient) { }

    getAllRisks(): Observable<RiskScore[]> {
        return this.http.get<RiskScore[]>(`${API_BASE_URL}/monitoring/risk`);
    }

    getRisksByPatient(patientId: number): Observable<RiskScore[]> {
        return this.http.get<RiskScore[]>(`${API_BASE_URL}/monitoring/risk/by-patient/${patientId}`);
    }

    createRisk(risk: RiskScore): Observable<RiskScore> {
        return this.http.post<RiskScore>(`${API_BASE_URL}/monitoring/risk`, risk);
    }

    deleteRisk(id: number): Observable<void> {
        return this.http.delete<void>(`${API_BASE_URL}/monitoring/risk/${id}`);
    }
}
