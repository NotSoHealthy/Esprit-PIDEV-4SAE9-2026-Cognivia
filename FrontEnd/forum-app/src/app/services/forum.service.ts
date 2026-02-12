import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '../models/post.model';
import { Comment } from '../models/comment.model';
import { Reaction, ReactionType } from '../models/reaction.model';

@Injectable({
  providedIn: 'root'
})
export class ForumService {

  private apiUrl = 'http://localhost:8085/api/posts'; // Updated to 8085 as per user request

  constructor(private http: HttpClient) { }

  // Posts
  getAllPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(this.apiUrl);
  }

  getPostById(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/${id}`);
  }

  createPost(post: Post): Observable<Post> {
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
    return this.http.post<Comment>(`${this.apiUrl}/${postId}/comments`, comment);
  }

  updateComment(postId: number, commentId: number, comment: Comment): Observable<Comment> {
    return this.http.put<Comment>(`${this.apiUrl}/${postId}/comments/${commentId}`, comment);
    // Re-reading controller content from step 24:
    // @RequestMapping("/api/posts/{postId}/comments")
    // public class CommentController
    // ...
    // @PutMapping("/{commentId}")
    // public ResponseEntity<Comment> updateComment(@PathVariable Long commentId, @RequestBody Comment comment)
  }

  // Re-reading controller content from step 24:
  // @RequestMapping("/api/posts/{postId}/comments")
  // public class CommentController
  // ...
  // @PutMapping("/{commentId}")
  // public ResponseEntity<Comment> updateComment(@PathVariable Long commentId, @RequestBody Comment comment)

  // Wait, the method signature in controller: updateComment(@PathVariable Long commentId, @RequestBody Comment comment)
  // It DOES NOT have @PathVariable Long postId in the arguments!
  // BUT the class has @RequestMapping("/api/posts/{postId}/comments").
  // Spring MVC merges them. So the URL is /api/posts/{postId}/comments/{commentId}.
  // But if the method doesn't capture {postId}, it acts as a path segment that is ignored??
  // Or maybe it fails if not provided?
  // It's safer to provide it.

  // Actually, I'll implementing `updateComment` with `postId` and `commentId` to be safe.

  deleteComment(postId: number, commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${postId}/comments/${commentId}`);
  }

  // Reactions
  getReactionsByPostId(postId: number): Observable<Reaction[]> {
    return this.http.get<Reaction[]>(`${this.apiUrl}/${postId}/reactions`);
  }

  addReaction(postId: number, reaction: Reaction): Observable<Reaction> {
    return this.http.post<Reaction>(`${this.apiUrl}/${postId}/reactions`, reaction);
  }

  deleteReaction(postId: number, reactionId: number): Observable<void> {
    return this.http.delete<void>(`http://localhost:8085/api/posts/reactions/${reactionId}`);
  }
}
