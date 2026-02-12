import { Routes } from '@angular/router';
import { PostListComponent } from './components/post-list/post-list.component';
import { CreatePostComponent } from './components/create-post/create-post.component';
import { PostDetailComponent } from './components/post-detail/post-detail.component';

export const routes: Routes = [
    { path: 'posts', component: PostListComponent },
    { path: 'posts/new', component: CreatePostComponent },
    { path: 'posts/:id', component: PostDetailComponent },
    { path: '', redirectTo: '/posts', pathMatch: 'full' }
];
