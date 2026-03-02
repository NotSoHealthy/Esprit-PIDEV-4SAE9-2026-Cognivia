import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { MedicationModel, NewMedication } from '../models/medication.model';

@Injectable({ providedIn: 'root' })
export class MedicationService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getByPharmacy(pharmacyId: number): Observable<MedicationModel[]> {
    return this.http.get<MedicationModel[]>(
      `${this.apiBaseUrl}/pharmacy/medications`
    );
  }

  getAll(): Observable<MedicationModel[]> {
    return this.http.get<MedicationModel[]>(`${this.apiBaseUrl}/pharmacy/medications`);
  }

  getById(id: number): Observable<MedicationModel> {
    return this.http.get<MedicationModel>(`${this.apiBaseUrl}/medications/${id}`);
  }

  create(medication: NewMedication): Observable<MedicationModel> {
    return this.http.post<MedicationModel>(`${this.apiBaseUrl}/pharmacy/medications`, medication);
  }

  uploadImage(medicationId: number, file: File): Observable<MedicationModel> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<MedicationModel>(
      `${this.apiBaseUrl}/pharmacy/medications/${medicationId}/upload-image`,
      formData
    );
  }

  update(id: number, medication: Partial<MedicationModel>): Observable<MedicationModel> {
    return this.http.put<MedicationModel>(`${this.apiBaseUrl}/medications/${id}`, medication);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/medications/${id}`);
  }
}
