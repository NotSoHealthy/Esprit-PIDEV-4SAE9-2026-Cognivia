import { Comment } from './comment.model';
import { Reaction } from './reaction.model';

export interface Post {
    id: number;
    title: string;
    content: string;
    userId?: string;
    createdAt?: string;
    updatedAt?: string;
    comments?: Comment[];
    reactions?: Reaction[];
    likeCount?: number;
    dislikeCount?: number;
}
