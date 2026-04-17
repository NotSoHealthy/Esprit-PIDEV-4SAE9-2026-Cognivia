import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../api/api.tokens';
import { Notification, RecipientType } from '../../models/notifications/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private readonly apiUrl = inject(API_BASE_URL) + '/notifications';

  constructor(private http: HttpClient) {}

  getNotificationsForRecipient(
    recipientId: number | string,
    recipientType: RecipientType,
  ): Observable<Notification[]> {
    return this.http.get<Notification[]>(
      `${this.apiUrl}/recipient/${recipientType}/${recipientId}`,
    );
  }

  markAsRead(notificationId: string): Observable<Notification> {
    return this.http.put<Notification>(`${this.apiUrl}/mark-as-read/${notificationId}`, {});
  }

  markAsSeen(notificationId: string): Observable<Notification> {
    return this.http.put<Notification>(`${this.apiUrl}/mark-as-seen/${notificationId}`, {});
  }
}
