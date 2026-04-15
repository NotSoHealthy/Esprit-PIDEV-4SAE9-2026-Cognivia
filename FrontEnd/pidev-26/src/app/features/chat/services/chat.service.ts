import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Message } from '../models/chat.model';

export interface UserInfo {
    id: string;
    name: string;
    role: string;
    isAdmin?: boolean;
}

export interface ChatSummary {
    contactId: string;
    unreadCount: number;
    lastMessage: Message;
}

export interface GroupMemberInfo {
    userId: string;
    isAdmin: boolean;
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

    // Group Chat Methods
    createGroup(name: string, creatorId: string, memberIds: string[]): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/group/create`, { name, creatorId, memberIds });
    }

    getUserGroups(userId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/group/user/${userId}`);
    }

    getGroupMessages(groupId: number): Observable<Message[]> {
        return this.http.get<Message[]>(`${this.apiUrl}/group/${groupId}/messages`);
    }

    getGroupMembers(groupId: number): Observable<GroupMemberInfo[]> {
        return this.http.get<GroupMemberInfo[]>(`${this.apiUrl}/group/${groupId}/members`);
    }

    addGroupMembers(groupId: number, userIds: string[]): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/group/${groupId}/members`, userIds);
    }

    removeGroupMember(groupId: number, userId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/group/${groupId}/members/${userId}`);
    }

    markGroupAsRead(groupId: number, userId: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/group/${groupId}/read/${userId}`, {});
    }

    promoteToAdmin(groupId: number, userId: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/group/${groupId}/promote/${userId}`, {});
    }

    clearGroupHistory(groupId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/group/${groupId}/history`);
    }

    deleteGroup(groupId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/group/${groupId}`);
    }

    // Reporting & Admin Methods
    reportChat(report: { reporterId: string, reportedUserId?: string, groupId?: number, messageId?: number, reason: string }): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/report`, report);
    }

    getReports(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/admin/reports`);
    }

    resolveReport(reportId: number): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/admin/reports/${reportId}/resolve`, {});
    }

    getUserRestriction(userId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/restriction/${userId}`);
    }

    restrictUser(restriction: { userId: string, type: string, durationInHours?: number, reason: string }): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/admin/restrict`, restriction);
    }

    getConversationContext(params: { user1?: string, user2?: string, groupId?: number, messageId?: number }): Observable<Message[]> {
        const cleanedParams: any = {};
        Object.keys(params).forEach(key => {
            const val = (params as any)[key];
            if (val !== null && val !== undefined) {
                cleanedParams[key] = val;
            }
        });
        return this.http.get<Message[]>(`${this.apiUrl}/admin/conversation-context`, { params: cleanedParams });
    }

    // Activity & Typing methods
    sendTypingStatus(convId: string, userId: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/activity/typing/${convId}`, {}, {
            params: { userId }
        });
    }

    getTypingStatus(convId: string): Observable<UserInfo[]> {
        return this.http.get<UserInfo[]>(`${this.apiUrl}/activity/status/${convId}`);
    }

    getAIChatSummary(convId: string): Observable<string> {
        return this.http.get(`${this.apiUrl}/ai/summary/${convId}`, { responseType: 'text' });
    }
}
