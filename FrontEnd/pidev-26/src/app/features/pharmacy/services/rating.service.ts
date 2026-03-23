import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api.tokens';
import { Pharmacy } from '../models/pharmacy.model';
import { NewRating, Rating } from '../models/rating.model';

@Injectable({ providedIn: 'root' })
export class RatingService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly baseUrl = `${this.apiBaseUrl}/pharmacy/ratings`;

  getAll(): Observable<Rating[]> {
    return this.http.get<Rating[]>(this.baseUrl);
  }

  getById(id: number): Observable<Rating> {
    return this.http.get<Rating>(`${this.baseUrl}/${id}`);
  }

  create(rating: NewRating): Observable<Rating> {
    return this.http.post<Rating>(this.baseUrl, rating);
  }

  update(id: number, rating: Partial<Rating>): Observable<Rating> {
    return this.http.put<Rating>(`${this.baseUrl}/${id}`, rating);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getByPharmacy(pharmacyId: number): Observable<Rating[]> {
    return this.http.get<Rating[]>(`${this.baseUrl}/pharmacy/${pharmacyId}`);
  }

  getAverage(pharmacyId: number): Observable<{ pharmacyId: number; average: number }> {
    return this.http.get<{ pharmacyId: number; average: number }>(`${this.baseUrl}/pharmacy/${pharmacyId}/average`);
  }

  getFavoritePharmacies(): Observable<Pharmacy[]> {
    return this.http.get<Pharmacy[]>(`${this.baseUrl}/favorites/pharmacies`);
  }
}
