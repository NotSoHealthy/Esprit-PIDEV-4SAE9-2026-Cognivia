import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ForumService } from '../../services/forum.service';
import { Post } from '../../models/post.model';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.scss'
})
export class CreatePostComponent {
  post: Post = {
    id: 0,
    title: '',
    content: ''
  };

  constructor(private forumService: ForumService, private router: Router) { }

  createPost(): void {
    this.forumService.createPost(this.post).subscribe({
      next: () => this.router.navigate(['/posts']),
      error: (e) => console.error('Error creating post', e)
    });
  }
}
