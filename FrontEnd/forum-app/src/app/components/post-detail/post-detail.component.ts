import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; // Added RouterLink here
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ForumService } from '../../services/forum.service';
import { Post } from '../../models/post.model';
import { Comment } from '../../models/comment.model';
import { Reaction, ReactionType } from '../../models/reaction.model';

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
    RouterLink // Added RouterLink to imports array
  ],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss'
})
export class PostDetailComponent implements OnInit {
  post: Post | null = null;
  comments: Comment[] = [];
  reactions: Reaction[] = [];
  newCommentContent: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadPost(id);
      this.loadComments(id);
      this.loadReactions(id);
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

  loadReactions(postId: number): void {
    this.forumService.getReactionsByPostId(postId).subscribe({
      next: (data) => this.reactions = data,
      error: (e) => console.error('Error fetching reactions', e)
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

  react(type: ReactionType): void { // Fixed: using ReactionType enum directly from import
    if (!this.post) return;

    // Use string values "LIKE" and "DISLIKE" matching the enum if needed
    // But since type is ReactionType, we can pass it directly.
    // However, the template will pass string 'LIKE' or 'DISLIKE'.
    // Typescript might complain if I don't cast or use enum in template.
    // I will use string in template and cast.

    // Actually, let's fix the parameter type in the method signature to be consistent.
    // I'll use ReactionType in signature. In template I'll use 'LIKE' which is assignable?
    // No, template strings are just strings.
    // I will use property on component to expose Enum to template or just use string.

    const reaction: Reaction = {
      id: 0,
      type: type
    };

    this.forumService.addReaction(this.post.id, reaction).subscribe({
      next: (r) => {
        this.reactions.push(r);
      },
      error: (e) => console.error('Error adding reaction', e)
    });
  }

  // Helper for template to use Enum keys
  // I will just use string literal types in the template for simplicity
  // and method will accept ReactionType.

  // Actually, simpler:
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
