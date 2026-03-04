import { Component, OnInit, inject, ChangeDetectorRef, NgZone, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzCommentModule } from 'ng-zorro-antd/comment';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { ForumService } from '../../services/forum.service';
import { Post } from '../../models/post.model';
import { Comment } from '../../models/comment.model';
import { Reaction, ReactionType } from '../../models/reaction.model';
import { KeycloakService } from '../../../../core/auth/keycloak.service';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';
import { HighlightMentionPipe } from '../../../../shared/pipes/highlight-mention.pipe';
import { ReactionDetailsComponent } from '../reaction-details/reaction-details.component';

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
        NzModalModule,
        NzCommentModule,
        NzPopconfirmModule,
        NzEmptyModule,
        NzTagModule,
        NzDropDownModule,
        TimeAgoPipe,
        HighlightMentionPipe,
        RouterModule
    ],
    templateUrl: './post-detail.component.html',
    styleUrl: './post-detail.component.scss'
})
export class PostDetailComponent implements OnInit {
    @ViewChild('editCommentTpl', { static: false }) editCommentTpl?: TemplateRef<any>;

    post: Post | null = null;
    comments: Comment[] = [];
    newCommentContent: string = '';
    tempEditContent: string = '';
    currentUserId: string = '';
    selectedParentId: number | null = null;
    reactions: Reaction[] = [];

    private location = inject(Location);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private forumService = inject(ForumService);
    private keycloakService = inject(KeycloakService);
    private modal = inject(NzModalService);
    private message = inject(NzMessageService);
    private cdr = inject(ChangeDetectorRef);
    private ngZone = inject(NgZone);

    constructor() { }

    ngOnInit(): void {
        this.currentUserId = this.keycloakService.getUserId() || '';
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (id) {
            this.loadPost(id);
            this.loadComments(id);
            this.loadReactions(id);
        }
    }

    getCategoryLabel(key?: string): string {
        if (!key) return 'General Discussion';
        const categories = [
            { key: 'Research & Clinical', label: 'Research & Clinical' },
            { key: 'Care & Support', label: 'Care & Support' },
            { key: 'Medication', label: 'Medication' },
            { key: 'Symptoms & Diagnosis', label: 'Symptoms & Diagnosis' },
            { key: 'Neurology', label: 'Neurology' },
            { key: 'General', label: 'General Discussion' }
        ];
        const cat = categories.find(c => c.key === key);
        return cat ? cat.label : key;
    }

    getCategoryIcon(key?: string): string {
        switch (key) {
            case 'Research & Clinical': return 'experiment';
            case 'Care & Support': return 'heart';
            case 'Medication': return 'medicine-box';
            case 'Symptoms & Diagnosis': return 'solution';
            case 'Neurology': return 'deployment-unit';
            default: return 'message';
        }
    }

    isDoctor(item: { username?: string, userId?: string } | null): boolean {
        if (!item) return false;
        const name = item.username || item.userId || '';
        return name.toLowerCase().includes('doctor');
    }

    goBack(): void {
        this.location.back();
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
                    const rawComments = data || [];
                    // Simple nesting logic: group replies under parents
                    const parents = rawComments.filter(c => !c.parentId);
                    const replies = rawComments.filter(c => c.parentId);

                    const sorted: Comment[] = [];
                    parents.forEach(p => {
                        sorted.push(p);
                        const children = replies.filter(r => r.parentId === p.id);
                        sorted.push(...children);
                    });

                    // Add any orphan replies at the end
                    const orphanReplies = replies.filter(r => !parents.find(p => p.id === r.parentId));
                    sorted.push(...orphanReplies);

                    this.comments = sorted;
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
            content: this.newCommentContent,
            userId: this.currentUserId,
            username: this.keycloakService.getUsername(),
            parentId: this.selectedParentId || undefined
        };

