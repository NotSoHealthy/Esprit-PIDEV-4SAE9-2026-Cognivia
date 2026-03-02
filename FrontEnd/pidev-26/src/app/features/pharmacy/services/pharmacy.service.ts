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
    return this.http.get<Pharmacy>(`${this.apiBaseUrl}/pharmacy/pharmacies/${id}`);
  }

  create(pharmacy: NewPharmacy): Observable<Pharmacy> {
    return this.http.post<Pharmacy>(`${this.apiBaseUrl}/pharmacy/pharmacies`, pharmacy);
  }

  update(id: number, pharmacy: Partial<Pharmacy>): Observable<Pharmacy> {
    return this.http.put<Pharmacy>(`${this.apiBaseUrl}/pharmacy/pharmacies/${id}`, pharmacy);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/pharmacy/pharmacies/${id}`);
  }
   uploadLogo(id: number, file: File): Observable<Pharmacy> {
    const formData = new FormData();
    formData.append('file', file); // MUST match @RequestParam("file")

    return this.http.post<Pharmacy>(
      `${this.apiBaseUrl}/pharmacy/pharmacies/${id}/upload-logo`,
      formData
    );
  }


  uploadImages(id: number, opts: { banner?: File; logo?: File }): Observable<Pharmacy> {
    const formData = new FormData();

    if (opts.banner) formData.append('banner', opts.banner);
    if (opts.logo) formData.append('logo', opts.logo);

    return this.http.post<Pharmacy>(
      `${this.apiBaseUrl}/pharmacy/pharmacies/${id}/upload-images`,
      formData
    );
  }
}

