import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api.tokens';
import {
  InventoryTransaction,
  NewInventoryTransaction,
  TransactionType,
} from '../models/inventory-transaction.model';

@Injectable({ providedIn: 'root' })
export class InventoryTransactionService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly baseUrl = `${this.apiBaseUrl}/pharmacy/inventory-transactions`;

  getAll(): Observable<InventoryTransaction[]> {
    return this.http.get<InventoryTransaction[]>(this.baseUrl);
  }

  getById(id: number): Observable<InventoryTransaction> {
    return this.http.get<InventoryTransaction>(`${this.baseUrl}/${id}`);
  }

  create(transaction: NewInventoryTransaction): Observable<InventoryTransaction> {
    return this.http.post<InventoryTransaction>(this.baseUrl, transaction);
  }

  update(id: number, transaction: Partial<InventoryTransaction>): Observable<InventoryTransaction> {
    return this.http.put<InventoryTransaction>(`${this.baseUrl}/${id}`, transaction);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getByPharmacy(pharmacyId: number): Observable<InventoryTransaction[]> {
    return this.http.get<InventoryTransaction[]>(`${this.baseUrl}/pharmacy/${pharmacyId}`);
  }

  getByMedication(medicationId: number): Observable<InventoryTransaction[]> {
    return this.http.get<InventoryTransaction[]>(`${this.baseUrl}/medication/${medicationId}`);
  }

  getByPharmacyAndMedication(
    pharmacyId: number,
    medicationId: number
  ): Observable<InventoryTransaction[]> {
    return this.http.get<InventoryTransaction[]>(
      `${this.baseUrl}/pharmacy/${pharmacyId}/medication/${medicationId}`
    );
  }

  createAndApplyTransaction(
    transaction: NewInventoryTransaction
  ): Observable<InventoryTransaction> {
    return this.http.post<InventoryTransaction>(`${this.baseUrl}/apply`, transaction);
  }

  getPendingTransactions(): Observable<InventoryTransaction[]> {
    return this.http.get<InventoryTransaction[]>(`${this.baseUrl}/pending`);
  }

  getByType(type: TransactionType): Observable<InventoryTransaction[]> {
    return this.http.get<InventoryTransaction[]>(`${this.baseUrl}/type/${type}`);
  }

  getIncomingTransactions(): Observable<InventoryTransaction[]> {
    return this.http.get<InventoryTransaction[]>(`${this.baseUrl}/incoming`);
  }

  getOutgoingTransactions(): Observable<InventoryTransaction[]> {
    return this.http.get<InventoryTransaction[]>(`${this.baseUrl}/outgoing`);
  }
}
