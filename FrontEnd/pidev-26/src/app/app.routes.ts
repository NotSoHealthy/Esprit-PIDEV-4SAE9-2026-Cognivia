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
        path: 'pharmacy',
        title: 'Pharmacy',
        canMatch: [roleGuard(['ROLE_PHARMACY', 'ROLE_ADMIN', 'ROLE_CAREGIVER', 'ROLE_DOCTOR'])],
        loadComponent: () =>
          import('./features/pharmacy/pharmacy').then((m) => m.Pharmacy),
      },
      {
        path: 'medications/:pharmacyId',
        title: 'Medications',
        canMatch: [roleGuard(['ROLE_PHARMACY', 'ROLE_ADMIN', 'ROLE_CAREGIVER', 'ROLE_DOCTOR'])],
        loadComponent: () =>
          import('./features/pharmacy/medication/medication-page').then((m) => m.MedicationPage),
      },
      {
        path: 'prescriptions',
        title: 'Prescriptions',
        canMatch: [roleGuard(['ROLE_DOCTOR', 'ROLE_PHARMACY', 'ROLE_ADMIN', 'ROLE_CAREGIVER'])],
        loadComponent: () =>
          import('./features/prescription/prescription').then((m) => m.PrescriptionComponent),
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
