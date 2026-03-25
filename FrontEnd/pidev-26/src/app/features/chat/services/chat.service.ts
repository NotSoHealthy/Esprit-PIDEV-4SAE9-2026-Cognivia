import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Message } from '../models/chat.model';
import { API_BASE_URL } from '../../../core/api/api.tokens';

export interface UserInfo {
    id: string;
    name: string;
    role: string;
}

export interface ChatSummary {
    contactId: string;
    unreadCount: number;
    lastMessage: Message;
}

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private readonly apiBaseUrl = inject(API_BASE_URL);
    private readonly apiUrl = `${this.apiBaseUrl}/chat`;

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

    getUnreadCount(recipientId: string, senderId: string): Observable<number> {
        return this.http.get<number>(`${this.apiUrl}/unread-count`, {
            params: { recipientId, senderId }
        });
    }

    markConversationAsRead(recipientId: string, senderId: string): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/read-conversation`, {}, {
            params: { recipientId, senderId }
        });
    }

    editMessage(id: number, content: string): Observable<Message> {
        return this.http.put<Message>(`${this.apiUrl}/edit/${id}`, { content });
    }

    deleteMessage(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
    }

    getLastMessage(user1: string, user2: string): Observable<Message> {
        return this.http.get<Message>(`${this.apiUrl}/last-message`, {
            params: { user1, user2 }
        });
    }

    reactToMessage(messageId: number, userId: string, type: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/react/${messageId}`, { userId, type });
    }

    getChatSummary(userId: string): Observable<ChatSummary[]> {
        return this.http.get<ChatSummary[]>(`${this.apiUrl}/summary/${userId}`);
    }
}
