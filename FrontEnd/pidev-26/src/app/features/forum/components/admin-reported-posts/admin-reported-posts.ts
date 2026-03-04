import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ForumService } from '../../services/forum.service';
import { Post } from '../../models/post.model';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-reported-posts',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzPopconfirmModule,
    NzTagModule,
    RouterLink
  ],
  templateUrl: './admin-reported-posts.html',
  styleUrl: './admin-reported-posts.css',
  providers: [NzMessageService]
})
export class AdminReportedPosts implements OnInit {
  posts: Post[] = [];
  loading: boolean = false;
  totalPosts: number = 0;
  pageSize: number = 10;
  pageIndex: number = 1;

  private forumService = inject(ForumService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    setTimeout(() => this.loadReportedPosts());
  }

  loadReportedPosts(): void {
    this.loading = true;
    this.forumService.getReportedPosts(this.pageIndex - 1, this.pageSize).subscribe({
      next: (response: any) => {
        if (response && response.content) {
          this.posts = response.content;
          this.totalPosts = response.totalElements;
        } else {
          this.posts = [];
          this.totalPosts = 0;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (e: any) => {
        console.error('Error fetching reported posts', e);
        this.message.error('Failed to load reported posts.');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPageIndexChange(index: number): void {
    this.pageIndex = index;
    this.loadReportedPosts();
  }

  unbanPost(postId: number): void {
    this.forumService.removeReportsFromPost(postId).subscribe({
      next: () => {
        this.message.success('Post reports removed and unbanned successfully.');
        this.loadReportedPosts();
      },
      error: (e: any) => {
        console.error('Error unbanning post', e);
        this.message.error('Failed to unban the post.');
      }
    });
  }

  deletePost(postId: number): void {
    this.forumService.deletePost(postId).subscribe({
      next: () => {
        this.message.success('Post deleted permanently.');
        this.loadReportedPosts();
      },
      error: (e: any) => {
        console.error('Error deleting post', e);
        this.message.error('Failed to delete the post.');
      }
    });
  }
}
