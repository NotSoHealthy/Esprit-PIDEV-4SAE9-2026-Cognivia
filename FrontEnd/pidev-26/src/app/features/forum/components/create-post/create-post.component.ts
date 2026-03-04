import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzMentionModule } from 'ng-zorro-antd/mention';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { ForumService } from '../../services/forum.service';
import { Post } from '../../models/post.model';
import { KeycloakService } from '../../../../core/auth/keycloak.service';

@Component({
    selector: 'app-create-post',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        NzFormModule,
        NzInputModule,
        NzButtonModule,
        NzCardModule,
        NzMentionModule,
        NzSelectModule
    ],
    templateUrl: './create-post.component.html',
    styleUrl: './create-post.component.scss'
})
export class CreatePostComponent {
    post: Post = {
        id: 0,
        title: '',
        content: ''
    };

    suggestions: string[] = ['admin', 'doctor_yahya', 'nurse_sarah', 'patient_john', 'healthcare_bot', 'community_manager'];
    submitting = false;

    private forumService = inject(ForumService);
    private router = inject(Router);
    private message = inject(NzMessageService);
    private cdr = inject(ChangeDetectorRef);
    private keycloakService = inject(KeycloakService);

    constructor() { }

    createPost(): void {
        if (!this.post.title || !this.post.content) return;

        this.post.username = this.keycloakService.getUsername();
        this.submitting = true;
        this.forumService.createPost(this.post).subscribe({
            next: () => {
                this.message.success('Post created successfully!');
                this.router.navigate(['/posts']);
            },
            error: (e: any) => {
                this.submitting = false;
                this.cdr.detectChanges();
                console.error('Error creating post', e);
                const msg = e?.error?.message || 'Failed to create post. Please try again.';
                this.message.error(msg);
            }
        });
    }
}
