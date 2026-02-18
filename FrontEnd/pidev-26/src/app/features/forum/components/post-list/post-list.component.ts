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
        RouterLink
    ],
    templateUrl: './post-list.component.html',
    styleUrl: './post-list.component.scss'
})
export class PostListComponent implements OnInit {
    posts: Post[] = [];

    private forumService = inject(ForumService);
    private cdr = inject(ChangeDetectorRef);

    constructor() { }

    ngOnInit(): void {
        this.loadPosts();
    }

    loadPosts(): void {
        this.forumService.getAllPosts().subscribe({
            next: (data: Post[]) => {
                this.posts = data;
                this.cdr.detectChanges();
            },
            error: (e: any) => console.error('Error fetching posts', e)
        });
    }
}
