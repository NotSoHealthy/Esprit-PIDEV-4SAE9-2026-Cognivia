import { Comment } from './comment.model';
import { Reaction } from './reaction.model';

export interface Post {
    id: number;
    title: string;
    content: string;
    userId?: string;
    username?: string;
    createdAt?: string;
    updatedAt?: string;
    comments?: Comment[];
    reactions?: Reaction[];
    likeCount?: number;
    dislikeCount?: number;
    loveCount?: number;
    hahaCount?: number;
    wowCount?: number;
    sadCount?: number;
    angryCount?: number;
    pinned?: boolean;
    isDoctor?: boolean;
    banned?: boolean;
    category?: string;
}
