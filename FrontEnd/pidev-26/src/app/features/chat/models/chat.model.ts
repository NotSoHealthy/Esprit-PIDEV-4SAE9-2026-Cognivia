export interface MessageReaction {
    id?: number;
    type: string;
    userId: string;
    createdAt?: string;
}

export interface Message {
    id?: number;
    senderId: string;
    recipientId: string;
    content: string;
    timestamp: string; // ISO string
    isRead: boolean;
    isDeleted?: boolean;
    isEdited?: boolean;
    senderName?: string;
    senderRole?: string;
    reactions?: MessageReaction[];
}
