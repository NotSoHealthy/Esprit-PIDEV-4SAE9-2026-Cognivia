import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { Pharmacy, NewPharmacy } from '../models/pharmacy.model';

@Injectable({ providedIn: 'root' })
export class PharmacyService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

getAll(): Observable<Pharmacy[]> {
  return this.http.get<Pharmacy[]>(`${this.apiBaseUrl}/pharmacy/pharmacies`);
}

  getById(id: number): Observable<Pharmacy> {
    return this.http.get<Pharmacy>(`${this.apiBaseUrl}/pharmacy/${id}`);
  }

  create(pharmacy: NewPharmacy): Observable<Pharmacy> {
    return this.http.post<Pharmacy>(`${this.apiBaseUrl}/pharmacy`, pharmacy);
  }

  update(id: number, pharmacy: Partial<Pharmacy>): Observable<Pharmacy> {
    return this.http.put<Pharmacy>(`${this.apiBaseUrl}/pharmacy/${id}`, pharmacy);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/pharmacy/${id}`);
  }
}
