import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RiskScore } from '../../models/cognitive-tests/risk-score.model';
import { API_BASE_URL } from '../../api/api.tokens';

@Injectable({
  providedIn: 'root',
})
export class RiskScoreService {
  private readonly apiUrl = inject(API_BASE_URL);

  constructor(private http: HttpClient) { }

  getAllRisks(): Observable<RiskScore[]> {
    return this.http.get<RiskScore[]>(`${this.apiUrl}/monitoring/risk`);
  }

  getRisksByPatient(patientId: number): Observable<RiskScore[]> {
    return this.http.get<RiskScore[]>(`${this.apiUrl}/monitoring/risk/by-patient/${patientId}`);
  }

  createRisk(risk: RiskScore): Observable<RiskScore> {
    return this.http.post<RiskScore>(`${this.apiUrl}/monitoring/risk`, risk);
  }

  deleteRisk(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/monitoring/risk/${id}`);
  }
}
