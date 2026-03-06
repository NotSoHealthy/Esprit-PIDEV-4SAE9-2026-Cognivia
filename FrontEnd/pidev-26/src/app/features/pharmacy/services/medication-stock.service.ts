import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api.tokens';
import { MedicationStock, NewMedicationStock } from '../models/medication-stock.model';

@Injectable({ providedIn: 'root' })
export class MedicationStockService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly baseUrl = `${this.apiBaseUrl}/pharmacy/medication-stocks`;

  getAll(): Observable<MedicationStock[]> {
    return this.http.get<MedicationStock[]>(this.baseUrl);
  }

  getById(id: number): Observable<MedicationStock> {
    return this.http.get<MedicationStock>(`${this.baseUrl}/${id}`);
  }

  create(stock: NewMedicationStock): Observable<MedicationStock> {
    return this.http.post<MedicationStock>(this.baseUrl, stock);
  }

  update(id: number, stock: Partial<MedicationStock>): Observable<MedicationStock> {
    return this.http.put<MedicationStock>(`${this.baseUrl}/${id}`, stock);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getByPharmacy(pharmacyId: number): Observable<MedicationStock[]> {
    return this.http.get<MedicationStock[]>(`${this.baseUrl}/pharmacy/${pharmacyId}`);
  }

  getByPharmacyAndMedication(
    pharmacyId: number,
    medicationId: number
  ): Observable<MedicationStock> {
    return this.http.get<MedicationStock>(
      `${this.baseUrl}/pharmacy/${pharmacyId}/medication/${medicationId}`
    );
  }

  updateQuantity(
    pharmacyId: number,
    medicationId: number,
    quantity: number
  ): Observable<MedicationStock> {
    const params = new HttpParams().set('quantity', quantity);
    return this.http.patch<MedicationStock>(
      `${this.baseUrl}/pharmacy/${pharmacyId}/medication/${medicationId}/quantity`,
      null,
      { params }
    );
  }

  decreaseQuantity(
    pharmacyId: number,
    medicationId: number,
    amount: number
  ): Observable<MedicationStock> {
    const params = new HttpParams().set('amount', amount);
    return this.http.patch<MedicationStock>(
      `${this.baseUrl}/pharmacy/${pharmacyId}/medication/${medicationId}/decrease`,
      null,
      { params }
    );
  }

  increaseQuantity(
    pharmacyId: number,
    medicationId: number,
    amount: number
  ): Observable<MedicationStock> {
    const params = new HttpParams().set('amount', amount);
    return this.http.patch<MedicationStock>(
      `${this.baseUrl}/pharmacy/${pharmacyId}/medication/${medicationId}/increase`,
      null,
      { params }
    );
  }
}
