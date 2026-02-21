import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TestAssignmentService } from '../../../../core/services/cognitive-tests/assignment.service';
import { PatientService } from '../../../../core/services/care/patient.service';
import { KeycloakService } from '../../../../core/auth/keycloak.service';
import { TestAssignment } from '../../../../core/models/cognitive-tests/test-assignment.model';

@Component({
    selector: 'app-patient-test-list',
    imports: [RouterModule, CommonModule],
    templateUrl: './patient-test-list.component.html',
    styleUrls: ['./patient-test-list.component.css']
})
export class PatientTestListComponent implements OnInit {
    assignments: TestAssignment[] = [];
    loading = true;
    error = '';

    constructor(
        private assignmentService: TestAssignmentService,
        private patientService: PatientService,
        private keycloakService: KeycloakService,
        private cdr: ChangeDetectorRef,
        private zone: NgZone
    ) { }

    ngOnInit(): void {
        this.zone.run(() => {
            console.log('PatientTestListComponent initialized');
            this.resolvePatientWithRetry();
        });
    }

    private resolvePatientWithRetry(attempts = 0): void {
        const userId = this.keycloakService.getUserId();
        console.log(`Resolving patient (attempt ${attempts + 1}). UserID:`, userId);

        if (userId) {
            this.resolvePatient(userId);
        } else if (attempts < 8) {
            console.log(`UserID not ready yet, retrying... (attempt ${attempts + 1})`);
            // Wait 500ms and try again, Keycloak sometimes takes a moment
            setTimeout(() => {
                this.zone.run(() => this.resolvePatientWithRetry(attempts + 1));
            }, 500);
        } else {
            this.showError('Could not verify your identity. Please try refreshing or clicking your profile.');
        }
    }

    private resolvePatient(userId: string): void {
        this.patientService.getPatientByUserId(userId).subscribe({
            next: (patient) => {
                console.log('Patient profile resolved:', patient);
                if (patient?.id) {
                    this.loadAssignments(patient.id);
                } else {
                    this.showError('No patient profile found. Please complete your profile first.');
                }
            },
            error: (err) => {
                console.error('Error resolving patient profile:', err);
                this.showError('Could not load your patient profile. Please try again.');
            }
        });
    }

    loadAssignments(patientId: number): void {
        console.log('Loading assignments for patient:', patientId);
        this.assignmentService.getAssignmentsForPatient(patientId).subscribe({
            next: (data: TestAssignment[]) => {
                this.zone.run(() => {
                    console.log('Assignments loaded:', data.length);
                    this.assignments = data;
                    this.loading = false;
                    this.cdr.markForCheck();
                    this.cdr.detectChanges();
                });
            },
            error: (err: any) => {
                this.zone.run(() => {
                    this.showError('Error loading your assigned tests.');
                    console.error('Error loading assignments', err);
                });
            }
        });
    }

    private showError(msg: string): void {
        this.zone.run(() => {
            this.error = msg;
            this.loading = false;
            this.cdr.markForCheck();
            this.cdr.detectChanges();
        });
    }

    getSeverityBadgeClass(assignment: TestAssignment): string {
        if (assignment.assignmentType === 'TARGETED') return 'badge-targeted';
        const sev = assignment.targetSeverity?.toLowerCase() || '';
        return `badge-sev-${sev}`;
    }
}
