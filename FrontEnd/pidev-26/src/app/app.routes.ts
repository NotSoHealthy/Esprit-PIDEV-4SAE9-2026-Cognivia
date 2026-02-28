import { Routes } from '@angular/router';

import { authGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: '',
    canMatch: [authGuard],
    loadComponent: () => import('./core/layout/app-layout').then((m) => m.AppLayout),
    children: [
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
        path: 'patient-management',
        title: 'Patients',
        canMatch: [roleGuard(['ROLE_DOCTOR', 'ROLE_CAREGIVER', 'ROLE_ADMIN'])],
        loadChildren: () =>
          import('./features/patient-management/patient-list.route').then((m) => m.routes),},
      {

        path: 'tasks',
        loadComponent: () => import('./features/tasks/tasks.page').then((m) => m.TasksPage),
      },
      {
        path: 'tasks/create',
        loadComponent: () => import('./features/tasks/create/tasks-create.page').then((m) => m.TasksCreatePage),
      },
      {
        path: 'tasks/list',
        loadComponent: () => import('./features/tasks/list/tasks-list.page').then((m) => m.TasksListPage),
      },
      {
        path: 'tasks/update',
        loadComponent: () => import('./features/tasks/update/tasks-update.page').then((m) => m.TasksUpdatePage),
      },
      {
  path: 'appointments',
  loadComponent: () =>
    import('./features/appointments/appointments').then(m => m.Appointments),
}
      
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
