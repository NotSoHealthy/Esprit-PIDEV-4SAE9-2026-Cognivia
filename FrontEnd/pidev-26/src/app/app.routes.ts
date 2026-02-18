import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { homeRedirectGuard } from './core/auth/home-redirect.guard';

export const routes: Routes = [
  {
    path: '',
    canMatch: [authGuard],
    loadComponent: () => import('./core/layout/app-layout').then((m) => m.AppLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'posts',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'posts',
        loadComponent: () =>
          import('./features/forum/components/post-list/post-list.component').then(
            (m) => m.PostListComponent,
          ),
      },
      {
        path: 'posts/new',
        loadComponent: () =>
          import('./features/forum/components/create-post/create-post.component').then(
            (m) => m.CreatePostComponent,
          ),
      },
      {
        path: 'posts/:id',
        loadComponent: () =>
          import('./features/forum/components/post-detail/post-detail.component').then(
            (m) => m.PostDetailComponent,
          ),
      },
    ],
  },
  {
    path: '',
    pathMatch: 'full',
    canActivate: [homeRedirectGuard],
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
