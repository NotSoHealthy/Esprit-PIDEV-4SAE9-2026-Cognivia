import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ForumService } from '../../services/forum.service';
import { Post } from '../../models/post.model';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './post-list.component.html',
  styleUrl: './post-list.component.scss'
})
export class PostListComponent implements OnInit {
  posts: Post[] = [];

  constructor(private forumService: ForumService) { }

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.forumService.getAllPosts().subscribe({
      next: (data) => this.posts = data,
      error: (e) => console.error('Error fetching posts', e)
    });
  }
}
