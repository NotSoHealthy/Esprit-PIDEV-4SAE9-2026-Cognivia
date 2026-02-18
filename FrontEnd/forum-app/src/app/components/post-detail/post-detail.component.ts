import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; // Added RouterLink here
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ForumService } from '../../services/forum.service';
import { Post } from '../../models/post.model';
import { Comment } from '../../models/comment.model';
import { Reaction, ReactionType } from '../../models/reaction.model';

import { KeycloakService } from '../../core/auth/keycloak.service';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    RouterLink,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss'
})
export class PostDetailComponent implements OnInit {
  post: Post | null = null;
  comments: Comment[] = [];
  newCommentContent: string = '';
  currentUserId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService,
    private keycloakService: KeycloakService
  ) { }

  ngOnInit(): void {
    this.currentUserId = this.keycloakService.getUserId() || '';
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadPost(id);
      this.loadComments(id);
    }
  }

  loadPost(id: number): void {
    this.forumService.getPostById(id).subscribe({
      next: (data) => this.post = data,
      error: (e) => console.error('Error fetching post', e)
    });
  }

  loadComments(postId: number): void {
    this.forumService.getCommentsByPostId(postId).subscribe({
      next: (data) => this.comments = data,
      error: (e) => console.error('Error fetching comments', e)
    });
  }

  addComment(): void {
    if (!this.post || !this.newCommentContent.trim()) return;

    const newComment: Comment = {
      id: 0,
      content: this.newCommentContent
    };

    this.forumService.addComment(this.post.id, newComment).subscribe({
      next: (comment) => {
        this.comments.push(comment);
        this.newCommentContent = '';
      },
      error: (e) => console.error('Error adding comment', e)
    });
  }

  editComment(comment: Comment): void {
    const newContent = prompt('Edit your comment:', comment.content);
    if (newContent !== null && newContent.trim() !== '') {
      const updatedComment = { ...comment, content: newContent };
      this.forumService.updateComment(this.post!.id, comment.id, updatedComment).subscribe({
        next: (data) => {
          const index = this.comments.findIndex(c => c.id === comment.id);
          if (index !== -1) {
            this.comments[index] = data;
          }
        },
        error: (e) => console.error('Error updating comment', e)
      });
    }
  }

  deleteComment(commentId: number): void {
    if (confirm('Are you sure you want to delete this comment?')) {
      this.forumService.deleteComment(this.post!.id, commentId).subscribe({
        next: () => {
          this.comments = this.comments.filter(c => c.id !== commentId);
        },
        error: (e) => console.error('Error deleting comment', e)
      });
    }
  }

  react(type: ReactionType): void {
    if (!this.post) return;

    const reaction: Reaction = {
      id: 0,
      type: type
    };

    this.forumService.addReaction(this.post.id, reaction).subscribe({
      next: () => {
        // Refresh post to get updated counts
        this.loadPost(this.post!.id);
      },
      error: (e) => console.error('Error adding reaction', e)
    });
  }

  like(): void { this.react(ReactionType.LIKE); }
  dislike(): void { this.react(ReactionType.DISLIKE); }

  deletePost(): void {
    if (!this.post) return;
    if (confirm('Are you sure you want to delete this post?')) {
      this.forumService.deletePost(this.post.id).subscribe({
        next: () => this.router.navigate(['/posts']),
        error: (e) => console.error('Error deleting post', e)
      });
    }
  }
}
