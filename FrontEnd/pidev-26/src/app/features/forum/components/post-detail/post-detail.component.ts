import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { ForumService } from '../../services/forum.service';
import { Post } from '../../models/post.model';
import { Comment } from '../../models/comment.model';
import { Reaction, ReactionType } from '../../models/reaction.model';
import { KeycloakService } from '../../../../core/auth/keycloak.service';

@Component({
    selector: 'app-post-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzCardModule,
        NzButtonModule,
        NzIconModule,
        NzInputModule,
        NzFormModule,
        NzDividerModule,
        NzTooltipModule,
        NzAvatarModule,
        NzModalModule
    ],
    templateUrl: './post-detail.component.html',
    styleUrl: './post-detail.component.scss'
})
export class PostDetailComponent implements OnInit {
    post: Post | null = null;
    comments: Comment[] = [];
    newCommentContent: string = '';
    currentUserId: string = '';

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private forumService = inject(ForumService);
    private keycloakService = inject(KeycloakService);
    private modal = inject(NzModalService);
    private cdr = inject(ChangeDetectorRef);
    private ngZone = inject(NgZone);

    constructor() { }

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
            next: (data: Post) => {
                this.ngZone.run(() => {
                    this.post = data;
                    this.cdr.detectChanges();
                });
            },
            error: (e: any) => console.error('Error fetching post', e)
        });
    }

    loadComments(postId: number): void {
        this.forumService.getCommentsByPostId(postId).subscribe({
            next: (data: Comment[]) => {
                this.ngZone.run(() => {
                    this.comments = data || [];
                    this.cdr.detectChanges();
                });
            },
            error: (e: any) => console.error('Error fetching comments', e)
        });
    }

    addComment(): void {
        if (!this.post || !this.newCommentContent.trim()) return;

        const newComment: Comment = {
            id: 0,
            content: this.newCommentContent
        };

        this.forumService.addComment(this.post.id, newComment).subscribe({
            next: (comment: Comment) => {
                this.ngZone.run(() => {
                    this.comments.push(comment);
                    this.newCommentContent = '';
                    this.cdr.detectChanges();
                });
            },
            error: (e: any) => console.error('Error adding comment', e)
        });
    }

    editComment(comment: Comment): void {
        const newContent = prompt('Edit your comment:', comment?.content || '');
        if (newContent !== null && newContent.trim() !== '') {
            const updatedComment = { ...comment, content: newContent };
            this.forumService.updateComment(this.post!.id, comment.id, updatedComment).subscribe({
                next: (data: Comment) => {
                    const index = this.comments.findIndex(c => c.id === comment.id);
                    if (index !== -1) {
                        this.comments[index] = data;
                    }
                },
                error: (e: any) => console.error('Error updating comment', e)
            });
        }
    }

    deleteComment(commentId: number): void {
        this.modal.confirm({
            nzTitle: 'Are you sure you want to delete this comment?',
            nzContent: '<b style="color: red;">This action cannot be undone</b>',
            nzOkText: 'Yes',
            nzOkType: 'primary',
            nzOkDanger: true,
            nzOnOk: () => {
                this.forumService.deleteComment(this.post!.id, commentId).subscribe({
                    next: () => {
                        this.comments = this.comments.filter(c => c.id !== commentId);
                    },
                    error: (e: any) => console.error('Error deleting comment', e)
                });
            },
            nzCancelText: 'No'
        });
    }

    react(type: ReactionType): void {
        if (!this.post) return;

        const reaction: Reaction = {
            id: 0,
            type: type
        };

        this.forumService.addReaction(this.post.id, reaction).subscribe({
            next: () => {
                this.ngZone.run(() => {
                    this.loadPost(this.post!.id);
                    this.cdr.detectChanges();
                });
            },
            error: (e: any) => console.error('Error adding reaction', e)
        });
    }

    like(): void { this.react(ReactionType.LIKE); }
    dislike(): void { this.react(ReactionType.DISLIKE); }

    deletePost(): void {
        if (!this.post) return;
        this.modal.confirm({
            nzTitle: 'Are you sure you want to delete this post?',
            nzContent: '<b style="color: red;">This action will permanently remove the post and all its comments.</b>',
            nzOkText: 'Delete',
            nzOkType: 'primary',
            nzOkDanger: true,
            nzOnOk: () => {
                this.forumService.deletePost(this.post!.id).subscribe({
                    next: () => this.router.navigate(['/posts']),
                    error: (e: any) => console.error('Error deleting post', e)
                });
            },
            nzCancelText: 'Cancel'
        });
    }
}
