import { CommonModule } from '@angular/common';
import { Component, OnInit, Type, inject } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from '../../core/auth/keycloak.service';
import { PatientService } from '../../core/services/care/patient.service';
import { Doctor } from './doctor/doctor';
import { Patient } from './patient/patient';

@Component({
  selector: 'app-dashboard-page',
  imports: [CommonModule],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
})
export class DashboardPage implements OnInit {
  private readonly router = inject(Router);
  private readonly keycloak = inject(KeycloakService);
  private readonly patientService = inject(PatientService);

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
      const userId = this.keycloak.getUserId();
      if (userId) {
        this.patientService.getPatientByUserId(userId).subscribe({
          next: (patient) => {
            if (patient && patient.id && patient.firstName) {
              // Existing patient: load dashboard component
              this.dashboardComponent = Patient;
            } else {
              // New patient: redirect to welcome wizard
              void this.router.navigateByUrl('/welcome', { replaceUrl: true });
            }
          },
          error: () => {
            // Assume new patient if error or 404
            void this.router.navigateByUrl('/welcome', { replaceUrl: true });
          }
        });
      } else {
        void this.router.navigateByUrl('/welcome', { replaceUrl: true });
      }
      return;
    }

    this.dashboardComponent = null;
  }
}
