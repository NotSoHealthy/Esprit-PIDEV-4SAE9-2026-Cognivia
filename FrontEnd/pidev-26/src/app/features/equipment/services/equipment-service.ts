import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { EquipmentModel } from '../models/equipment.model';
import { API_BASE_URL } from '../../../core/api/api.tokens';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {

  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  private endpoint = `${this.baseUrl}/Equipment/equipment`;
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
}
