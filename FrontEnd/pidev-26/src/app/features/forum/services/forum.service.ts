import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '../models/post.model';
import { Comment } from '../models/comment.model';
import { Reaction, ReactionType } from '../models/reaction.model';

import { KeycloakService } from '../../../core/auth/keycloak.service';
import { Inject } from '@angular/core';
import { API_BASE_URL } from '../../../core/api/api.tokens';

@Injectable({
    providedIn: 'root'
})
export class ForumService {

    private apiUrl: string;

    constructor(
        private http: HttpClient,
        private keycloakService: KeycloakService,
        @Inject(API_BASE_URL) private baseUrl: string
    ) {
        this.apiUrl = `${this.baseUrl}/posts`;
    }

    // Posts
    getAllPosts(page: number = 0, size: number = 10, category: string = 'all', keyword?: string): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        const userId = this.keycloakService.getUserId();
        if (userId) {
            params = params.set('userId', userId);
        }

        if (category && category !== 'all') {
            params = params.set('category', category);
        }

        if (keyword) {
            params = params.set('keyword', keyword);
        }

        return this.http.get<any>(this.apiUrl, { params });
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
        return this.http.delete<void>(`${this.apiUrl}/reactions/${reactionId}`);
    }

    // Pin
    togglePin(postId: number): Observable<Post> {
        const userId = this.keycloakService.getUserId();
        return this.http.patch<Post>(`${this.apiUrl}/${postId}/pin?userId=${userId}`, {});
    }

    reportPost(postId: number): Observable<void> {
        const userId = this.keycloakService.getUserId();
        return this.http.post<void>(`${this.apiUrl}/${postId}/report?userId=${userId}`, {});
    }

    // Admin
    getReportedPosts(page: number = 0, size: number = 10): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<any>(`${this.apiUrl}/reported`, { params });
    }

    removeReportsFromPost(postId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${postId}/reports`);
    }

    getWordCloud(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/analysis/word-cloud`);
    }

    reclassifyAllPosts(): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/reclassify`, {});
    }

    repostPost(postId: number): Observable<Post> {
        const userId = this.keycloakService.getUserId();
        const username = this.keycloakService.getUsername();
        let params = new HttpParams()
            .set('userId', userId || '')
            .set('username', (username as string) || '');

        return this.http.post<Post>(`${this.apiUrl}/${postId}/repost`, {}, { params });
    }
}
