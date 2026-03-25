import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PharmacyRecommendation, Prescription, PrescriptionItem } from '../models/prescription.model';
import { API_BASE_URL } from '../../../core/api/api.tokens';

type UserContext = {
  userId?: string | null;
  username?: string | null;
  role?: string | null;
};

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly apiUrl = `${this.apiBaseUrl}/pharmacy/prescriptions`;

  constructor(private http: HttpClient) {}

  private buildUserHeaders(context?: UserContext): HttpHeaders | undefined {
    const userId = (context?.userId ?? '').trim();
    const username = (context?.username ?? '').trim();
    const role = (context?.role ?? '').trim();

    let headers = new HttpHeaders();
    let changed = false;

    if (userId) {
      headers = headers.set('X-User-Id', userId);
      changed = true;
    }
    if (username) {
      headers = headers.set('X-Username', username);
      changed = true;
    }
    if (role) {
      headers = headers.set('X-User-Role', role);
      changed = true;
    }

    return changed ? headers : undefined;
  }

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
  create(prescription: Prescription, context?: UserContext): Observable<Prescription> {
    const headers = this.buildUserHeaders(context);
    return this.http.post<Prescription>(this.apiUrl, prescription, headers ? { headers } : undefined);
  }

  // Update prescription
  update(id: number, prescription: Prescription, context?: UserContext): Observable<Prescription> {
    const headers = this.buildUserHeaders(context);
    return this.http.put<Prescription>(`${this.apiUrl}/${id}`, prescription, headers ? { headers } : undefined);
  }

  // Delete prescription
  delete(id: number, context?: UserContext): Observable<void> {
    const headers = this.buildUserHeaders(context);
    return this.http.delete<void>(`${this.apiUrl}/${id}`, headers ? { headers } : undefined);
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
