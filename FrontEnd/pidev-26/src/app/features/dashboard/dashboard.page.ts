import { CommonModule } from '@angular/common';
import { Component, OnInit, Type, inject } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from '../../core/auth/keycloak.service';
import { Doctor } from './doctor/doctor';
import { Patient } from './patient/patient';
import { DashboardPharmacy } from './pharmacy/pharmacy';

@Component({
  selector: 'app-dashboard-page',
  imports: [CommonModule],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
})
export class DashboardPage implements OnInit {
  private readonly router = inject(Router);
  private readonly keycloak = inject(KeycloakService);

  dashboardComponent: Type<unknown> | null = null;

  ngOnInit(): void {
    this.selectDashboardByRole();
  }

  private selectDashboardByRole(): void {
    if (!this.keycloak.isLoggedIn()) {
      void this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    const normalize = (r: string) =>
      r
        .trim()
        .toLowerCase()
        .replace(/^role_/, '');
    const roles = new Set(this.keycloak.getRealmRoles().map(normalize));

    if (roles.has('doctor') || roles.has('caregiver') || roles.has('admin')) {
      this.dashboardComponent = Doctor;
      return;
    }

    if (roles.has('patient')) {
      void this.router.navigateByUrl('/user/tests', { replaceUrl: true });
      return;
    }

    if (roles.has('pharmacy')) {
      this.dashboardComponent = DashboardPharmacy;
      return;
    }

    this.dashboardComponent = null;
  }
}
