import { Routes } from '@angular/router';

import { authGuard, homeRedirectGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [homeRedirectGuard],
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
          import('./features/patient-management/patient-list.route').then((m) => m.routes),
      },
      {
        path: 'calendar',
        title: 'Calendar',
        canMatch: [roleGuard(['ROLE_CAREGIVER'])],
        loadComponent: () =>
          import('./features/caregiver/calendar/calendar').then((m) => m.Calendar),
      },
      {
        path: 'visit/:visitId/report',
        title: 'Visit Report',
        canMatch: [roleGuard(['ROLE_CAREGIVER', 'ROLE_DOCTOR', 'ROLE_ADMIN'])],
        loadComponent: () =>
          import('./features/caregiver/visit-report/visit-report.page').then(
            (m) => m.VisitReportPage,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
