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
import { HighlightSearchPipe } from '../../../../shared/pipes/highlight-search.pipe';
import { ReactionDetailsComponent } from '../reaction-details/reaction-details.component';
import { WordMapComponent } from '../word-map/word-map.component';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NzInputModule } from 'ng-zorro-antd/input';
import { FormsModule } from '@angular/forms';

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
        NzSpinModule,
        NzInputModule,
        FormsModule,
        TimeAgoPipe,
        HighlightSearchPipe,
        RouterLink,
        WordMapComponent
    ],
    providers: [NzModalService, NzMessageService],
    templateUrl: './post-list.component.html',
    styleUrl: './post-list.component.scss'
})
export class PostListComponent implements OnInit {
    posts: Post[] = [];
    filteredPosts: Post[] = [];
    selectedCategory: string = 'all';
    currentUserId: string = '';
    currentUsername: string = '';
    selectedTag: string = '';
    searchTerm: string = '';
    private searchSubject = new Subject<string>();

    // AI Summary state
    postSummaries: Map<number, string> = new Map();
    loadingSummaries: Set<number> = new Set();

    // Pagination
    currentPage: number = 0;
    pageSize: number = 5;
    totalPosts: number = 0;
    isFirstPage: boolean = true;
    isLastPage: boolean = false;
    loading: boolean = true;

    categories = [
        { key: 'all', label: 'All Topics' },
        { key: 'Research & Clinical', label: 'Research & Clinical' },
        { key: 'Care & Support', label: 'Care & Support' },
        { key: 'Medication', label: 'Medication' },
        { key: 'Symptoms & Diagnosis', label: 'Symptoms & Diagnosis' },
        { key: 'Neurology', label: 'Neurology' },
        { key: 'General', label: 'General Discussion' }
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

        // Setup search debouncing
        this.searchSubject.pipe(
            debounceTime(400),
            distinctUntilChanged()
        ).subscribe(term => {
            this.handleSearch(term);
        });

        // Load initial posts
        this.loadPosts();
    }

    onSearchTermChange(term: string): void {
        this.searchSubject.next(term);
    }

    handleSearch(term: string): void {
        this.searchTerm = term;
        this.currentPage = 0; // Reset to first page when searching
        this.loadPosts();
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.handleSearch('');
    }

    loadPosts(): void {
        this.loading = true;
        const searchKeyword = this.searchTerm || this.selectedTag;
        this.forumService.getAllPosts(this.currentPage, this.pageSize, this.selectedCategory, searchKeyword).subscribe({
            next: (response: any) => {
                // Defer state assignment to next microtask to avoid NG0100 on posts.length
                Promise.resolve().then(() => {
                    if (response && response.content) {
                        this.posts = response.content;
                        this.filteredPosts = [...this.posts];
                        this.totalPosts = response.totalElements;
                        this.isFirstPage = response.first;
                        this.isLastPage = response.last;
                    } else {
                        this.posts = [];
                        this.filteredPosts = [];
                        this.totalPosts = 0;
                    }
                    this.loading = false;
                    this.cdr.detectChanges();
                });
            },
            error: (err) => {
                console.error('Error loading posts', err);
                Promise.resolve().then(() => {
                    this.loading = false;
                    this.cdr.detectChanges();
                });
            }
        });
    }

    summarizePost(event: Event, postId: number): void {
        event.stopPropagation();
        if (this.loadingSummaries.has(postId)) return;

        this.loadingSummaries.add(postId);
        this.forumService.getPostSummary(postId).subscribe({
            next: (summary) => {
                this.postSummaries.set(postId, summary);
                this.loadingSummaries.delete(postId);
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error generating summary', err);
                this.message.error('AI summary temporarily unavailable');
                this.loadingSummaries.delete(postId);
                this.cdr.detectChanges();
            }
        });
    }

    toggleSummary(event: Event, postId: number): void {
        event.stopPropagation();
        if (this.postSummaries.has(postId)) {
            this.postSummaries.delete(postId);
        } else {
            this.summarizePost(event, postId);
        }
    }

    nextPage(): void {
        if (!this.isLastPage) {
            this.currentPage++;
            this.loadPosts();
            this.scrollToTop();
        }
    }

    prevPage(): void {
        if (!this.isFirstPage) {
            this.currentPage--;
            this.loadPosts();
            this.scrollToTop();
        }
    }

    private scrollToTop(): void {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    selectCategory(key: string): void {
        this.selectedCategory = key;
        this.selectedTag = ''; // Clear keyword filter when switching categories
        this.currentPage = 0; // Reset to first page
        this.loadPosts();
    }

    handleTagSelection(tag: string): void {
        this.selectedTag = tag;
        this.currentPage = 0;
        this.loadPosts();
        // Scroll to top of posts
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }


    getCategoryLabel(key?: string): string {
        if (!key) return 'General';
        const cat = this.categories.find(c => c.key === key);
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

    repost(post: Post, event: Event): void {
        event.stopPropagation();
        this.forumService.repostPost(post.id).subscribe({
            next: () => {
                this.message.success('Post successfully reposted!');
                this.loadPosts();
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
        if (!post) return null;
        if (post.userReaction) return post.userReaction as ReactionType;
        if (!post.reactions) return null;
        const reaction = post.reactions.find(r => r.userId === this.currentUserId);
        return reaction ? reaction.type : null;
    }

    showReactionDetails(post: Post, event: Event): void {
        event.stopPropagation();
        event.preventDefault();

        // If reactions are not present (due to @JsonIgnore in list view), fetch them on demand
        if (!post.reactions || post.reactions.length === 0) {
            this.forumService.getReactionsByPostId(post.id).subscribe({
                next: (reactions) => {
                    post.reactions = reactions;
                    if (reactions && reactions.length > 0) {
                        this.openReactionModal(reactions);
                    } else {
                        this.message.info('No reactions yet');
                    }
                },
                error: () => this.message.error('Failed to load reaction details')
            });
        } else {
            this.openReactionModal(post.reactions);
        }
    }

    private openReactionModal(reactions: Reaction[]): void {
        this.modal.create({
            nzContent: ReactionDetailsComponent,
            nzData: {
                reactions: reactions
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
