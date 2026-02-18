import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RISK_API_URL } from '../../constants/cognitive-tests/api.constants';
import { RiskScore } from '../../models/cognitive-tests/risk-score.model';

@Injectable({
    providedIn: 'root'
})
export class RiskScoreService {
    constructor(private http: HttpClient) { }

    getAllRisks(): Observable<RiskScore[]> {
        return this.http.get<RiskScore[]>(RISK_API_URL);
    }

    getRisksByPatient(patientId: number): Observable<RiskScore[]> {
        return this.http.get<RiskScore[]>(`${RISK_API_URL}/by-patient/${patientId}`);
    }

    createRisk(risk: RiskScore): Observable<RiskScore> {
        return this.http.post<RiskScore>(RISK_API_URL, risk);
    }

    deleteRisk(id: number): Observable<void> {
        return this.http.delete<void>(`${RISK_API_URL}/${id}`);
    }
}
