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
        path: 'careteam',
        title: 'Care Team',
        canMatch: [roleGuard(['ROLE_PATIENT'])],
        loadComponent: () =>
          import('./features/complaint/careteam/careteam').then((m) => m.Careteam),
      },
      {
        path: 'complaint',
        title: 'My Reports',
        canMatch: [roleGuard(['ROLE_PATIENT', 'ROLE_ADMIN'])],
        loadComponent: () => import('./features/complaint/complaint').then((m) => m.Complaint),
      },
      {
        path: 'equipment',
        canMatch: [roleGuard(['ROLE_DOCTOR', 'ROLE_CAREGIVER', 'ROLE_ADMIN'])],
        loadComponent: () => import('./features/equipment/equipment').then((m) => m.Equipment),
      },
      {
        path: 'equipment/maintenance',
        canMatch: [roleGuard(['ROLE_DOCTOR', 'ROLE_CAREGIVER', 'ROLE_ADMIN'])],
        loadComponent: () => import('./features/equipment/maintenance/maintenance').then((m) => m.Maintenance),
      },
      {
        path: 'equipment/reservation',
        canMatch: [roleGuard(['ROLE_DOCTOR', 'ROLE_CAREGIVER', 'ROLE_ADMIN'])],
        loadComponent: () => import('./features/equipment/reservation/reservation').then((m) => m.Reservation),
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
    path: '**',
    redirectTo: '',
  },
];
