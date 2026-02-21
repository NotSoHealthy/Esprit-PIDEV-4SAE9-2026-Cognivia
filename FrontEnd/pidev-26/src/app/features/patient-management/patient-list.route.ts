import { Routes } from '@angular/router';

import { roleGuard } from '../../core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./patient-list').then((m) => m.PatientList),
  },
  {
    path: ':id',
    title: 'Patient Information',
    canMatch: [roleGuard(['ROLE_DOCTOR', 'ROLE_CAREGIVER', 'ROLE_ADMIN'])],
    loadComponent: () => import('./patient/patient').then((m) => m.Patient),
  },
];
