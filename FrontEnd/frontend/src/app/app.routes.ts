import { Routes } from '@angular/router';
import { TasksComponent } from './app/pages/tasks/tasks.component';


export const routes: Routes = [
  { path: 'tasks', component: TasksComponent },
  { path: '', redirectTo: 'tasks', pathMatch: 'full' }
];
