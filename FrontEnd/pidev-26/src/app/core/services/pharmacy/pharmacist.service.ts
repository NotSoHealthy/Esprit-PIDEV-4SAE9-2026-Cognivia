import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../api/api.tokens';

export interface Pharmacist {
  id?: number;
  userId?: string;
  firstName: string;
  lastName: string;
  licenseNumber?: string;
  phoneNumber?: string;
  pharmacyId?: number | null;
  pharmacy?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PharmacistService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getAllPharmacists(): Observable<Pharmacist[]> {
    return this.http.get<Pharmacist[]>(`${this.apiBaseUrl}/pharmacy/pharmacist`);
  }

  getPharmacistById(id: number): Observable<Pharmacist> {
    return this.http.get<Pharmacist>(`${this.apiBaseUrl}/pharmacy/pharmacist/${id}`);
  }

  getPharmacistByUserId(userId: string): Observable<Pharmacist> {
    return this.http.get<Pharmacist>(`${this.apiBaseUrl}/pharmacy/pharmacist/user/${userId}`);
  }

  assignPharmacyToUser(userId: string, pharmacyId: number): Observable<Pharmacist> {
    return this.http.patch<Pharmacist>(
      `${this.apiBaseUrl}/pharmacy/pharmacist/user/${userId}/assign-pharmacy/${pharmacyId}`,
      {}
    );
  }

  getPharmacistsByPharmacyId(pharmacyId: number): Observable<Pharmacist[]> {
    return this.http.get<Pharmacist[]>(`${this.apiBaseUrl}/pharmacy/pharmacist/pharmacy/${pharmacyId}`);
  }

  createPharmacist(pharmacist: Pharmacist): Observable<Pharmacist> {
    return this.http.post<Pharmacist>(`${this.apiBaseUrl}/pharmacy/pharmacist`, pharmacist);
  }

  registerPharmacist(userId: string, pharmacist: Pharmacist): Observable<Pharmacist> {
    return this.http.post<Pharmacist>(`${this.apiBaseUrl}/pharmacy/pharmacist/register/${userId}`, pharmacist);
  }

  updatePharmacist(id: number, pharmacist: Pharmacist): Observable<Pharmacist> {
    return this.http.put<Pharmacist>(`${this.apiBaseUrl}/pharmacy/pharmacist/${id}`, pharmacist);
  }

  deletePharmacist(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/pharmacy/pharmacist/${id}`);
  }
}
