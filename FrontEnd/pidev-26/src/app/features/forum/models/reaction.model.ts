export enum ReactionType {
    LIKE = 'LIKE',
    DISLIKE = 'DISLIKE'
}

export interface Reaction {
    id: number;
    type: ReactionType;
    createdAt?: string;
    postId?: number;
    userId?: string;
}
