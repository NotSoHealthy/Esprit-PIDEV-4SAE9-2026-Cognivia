import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { RouterLink } from '@angular/router';
import { ForumService } from '../../services/forum.service';
import { Post } from '../../models/post.model';
import { KeycloakService } from '../../../../core/auth/keycloak.service';
import { ReactionType, Reaction } from '../../models/reaction.model';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';
import { HighlightMentionPipe } from '../../../../shared/pipes/highlight-mention.pipe';
import { ReactionDetailsComponent } from '../reaction-details/reaction-details.component';

import { NzListModule } from 'ng-zorro-antd/list';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

@Component({
    selector: 'app-post-list',
    standalone: true,
    imports: [
        CommonModule,
        NzCardModule,
        NzButtonModule,
        NzIconModule,
        NzAvatarModule,
        NzGridModule,
        NzEmptyModule,
        NzListModule,
        NzTypographyModule,
        NzTooltipModule,
        NzTagModule,
        NzModalModule,
        NzDropDownModule,
        TimeAgoPipe,
        HighlightMentionPipe,
        RouterLink
    ],
    templateUrl: './post-list.component.html',
    styleUrl: './post-list.component.scss'
})
export class PostListComponent implements OnInit {
    posts: Post[] = [];
    filteredPosts: Post[] = [];
    selectedCategory: string = 'all';
    currentUserId: string = '';
    currentUsername: string = '';

    categories = [
        { key: 'all', label: 'All Topics', icon: '📋' },
        { key: 'patient-care', label: 'Patient Care', icon: '🩺' },
        { key: 'treatment', label: 'Treatment Options', icon: '💊' },
        { key: 'mental-health', label: 'Mental Health', icon: '🧠' },
        { key: 'rehab', label: 'Rehabilitation', icon: '🏃' },
    ];

    private forumService = inject(ForumService);
    private cdr = inject(ChangeDetectorRef);
    private keycloakService = inject(KeycloakService);
    private message = inject(NzMessageService);
    private modal = inject(NzModalService);

    constructor() { }

    ngOnInit(): void {
        this.currentUserId = this.keycloakService.getUserId() || '';
        this.currentUsername = (this.keycloakService.getUsername() as string) || '';
        this.loadPosts();
    }

    loadPosts(): void {
        this.forumService.getAllPosts().subscribe({
            next: (data: Post[]) => {
                this.posts = data || [];
                this.filteredPosts = [...this.posts];
                this.cdr.detectChanges();
            },
            error: (e: any) => console.error('Error fetching posts', e)
        });
    }

    selectCategory(key: string): void {
        this.selectedCategory = key;
        if (key === 'all') {
            this.filteredPosts = [...this.posts];
        } else {
            this.filteredPosts = this.posts.filter(p => p.category === key);
        }
    }

    getCategoryLabel(key?: string): string {
        const cat = this.categories.find(c => c.key === key);
        return cat ? cat.label : 'General';
    }

    getCategoryIcon(key?: string): string {
        const cat = this.categories.find(c => c.key === key);
        return cat ? cat.icon : '🗺️';
    }

    togglePin(post: Post, event: Event): void {
        event.stopPropagation();
        event.preventDefault();
        this.forumService.togglePin(post.id).subscribe({
            next: () => {
                this.message.success(post.pinned ? 'Post unpinned' : 'Post pinned');
                this.loadPosts();
            },
            error: (e: any) => {
                console.error('Error toggling pin', e);
                this.message.error('Failed to update pin status');
            }
        });
    }

    getTimeAgo(dateStr?: string): string {
        if (!dateStr) return '';
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    react(post: Post, type: any, event: Event): void {
        event.stopPropagation();
        event.preventDefault();

        const reaction: Partial<Reaction> = {
            id: 0,
            type: type as ReactionType,
            userId: this.currentUserId,
            username: this.currentUsername
        };

        this.forumService.addReaction(post.id, reaction as Reaction).subscribe({
            next: () => {
                this.loadPosts();
            },
            error: (e: any) => console.error('Error adding reaction', e)
        });
    }

    shouldShowReadMore(content?: string): boolean {
        if (!content) return false;
        // Threshold for roughly 3 lines of text
        return content.length > 200;
    }

    isDoctor(post: Post): boolean {
        const username = post.username || post.userId || '';
        return username.toLowerCase().includes('doctor');
    }

    // - **Hover-reveal Picker:** Users can hover over the "Reaction" button to choose from 6 different emojis.
    // - **Individual Reaction Counts:** Real-time summary of all reactions on each post.
    // - **Icon Registration:** All reaction icons (Like, Heart, Smile, Bulb, Frown, Alert) are registered in the Angular app configuration.
    // - **Robust Persistence:** Backend logic handles toggles, swaps, and valid user IDs across all reaction types.
    // - **DB Migration:** Automated script to ensure the database allows the new reaction types.
    like(post: Post, event: Event): void {
        const current = this.getUserReaction(post);
        // If already reacted, clicking the button toggles (removes) the current reaction
        this.react(post, current ? current : ReactionType.LIKE, event);
    }

    getReactionIcon(type: ReactionType | null | string): string {
        switch (type) {
            case ReactionType.LIKE: return 'like';
            case ReactionType.DISLIKE: return 'dislike';
            case ReactionType.LOVE: return 'heart';
            case ReactionType.HAHA: return 'smile';
            case ReactionType.WOW: return 'bulb';
            case ReactionType.SAD: return 'frown';
            case ReactionType.ANGRY: return 'alert';
            default: return 'like';
        }
    }

    getTotalReactions(post: Post): number {
        return (post.likeCount || 0) + (post.dislikeCount || 0) + (post.loveCount || 0) + (post.hahaCount || 0) +
            (post.wowCount || 0) + (post.sadCount || 0) + (post.angryCount || 0);
    }

    getUserReaction(post: Post): ReactionType | null {
        if (!post || !post.reactions) return null;
        const reaction = post.reactions.find(r => r.userId === this.currentUserId);
        return reaction ? reaction.type : null;
    }

    showReactionDetails(post: Post, event: Event): void {
        event.stopPropagation();
        event.preventDefault();

        if (!post.reactions || post.reactions.length === 0) return;

        this.modal.create({
            nzContent: ReactionDetailsComponent,
            nzData: {
                reactions: post.reactions
            },
            nzFooter: null,
            nzWidth: 450,
            nzCentered: true,
            nzBodyStyle: { padding: '0' }
        });
    }

    reportPost(post: Post, event: Event): void {
        event.stopPropagation();
        event.preventDefault();

        this.modal.confirm({
            nzTitle: 'Report this post?',
            nzContent: 'If you find this post inappropriate, you can report it. Posts with multiple reports will be automatically suspended.',
            nzOkText: 'Report',
            nzOkType: 'primary',
            nzOkDanger: true,
            nzOnOk: () => {
                this.forumService.reportPost(post.id).subscribe({
                    next: () => {
                        this.message.success('Post reported successfully.');
                        // After reporting, we can optimistic hide it if we want, 
                        // or just wait for the next refresh. 
                        // The user said "if a post has 2 or more reports... it gets flaged and suspended"
                        // Since we don't know the count here, we could just refresh the list.
                        this.loadPosts();
                    },
                    error: () => this.message.error('Failed to report post.')
                });
            }
        });
    }

    isEdited(item: any): boolean {
        if (!item.createdAt || !item.updatedAt) return false;
        const created = new Date(item.createdAt).getTime();
        const updated = new Date(item.updatedAt).getTime();
        return (updated - created) > 5000;
    }
}
