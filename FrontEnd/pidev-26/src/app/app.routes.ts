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
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
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
        path: 'posts',
        canMatch: [roleGuard(['ROLE_DOCTOR', 'ROLE_CAREGIVER', 'ROLE_ADMIN'])],
        loadComponent: () =>
          import('./features/forum/components/post-list/post-list.component').then(
            (m) => m.PostListComponent,
          ),
      },
      {
        path: 'posts/new',
        canMatch: [roleGuard(['ROLE_DOCTOR', 'ROLE_CAREGIVER', 'ROLE_ADMIN'])],
        loadComponent: () =>
          import('./features/forum/components/create-post/create-post.component').then(
            (m) => m.CreatePostComponent,
          ),
      },
      {
        path: 'posts/:id',
        canMatch: [roleGuard(['ROLE_DOCTOR', 'ROLE_CAREGIVER', 'ROLE_ADMIN'])],
        loadComponent: () =>
          import('./features/forum/components/post-detail/post-detail.component').then(
            (m) => m.PostDetailComponent,
          ),
      },
      {
        path: 'chat',
        loadComponent: () => import('./features/chat/chat.component').then((m) => m.ChatComponent),
      },
      {
        path: 'admin/reported-posts',
        canMatch: [roleGuard(['ROLE_ADMIN'])],
        loadComponent: () =>
          import('./features/forum/components/admin-reported-posts/admin-reported-posts').then(
            (m) => m.AdminReportedPosts,
          ),
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
        loadComponent: () =>
          import('./features/equipment/maintenance/maintenance').then((m) => m.Maintenance),
      },
      {
        path: 'equipment/reservation',
        canMatch: [roleGuard(['ROLE_DOCTOR', 'ROLE_CAREGIVER', 'ROLE_ADMIN'])],
        loadComponent: () =>
          import('./features/equipment/reservation/reservation').then((m) => m.Reservation),
      },
      {
        path: 'patient-management',
        title: 'Patients',
        canMatch: [roleGuard(['ROLE_DOCTOR', 'ROLE_CAREGIVER', 'ROLE_ADMIN'])],
        loadChildren: () =>
          import('./features/patient-management/patient-list.route').then((m) => m.routes),
      },
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
        title: 'Appointments',
        canMatch: [roleGuard(['ROLE_DOCTOR', 'ROLE_CAREGIVER', 'ROLE_ADMIN'])],
        loadComponent: () =>
          import('./features/appointments/appointments').then(m => m.Appointments),
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
      {
        path: 'admin/tests',
        title: 'Admin Tests',
        loadComponent: () =>
          import('./features/cognitive-tests/admin/test-list/test-list.component').then(
            (m) => m.TestListComponent,
          ),
      },
      {
        path: 'admin/tests/new',
        loadComponent: () =>
          import('./features/cognitive-tests/admin/test-form/test-form.component').then(
            (m) => m.TestFormComponent,
          ),
      },
      {
        path: 'admin/tests/edit/:id',
        loadComponent: () =>
          import('./features/cognitive-tests/admin/test-form/test-form.component').then(
            (m) => m.TestFormComponent,
          ),
      },
      {
        path: 'admin/tests/:id/questions',
        loadComponent: () =>
          import('./features/cognitive-tests/admin/question-management/question-management.component').then(
            (m) => m.QuestionManagementComponent,
          ),
      },
      {
        path: 'user/tests',
        title: 'Tests',
        loadComponent: () =>
          import('./features/cognitive-tests/user/test-list/patient-test-list.component').then(
            (m) => m.PatientTestListComponent,
          ),
      },
      {
        path: 'user/tests/take/:testId',
        loadComponent: () =>
          import('./features/cognitive-tests/user/test-take/test-take.component').then(
            (m) => m.TestTakeComponent,
          ),
      },
      {
        path: 'results/:id',
        loadComponent: () =>
          import('./features/cognitive-tests/user/result-view/result-view.component').then(
            (m) => m.ResultViewComponent,
          ),
      },
      {
        path: 'doctor/risk-assessment',
        title: 'Risk Assessments',
        canMatch: [roleGuard(['ROLE_DOCTOR', 'ROLE_ADMIN'])],
        loadComponent: () =>
          import('./features/cognitive-tests/admin/risk-assessment/risk-assessment.component').then(
            (m) => m.RiskAssessmentComponent,
          ),
      },
      {
        path: 'user/games/memory',
        title: 'Cognitive Games',
        loadComponent: () =>
          import('./features/games/memory-game-view/memory-game-view.component').then(
            (m) => m.MemoryGameViewComponent,
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
