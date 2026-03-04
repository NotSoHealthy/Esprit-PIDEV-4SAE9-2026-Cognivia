import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-role-selection',
    imports: [],
    templateUrl: './role-selection.component.html',
    styleUrl: './role-selection.component.css'
})
export class RoleSelectionComponent {
  constructor(private router: Router) { }

  selectRole(role: 'doctor' | 'patient') {
    if (role === 'doctor') {
      this.router.navigate(['/admin/tests']);
    } else {
      this.router.navigate(['/user/tests']);
    }
  }
}
