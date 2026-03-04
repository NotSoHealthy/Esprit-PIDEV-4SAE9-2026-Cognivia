import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PharmacyRecommendation, Prescription, PrescriptionItem } from '../models/prescription.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private readonly apiUrl = `${environment.apiBaseUrl}/pharmacy/prescriptions`;

  constructor(private http: HttpClient) {}

  // Get all prescriptions
  getAll(): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(this.apiUrl);
  }

  getVisibleByPatientNames(patientNames: string[]): Observable<Prescription[]> {
    const names = (patientNames ?? []).map((n) => (n ?? '').trim()).filter((n) => n.length > 0);
    const params = new URLSearchParams();
    names.forEach((name) => params.append('patientNames', name));
    const queryString = params.toString();
    const url = queryString ? `${this.apiUrl}/visible?${queryString}` : `${this.apiUrl}/visible?patientNames=`;
    return this.http.get<Prescription[]>(url);
  }

  // Get prescription by ID
  getById(id: number): Observable<Prescription> {
    return this.http.get<Prescription>(`${this.apiUrl}/${id}`);
  }

  // Create new prescription
  create(prescription: Prescription): Observable<Prescription> {
    return this.http.post<Prescription>(this.apiUrl, prescription);
  }

  // Update prescription
  update(id: number, prescription: Prescription): Observable<Prescription> {
    return this.http.put<Prescription>(`${this.apiUrl}/${id}`, prescription);
  }

  // Delete prescription
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Get prescription items
  getPrescriptionItems(id: number): Observable<PrescriptionItem[]> {
    return this.http.get<PrescriptionItem[]>(`${this.apiUrl}/${id}/items`);
  }

  // Add medication to prescription
  addItem(prescriptionId: number, medicationId: number, quantity: number, frequency: string): Observable<Prescription> {
    return this.http.post<Prescription>(
      `${this.apiUrl}/${prescriptionId}/add-medication/${medicationId}?quantity=${quantity}&frequency=${frequency}`,
      {}
    );
  }

  // Remove medication from prescription
  removeItem(prescriptionId: number, medicationId: number): Observable<Prescription> {
    return this.http.delete<Prescription>(
      `${this.apiUrl}/${prescriptionId}/remove-medication/${medicationId}`
    );
  }

  // Get active prescriptions
  getActivePrescriptions(): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.apiUrl}/active`);
  }

  // Get expired prescriptions
  getExpiredPrescriptions(): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.apiUrl}/expired`);
  }

  // Check if prescription is expired
  isExpired(id: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/${id}/is-expired`);
  }

  // Extend prescription expiration
  extendExpiration(id: number, expirationTimestamp: number): Observable<Prescription> {
    return this.http.patch<Prescription>(
      `${this.apiUrl}/${id}/extend?expirationTimestamp=${expirationTimestamp}`,
      {}
    );
  }

  // Get most used medicines in prescriptions
  getMostUsedMedicines(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/stats/most-used-medicines`);
  }

  // Get prescriptions by patient
  getByPatient(patientName: string): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.apiUrl}?patientName=${patientName}`);
  }

  // Search prescription codes for autocomplete
  searchCodes(query: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/code-suggestions?query=${encodeURIComponent(query ?? '')}`);
  }

  // Recommend pharmacies that have stock for a prescription code
  getRecommendationsByCode(code: string): Observable<PharmacyRecommendation[]> {
    return this.http.get<PharmacyRecommendation[]>(
      `${this.apiUrl}/recommendations?code=${encodeURIComponent(code)}`
    );
  }
}
