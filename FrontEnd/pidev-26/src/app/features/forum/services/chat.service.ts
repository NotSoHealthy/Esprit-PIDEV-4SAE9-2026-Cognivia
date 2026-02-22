import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Message } from '../models/chat.model';

export interface UserInfo {
    id: string;
    name: string;
    role: string;
}

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private apiUrl = `${environment.apiBaseUrl}/chat`;

    constructor(private http: HttpClient) { }

    sendMessage(message: Partial<Message>): Observable<Message> {
        return this.http.post<Message>(`${this.apiUrl}/send`, message);
    }

    getConversation(user1: string, user2: string): Observable<Message[]> {
        return this.http.get<Message[]>(`${this.apiUrl}/conversation`, {
            params: { user1, user2 }
        });
    }

    getRecentContacts(userId: string): Observable<string[]> {
        return this.http.get<string[]>(`${this.apiUrl}/contacts/${userId}`);
    }

    getUserInfo(userId: string): Observable<UserInfo> {
        return this.http.get<UserInfo>(`${this.apiUrl}/user/${userId}`);
    }

    getAllUsers(): Observable<UserInfo[]> {
        return this.http.get<UserInfo[]>(`${this.apiUrl}/users`);
    }

    markAsRead(messageId: number): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/read/${messageId}`, {});
    }
}
