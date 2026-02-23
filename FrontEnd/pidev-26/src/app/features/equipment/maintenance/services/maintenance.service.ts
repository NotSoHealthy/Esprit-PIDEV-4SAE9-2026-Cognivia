import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Maintenance } from '../models/maintenance.model';
import { API_BASE_URL } from '../../../../core/api/api.tokens';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {

  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  private endpoint = `${this.baseUrl}/Equipment/maintenance`;

  getMaintenanceByEquipmentId(equipmentId: number): Observable<Maintenance[]> {
    return this.http.get<Maintenance[]>(`${this.endpoint}/equipment/${equipmentId}`);
  }

  create(maintenance: Omit<Maintenance, 'id'>): Observable<Maintenance> {
    return this.http.post<Maintenance>(this.endpoint, maintenance);
  }

  update(maintenance: Maintenance): Observable<Maintenance> {
    return this.http.put<Maintenance>(`${this.endpoint}/${maintenance.id}`, maintenance);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  checkAvailability(equipmentId: number, start: string, end: string): Observable<Maintenance | null> {
    return this.http.get<Maintenance | null>(`${this.endpoint}/checkavail`, {
      params: {
        equipmentId: equipmentId.toString(),
        start: start,
        end: end
      }
    });
  }

  getClosestMaintenance(equipmentId: number): Observable<Maintenance | null> {
    return this.http.get<Maintenance | null>(`${this.endpoint}/closest/${equipmentId}`);
  }
}
