import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '../models/post.model';
import { Comment } from '../models/comment.model';
import { Reaction, ReactionType } from '../models/reaction.model';

import { KeycloakService } from '../../../core/auth/keycloak.service';

@Injectable({
    providedIn: 'root'
})
export class ForumService {

    private apiUrl = 'http://localhost:8085/posts';

    constructor(private http: HttpClient, private keycloakService: KeycloakService) { }

    // Posts
    getAllPosts(): Observable<Post[]> {
        return this.http.get<Post[]>(this.apiUrl);
    }

    getPostById(id: number): Observable<Post> {
        return this.http.get<Post>(`${this.apiUrl}/${id}`);
    }

    createPost(post: Post): Observable<Post> {
        post.userId = this.keycloakService.getUserId();
        return this.http.post<Post>(this.apiUrl, post);
    }

    updatePost(id: number, post: Post): Observable<Post> {
        return this.http.put<Post>(`${this.apiUrl}/${id}`, post);
    }

    deletePost(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // Comments
    getCommentsByPostId(postId: number): Observable<Comment[]> {
        return this.http.get<Comment[]>(`${this.apiUrl}/${postId}/comments`);
    }

    addComment(postId: number, comment: Comment): Observable<Comment> {
        comment.userId = this.keycloakService.getUserId();
        return this.http.post<Comment>(`${this.apiUrl}/${postId}/comments`, comment);
    }

    updateComment(postId: number, commentId: number, comment: Comment): Observable<Comment> {
        return this.http.put<Comment>(`${this.apiUrl}/${postId}/comments/${commentId}`, comment);
    }

    deleteComment(postId: number, commentId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${postId}/comments/${commentId}`);
    }

    // Reactions
    getReactionsByPostId(postId: number): Observable<Reaction[]> {
        return this.http.get<Reaction[]>(`${this.apiUrl}/${postId}/reactions`);
    }

    addReaction(postId: number, reaction: Reaction): Observable<Reaction> {
        reaction.userId = this.keycloakService.getUserId();
        return this.http.post<Reaction>(`${this.apiUrl}/${postId}/reactions`, reaction);
    }

    deleteReaction(postId: number, reactionId: number): Observable<void> {
        return this.http.delete<void>(`http://localhost:8085/posts/reactions/${reactionId}`);
    }
}
