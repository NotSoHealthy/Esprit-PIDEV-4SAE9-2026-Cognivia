import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { EquipmentModel } from '../models/equipment.model';
import { API_BASE_URL } from '../../../core/api/api.tokens';

export interface EquipmentPart {
  id?: number;
  equipmentId: number;
  name: string;
  conditionScore: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CreateEquipmentPartRequest {
  equipmentId: number;
  name: string;
  conditionScore: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UpdateEquipmentPartRequest extends CreateEquipmentPartRequest {
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {

  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  private endpoint = `${this.baseUrl}/Equipment/equipment`;
  private partsEndpoint = `${this.baseUrl}/Equipment/equipment-parts`;
  private imageUploadEndpoint = 'https://api.imgbb.com/1/upload?key=6917397c87588ed4436eac425b613c6e';

  getAll(): Observable<EquipmentModel[]> {
    return this.http.get<EquipmentModel[]>(this.endpoint);
  }

  create(equipment: Omit<EquipmentModel, 'id'>): Observable<EquipmentModel> {
    return this.http.post<EquipmentModel>(this.endpoint, equipment);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  update(equipment: EquipmentModel): Observable<EquipmentModel> {
    return this.http.put<EquipmentModel>(this.endpoint, equipment);
  }

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http
      .post<{ data: { url: string } }>(this.imageUploadEndpoint, formData)
      .pipe(map((response) => response.data.url));
  }

  extractEquipmentFromText(text: string): Observable<Partial<EquipmentModel>> {
    return this.http.post<Partial<EquipmentModel>>(`${this.endpoint}/extract-from-text`, { text });
  }

  getEquipmentParts(equipmentId: number): Observable<EquipmentPart[]> {
    return this.http.get<EquipmentPart[]>(`${this.partsEndpoint}/${equipmentId}`);
  }

  createEquipmentPart(payload: CreateEquipmentPartRequest): Observable<EquipmentPart> {
    return this.http.post<EquipmentPart>(this.partsEndpoint, payload);
  }

  updateEquipmentPart(payload: UpdateEquipmentPartRequest): Observable<EquipmentPart> {
    return this.http.put<EquipmentPart>(`${this.partsEndpoint}/${payload.id}`, payload).pipe(
      catchError((error) => {
        if (error?.status !== 405) {
          return throwError(() => error);
        }

        // Some backend controllers expose update on the collection endpoint and expect id in body.
        return this.http.put<EquipmentPart>(this.partsEndpoint, payload);
      })
    );
  }

  deleteEquipmentPart(partId: number): Observable<void> {
    return this.http.delete<void>(`${this.partsEndpoint}/${partId}`);
  }
}
