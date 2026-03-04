import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
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

  updateInfo(
    id: number,
    payload: Pick<Pharmacy, 'name' | 'description' | 'contactInfo'>
  ): Observable<Pharmacy> {
    return this.http.patch<Pharmacy>(
      `${this.apiBaseUrl}/pharmacy/pharmacies/${id}/update-info`,
      payload
    );
  }

  updateLocation(
    id: number,
    payload: Pick<Pharmacy, 'address' | 'latitude' | 'longitude'>
  ): Observable<Pharmacy> {
    return this.http.patch<Pharmacy>(
      `${this.apiBaseUrl}/pharmacy/pharmacies/${id}/update-location`,
      payload
    );
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

  uploadImagesWithProgress(id: number, opts: { banner?: File; logo?: File }): Observable<HttpEvent<Pharmacy>> {
    const formData = new FormData();

    if (opts.banner) formData.append('banner', opts.banner);
    if (opts.logo) formData.append('logo', opts.logo);

    return this.http.post<Pharmacy>(
      `${this.apiBaseUrl}/pharmacy/pharmacies/${id}/upload-images`,
      formData,
      {
        reportProgress: true,
        observe: 'events'
      }
    );
  }

  getAgentMode(): Observable<{ agentModeEnabled: boolean }> {
    return this.http.get<{ agentModeEnabled: boolean }>(
      `${this.apiBaseUrl}/pharmacy/config/agent-mode`
    );
  }

  updateAgentMode(enabled: boolean): Observable<{ agentModeEnabled: boolean }> {
    return this.http.put<{ agentModeEnabled: boolean }>(
      `${this.apiBaseUrl}/pharmacy/config/agent-mode`,
      { agentModeEnabled: enabled }
    );
  }

  getAutoDeleteReviewRequired(): Observable<{ autoDeleteReviewRequired: boolean }> {
    return this.http.get<{ autoDeleteReviewRequired: boolean }>(
      `${this.apiBaseUrl}/pharmacy/config/auto-delete-review-required`
    );
  }

  updateAutoDeleteReviewRequired(enabled: boolean): Observable<{ autoDeleteReviewRequired: boolean }> {
    return this.http.put<{ autoDeleteReviewRequired: boolean }>(
      `${this.apiBaseUrl}/pharmacy/config/auto-delete-review-required`,
      { autoDeleteReviewRequired: enabled }
    );
  }
}

