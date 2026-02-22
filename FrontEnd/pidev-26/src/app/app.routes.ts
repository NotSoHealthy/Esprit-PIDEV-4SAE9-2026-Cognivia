import { Routes } from '@angular/router';
import { homeRedirectGuard } from './core/auth/home-redirect.guard';
import { authGuard, roleGuard } from './core/auth/auth.guard';

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
      {
        path: 'chat',
        loadComponent: () =>
          import('./features/forum/components/chat/chat.component').then(
            (m) => m.ChatComponent,
          ),
      },
      {
        path: 'patient-management',
        title: 'Patients',
        canMatch: [roleGuard(['ROLE_DOCTOR', 'ROLE_CAREGIVER', 'ROLE_ADMIN'])],
        loadChildren: () =>
          import('./features/patient-management/patient-list.route').then((m) => m.routes),
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
