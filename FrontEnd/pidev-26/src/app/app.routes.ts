import { Routes } from '@angular/router';

import { LoginComponent } from './features/auth/login.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
];
