export interface Message {
    id?: number;
    senderId: string;
    recipientId: string;
    content: string;
    timestamp: string; // ISO string
    isRead: boolean;
}
