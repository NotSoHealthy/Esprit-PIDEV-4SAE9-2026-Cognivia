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
        title: 'Dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'profile',
        title: 'Profile',
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
        path: 'admin/tests',
        title: 'Admin Tests',
        loadComponent: () => import('./features/cognitive-tests/admin/test-list/test-list.component').then(m => m.TestListComponent)
      },
      {
        path: 'admin/tests/new',
        loadComponent: () => import('./features/cognitive-tests/admin/test-form/test-form.component').then(m => m.TestFormComponent)
      },
      {
        path: 'admin/tests/edit/:id',
        loadComponent: () => import('./features/cognitive-tests/admin/test-form/test-form.component').then(m => m.TestFormComponent)
      },
      {
        path: 'admin/tests/:id/questions',
        loadComponent: () => import('./features/cognitive-tests/admin/question-management/question-management.component').then(m => m.QuestionManagementComponent)
      },
      {
        path: 'user/tests',
        title: 'Tests',
        loadComponent: () => import('./features/cognitive-tests/user/test-list/patient-test-list.component').then(m => m.PatientTestListComponent)
      },
      {
        path: 'user/tests/take/:testId',
        loadComponent: () => import('./features/cognitive-tests/user/test-take/test-take.component').then(m => m.TestTakeComponent)
      },
      {
        path: 'results/:id',
        loadComponent: () => import('./features/cognitive-tests/user/result-view/result-view.component').then(m => m.ResultViewComponent)
      },
      {
        path: 'doctor/risk-assessment',
        title: 'Risk Assessments',
        canMatch: [roleGuard(['ROLE_DOCTOR', 'ROLE_ADMIN'])],
        loadComponent: () => import('./features/cognitive-tests/admin/risk-assessment/risk-assessment.component').then(m => m.RiskAssessmentComponent)
      },
      {
        path: 'user/games/memory',
        title: 'Cognitive Games',
        loadComponent: () => import('./features/games/memory-game-view/memory-game-view.component').then(m => m.MemoryGameViewComponent)
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
