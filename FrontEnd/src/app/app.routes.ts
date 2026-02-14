import { Routes } from '@angular/router';
import { TestListComponent } from './components/admin/test-list/test-list.component';
import { TestFormComponent } from './components/admin/test-form/test-form.component';
import { TestTakeComponent } from './components/user/test-take/test-take.component';
import { ResultViewComponent } from './components/user/result-view/result-view.component';
import { RiskListComponent } from './components/user/risk-list/risk-list.component';
import { PatientTestListComponent } from './components/user/test-list/patient-test-list.component';
import { RoleSelectionComponent } from './components/role-selection/role-selection.component';

export const routes: Routes = [
    { path: '', component: RoleSelectionComponent },
    { path: 'admin/tests', component: TestListComponent },
    { path: 'admin/tests/new', component: TestFormComponent },
    { path: 'admin/tests/edit/:id', component: TestFormComponent },
    { path: 'user/tests', component: PatientTestListComponent },
    { path: 'user/tests/take/:testId', component: TestTakeComponent },
    { path: 'user/risks', component: RiskListComponent },
    { path: 'results/:id', component: ResultViewComponent }
];
