import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ReservationModel } from '../model/reservation.model';
import { API_BASE_URL } from '../../../../core/api/api.tokens';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {

  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  private endpoint = `${this.baseUrl}/Equipment/reservation`;

  getReservationsByEquipmentId(equipmentId: number): Observable<ReservationModel[]> {
    return this.http.get<ReservationModel[]>(`${this.endpoint}/equipment/${equipmentId}`);
  }

  create(reservation: Omit<ReservationModel, 'id'>): Observable<ReservationModel> {
    return this.http.post<ReservationModel>(this.endpoint, reservation);
  }

  update(reservation: ReservationModel): Observable<ReservationModel> {
    return this.http.put<ReservationModel>(`${this.endpoint}/${reservation.id}`, reservation);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  checkAvailability(equipmentId: number, startDate: string, endDate: string): Observable<ReservationModel | null> {
    return this.http.get<ReservationModel>(`${this.endpoint}/checkavail`, {
      params: {
        equipmentId: equipmentId.toString(),
        startDate: startDate,
        endDate: endDate
      }
    }).pipe(
      catchError((error) => {
        // If 404, it means no overlap found (which is good)
        if (error.status === 404) {
          return of(null);
        }
        // For other errors, rethrow
        throw error;
      })
    );
  }
}
