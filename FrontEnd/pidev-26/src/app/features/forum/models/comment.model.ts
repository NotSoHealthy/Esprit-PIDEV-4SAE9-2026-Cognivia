export interface Comment {
    id: number;
    content: string;
    createdAt?: string;
    updatedAt?: string;
    postId?: number;
    userId?: string;
}
