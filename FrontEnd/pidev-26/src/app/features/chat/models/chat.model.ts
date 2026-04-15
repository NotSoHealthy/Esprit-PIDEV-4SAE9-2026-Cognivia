export interface MessageReaction {
    id?: number;
    type: string;
    userId: string;
    createdAt?: string;
}

export interface Message {
    id?: number;
    senderId: string;
    recipientId?: string;
    groupId?: number;
    content: string;
    type?: string;
    timestamp: string; // ISO string
    isRead: boolean;
    isDeleted?: boolean;
    isEdited?: boolean;
    senderName?: string;
    senderRole?: string;
    seenBy?: string[];
    reactions?: MessageReaction[];
    status?: 'sending' | 'sent' | 'error';
}
