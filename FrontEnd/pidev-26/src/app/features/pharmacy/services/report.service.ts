import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api.tokens';
import { NewReport, Report, ReportReason } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly baseUrl = `${this.apiBaseUrl}/pharmacy/reports`;

  getAll(): Observable<Report[]> {
    return this.http.get<Report[]>(this.baseUrl);
  }

  getById(id: number): Observable<Report> {
    return this.http.get<Report>(`${this.baseUrl}/${id}`);
  }

  create(report: NewReport): Observable<Report> {
    return this.http.post<Report>(this.baseUrl, report);
  }

  update(id: number, report: Partial<Report>): Observable<Report> {
    return this.http.put<Report>(`${this.baseUrl}/${id}`, report);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getByPharmacy(pharmacyId: number): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.baseUrl}/pharmacy/${pharmacyId}`);
  }

  getByReason(reason: ReportReason): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.baseUrl}/reason/${reason}`);
  }
}
