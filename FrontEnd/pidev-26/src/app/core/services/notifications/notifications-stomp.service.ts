import { Injectable, inject } from '@angular/core';
import { Client, type IMessage } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import { API_BASE_URL } from '../../api/api.tokens';
import { KeycloakService } from '../../auth/keycloak.service';
import { Notification } from '../../models/notifications/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationsStompService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly keycloak = inject(KeycloakService);

  private client: Client | null = null;
  private readonly notificationsSubject = new Subject<Notification>();

  connect(): Observable<Notification> {
    if (this.client?.active) return this.notificationsSubject.asObservable();

    const brokerURL = `${this.toWebSocketBaseUrl(this.apiBaseUrl)}/notifications/ws`;

    this.client = new Client({
      brokerURL,
      reconnectDelay: 5000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 20000,
      beforeConnect: async () => {
        await this.keycloak.updateToken(30);
        const token = await this.keycloak.getToken();
        this.client!.connectHeaders = {
          Authorization: `Bearer ${token}`,
        };
      },
      onConnect: () => {
        this.client?.subscribe('/user/queue/notifications', (message: IMessage) => {
          try {
            const parsed = JSON.parse(message.body) as Notification;
            if (parsed && typeof parsed === 'object') {
              this.notificationsSubject.next(parsed);
            }
          } catch {
            // ignore malformed messages
          }
        });
      },
    });

    this.client.activate();
    return this.notificationsSubject.asObservable();
  }

  disconnect(): void {
    void this.client?.deactivate();
    this.client = null;
  }

  private toWebSocketBaseUrl(apiBaseUrl: string): string {
    const trimmed = apiBaseUrl.replace(/\/$/, '');
    if (trimmed.startsWith('https://')) return trimmed.replace(/^https:/, 'wss:');
    if (trimmed.startsWith('http://')) return trimmed.replace(/^http:/, 'ws:');
    return trimmed;
  }
}