        this.forumService.addComment(this.post.id, newComment).subscribe({
            next: () => {
                this.ngZone.run(() => {
                    this.newCommentContent = '';
                    this.selectedParentId = null;
                    this.loadComments(this.post!.id);
                });
            },
            error: (e: any) => {
                console.error('Error adding comment', e);
                const msg = e?.error?.message || 'Failed to add comment.';
                this.message.error(msg);
            }
        });
    }

    editComment(comment: Comment): void {
        this.tempEditContent = comment.content;
        const modal = this.modal.create({
            nzTitle: 'Edit Your Reply',
            nzContent: this.editCommentTpl,
            nzWidth: 600,
            nzCentered: true,
            nzFooter: [
                {
                    label: 'Discard Changes',
                    onClick: () => modal.destroy()
                },
                {
                    label: 'Save Changes',
                    type: 'primary',
                    onClick: () => {
                        if (this.tempEditContent && this.tempEditContent.trim() !== '') {
                            this.saveCommentEdit(comment, this.tempEditContent);
                            modal.destroy();
                        }
                    }
                }
            ]
        });
    }

    private saveCommentEdit(comment: Comment, newContent: string): void {
        const updatedComment = { ...comment, content: newContent };
        this.forumService.updateComment(this.post!.id, comment.id, updatedComment).subscribe({
            next: (data: Comment) => {
                this.ngZone.run(() => {
                    const index = this.comments.findIndex(c => c.id === comment.id);
                    if (index !== -1) {
                        this.comments[index] = data;
                        this.cdr.detectChanges();
                    }
                    this.message.success('Comment updated');
                });
            },
            error: (e: any) => {
                console.error('Error updating comment', e);
                this.message.error('Failed to update comment');
            }
        });
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
                        this.ngZone.run(() => {
                            this.comments = this.comments.filter(c => c.id !== commentId);
                            this.cdr.detectChanges();
                        });
                    },
                    error: (e: any) => console.error('Error deleting comment', e)
                });
            },
            nzCancelText: 'No'
        });
    }

    loadReactions(postId: number): void {
        this.forumService.getReactionsByPostId(postId).subscribe({
            next: (data: Reaction[]) => {
                this.ngZone.run(() => {
                    this.reactions = data || [];
                    if (this.post) {
                        this.post.reactions = this.reactions;
                    }
                    this.cdr.detectChanges();
                });
            },
            error: (e: any) => console.error('Error fetching reactions', e)
        });
    }

    react(type: any, event?: Event): void {
        if (!this.post) return;
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        const reaction: Partial<Reaction> = {
            id: 0,
            type: type,
            userId: this.currentUserId,
            username: this.keycloakService.getUsername()
        };

        this.forumService.addReaction(this.post.id, reaction as Reaction).subscribe({
            next: () => {
                this.ngZone.run(() => {
                    // Reload both post (counts) AND reactions (so getUserReaction() updates)
                    this.loadPost(this.post!.id);
                    this.loadReactions(this.post!.id);
                });
            },
            error: (e: any) => console.error('Error adding reaction', e)
        });
    }

    like(post: Post, event?: Event): void {
        const currentType = this.getUserReaction(post);
        // If already liked, treat as toggle (could optionally un-react, but current API adds)
        this.react('LIKE' as ReactionType, event);
    }

    getReactionIcon(type: string | null): string {
        switch (type) {
            case 'LIKE': return 'like';
            case 'LOVE': return 'heart';
            case 'HAHA': return 'smile';
            case 'WOW': return 'bulb';
            case 'SAD': return 'frown';
            case 'ANGRY': return 'alert';
            case 'DISLIKE': return 'dislike';
            default: return 'like';
        }
    }

    getTotalReactions(post: Post): number {
        return (post.likeCount || 0) + (post.dislikeCount || 0) + (post.loveCount || 0) +
            (post.hahaCount || 0) + (post.wowCount || 0) + (post.sadCount || 0) + (post.angryCount || 0);
    }

    showReactionDetails(post: Post, event: Event): void {
        event.stopPropagation();
        event.preventDefault();

        // Use this.reactions[] (always up-to-date) rather than post.reactions (often null)
        if (this.reactions && this.reactions.length > 0) {
            this.openReactionModal(this.reactions);
        } else {
            // Fetch on demand if not yet loaded (mirrors post-list behaviour)
            this.forumService.getReactionsByPostId(post.id).subscribe({
                next: (reactions) => {
                    this.reactions = reactions;
                    if (reactions && reactions.length > 0) {
                        this.openReactionModal(reactions);
                    } else {
                        this.message.info('No reactions yet');
                    }
                },
                error: () => this.message.error('Failed to load reaction details')
            });
        }
    }

    private openReactionModal(reactions: Reaction[]): void {
        this.modal.create({
            nzContent: ReactionDetailsComponent,
            nzData: { reactions },
            nzFooter: null,
            nzWidth: 450,
            nzCentered: true,
            nzBodyStyle: { padding: '0' }
        });
    }

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

    getUserReaction(post: Post | null): ReactionType | null {
        if (!post) return null;
        if (post.userReaction) return post.userReaction as ReactionType;
        // Use the dedicated this.reactions[] — always fresh after loadReactions()
        if (this.reactions && this.reactions.length > 0) {
            const reaction = this.reactions.find(r => r.userId === this.currentUserId);
            if (reaction) return reaction.type;
        }
        return null;
    }

    repost(post: Post, event: Event): void {
        event.stopPropagation();
        event.preventDefault();
        this.forumService.repostPost(post.id).subscribe({
            next: () => {
                this.message.success('Post successfully reposted!');
                this.router.navigate(['/posts']);
            },
            error: (err) => {
                console.error('Repost failed:', err);
                this.message.error('Failed to repost. Please try again.');
            }
        });
    }

    sharePost(post: Post, platform: string, event: Event): void {
        event.stopPropagation();
        event.preventDefault();

        const postUrl = `${window.location.origin}/posts/${post.id}`;
        const text = `Check out this discussion: ${post.title}`;

        switch (platform) {
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`, '_blank');
                break;
            case 'whatsapp':
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + postUrl)}`, '_blank');
                break;
            case 'email':
                window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(postUrl)}`;
                break;
            case 'copy':
                navigator.clipboard.writeText(postUrl).then(() => {
                    this.message.success('Link copied to clipboard!');
                }).catch(err => {
                    this.message.error('Failed to copy link.');
                });
                break;
        }
    }

    replyToComment(comment: Comment): void {
        const mention = `@${comment.username || comment.userId} `;
        if (!this.newCommentContent.includes(mention)) {
            this.newCommentContent = mention + this.newCommentContent;
        }

        // If the comment we're replying to is itself a reply, we link to its parent 
        // to maintain only one level of nesting (classic forum style)
        this.selectedParentId = comment.parentId || comment.id;

        // Scroll to the reply box
        const element = document.querySelector('.comment-input-card') || document.querySelector('textarea');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (element instanceof HTMLTextAreaElement) {
                element.focus();
            } else {
                const textarea = element.querySelector('textarea');
                if (textarea) textarea.focus();
            }
        }
    }

    reportPost(post: Post, event?: Event): void {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        this.modal.confirm({
            nzTitle: 'Report this post?',
            nzContent: 'If you find this post inappropriate, you can report it. Posts with multiple reports will be automatically suspended.',
            nzOkText: 'Report',
            nzOkType: 'primary',
            nzOkDanger: true,
            nzOnOk: () => {
                this.forumService.reportPost(this.post!.id).subscribe({
                    next: () => {
                        this.message.success('Post reported successfully.');
                        this.router.navigate(['/posts']);
                    },
                    error: (err: any) => {
                        const msg = err?.error?.message || 'Failed to report post.';
                        this.message.error(msg);
                    }
                });
            }
        });
    }

    isEdited(item: any): boolean {
        if (!item.createdAt || !item.updatedAt) return false;
        const created = new Date(item.createdAt).getTime();
        const updated = new Date(item.updatedAt).getTime();
        // Return true if updated more than 5 seconds after creation
        return (updated - created) > 5000;
    }

    sendMessageToAuthor(): void {
        if (!this.post || !this.post.userId) return;
        this.router.navigate(['/chat'], {
            queryParams: { recipientId: this.post.userId }
        });
    }
}
