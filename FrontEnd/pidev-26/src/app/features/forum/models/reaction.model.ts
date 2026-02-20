export enum ReactionType {
    LIKE = 'LIKE',
    DISLIKE = 'DISLIKE',
    LOVE = 'LOVE',
    HAHA = 'HAHA',
    WOW = 'WOW',
    SAD = 'SAD',
    ANGRY = 'ANGRY'
}

export interface Reaction {
    id: number;
    type: ReactionType;
    createdAt?: string;
    postId?: number;
    userId?: string;
    username?: string;
}
