import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api.tokens';
import { DayOfWeek, NewWorkingHours, WorkingHours } from '../models/working-hours.model';

@Injectable({ providedIn: 'root' })
export class WorkingHoursService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly baseUrl = `${this.apiBaseUrl}/pharmacy/working-hours`;

  getAll(): Observable<WorkingHours[]> {
    return this.http.get<WorkingHours[]>(this.baseUrl);
  }

  getById(id: number): Observable<WorkingHours> {
    return this.http.get<WorkingHours>(`${this.baseUrl}/${id}`);
  }

  create(workingHours: NewWorkingHours): Observable<WorkingHours> {
    return this.http.post<WorkingHours>(this.baseUrl, workingHours);
  }

  update(id: number, workingHours: Partial<WorkingHours>): Observable<WorkingHours> {
    return this.http.put<WorkingHours>(`${this.baseUrl}/${id}`, workingHours);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getByPharmacy(pharmacyId: number): Observable<WorkingHours[]> {
    return this.http.get<WorkingHours[]>(`${this.baseUrl}/pharmacy/${pharmacyId}`);
  }

  getByDay(pharmacyId: number, day: DayOfWeek): Observable<WorkingHours> {
    return this.http.get<WorkingHours>(`${this.baseUrl}/pharmacy/${pharmacyId}/day/${day}`);
  }

  isPharmacyOpen(pharmacyId: number, day: DayOfWeek, time: string): Observable<boolean> {
    const params = new HttpParams().set('day', day).set('time', time);
    return this.http.get<boolean>(`${this.baseUrl}/pharmacy/${pharmacyId}/is-open`, { params });
  }

  updateDayWorkingHours(
    pharmacyId: number,
    day: DayOfWeek,
    openTime: string | null,
    closeTime: string | null,
    isClosed?: boolean
  ): Observable<WorkingHours> {
    let params = new HttpParams();
    if (openTime) params = params.set('openTime', openTime);
    if (closeTime) params = params.set('closeTime', closeTime);
    if (isClosed !== undefined) params = params.set('isClosed', isClosed);

    return this.http.patch<WorkingHours>(
      `${this.baseUrl}/pharmacy/${pharmacyId}/day/${day}`,
      null,
      { params }
    );
  }

  closePharmacyForDay(pharmacyId: number, day: DayOfWeek): Observable<WorkingHours> {
    return this.http.post<WorkingHours>(
      `${this.baseUrl}/pharmacy/${pharmacyId}/close/${day}`,
      null
    );
  }

  openPharmacyForDay(
    pharmacyId: number,
    day: DayOfWeek,
    openTime: string,
    closeTime: string
  ): Observable<WorkingHours> {
    const params = new HttpParams().set('openTime', openTime).set('closeTime', closeTime);
    return this.http.post<WorkingHours>(
      `${this.baseUrl}/pharmacy/${pharmacyId}/open/${day}`,
      null,
      { params }
    );
  }

  initializeDefaultWorkingHours(
    pharmacyId: number,
    openTime: string,
    closeTime: string
  ): Observable<void> {
    const params = new HttpParams().set('openTime', openTime).set('closeTime', closeTime);
    return this.http.post<void>(
      `${this.baseUrl}/pharmacy/${pharmacyId}/initialize-default`,
      null,
      { params }
    );
  }
}
