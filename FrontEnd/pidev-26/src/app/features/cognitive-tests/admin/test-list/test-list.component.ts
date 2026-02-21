import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CognitiveTestService } from '../../../../core/services/cognitive-tests/test.service';
import { TestAssignmentService } from '../../../../core/services/cognitive-tests/assignment.service';
import { PatientService } from '../../../../core/services/care/patient.service';
import { CognitiveTest } from '../../../../core/models/cognitive-tests/cognitive-test.model';
import { Patient } from '../../../../core/models/care/patient.model';
import { TestAssignment, AssignmentType, SeverityTarget } from '../../../../core/models/cognitive-tests/test-assignment.model';
import { Frequency } from '../../../../core/models/cognitive-tests/frequency.enum';

@Component({
    selector: 'app-test-list',
    imports: [RouterModule, FormsModule, CommonModule],
    templateUrl: './test-list.component.html',
    styleUrls: ['./test-list.component.css']
})
export class TestListComponent implements OnInit {
    tests: CognitiveTest[] = [];
    patients: Patient[] = [];

    // Assignment modal state
    showAssignModal = false;
    selectedTest: CognitiveTest | null = null;

    // Assignment form fields
    assignmentType: AssignmentType = 'GENERAL';
    selectedPatientId?: number;
    selectedSeverity?: SeverityTarget;
    selectedFrequency: Frequency = Frequency.ONCE;
    dueAt: string = '';

    assignSuccess = false;
    assignError = '';
    isAssigning = false;

    severityOptions: SeverityTarget[] = ['LOW', 'MEDIUM', 'HIGH', 'EXTREME'];
    frequencyOptions = Object.values(Frequency);

    constructor(
        private testService: CognitiveTestService,
        private assignmentService: TestAssignmentService,
        private patientService: PatientService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadTests();
        this.loadPatients();
    }

    loadTests(): void {
        this.testService.getAllTests().subscribe({
            next: (data: CognitiveTest[]) => {
                this.tests = data;
                this.cdr.detectChanges();
            },
            error: (err: any) => console.error('Error loading tests', err)
        });
    }

    loadPatients(): void {
        this.patientService.getAllPatients().subscribe({
            next: (patients: Patient[]) => {
                this.patients = patients;
                this.cdr.detectChanges();
            },
            error: (err: any) => console.error('Error loading patients', err)
        });
    }

    deleteTest(id: number | undefined): void {
        if (id && confirm('Are you sure you want to delete this test?')) {
            this.testService.deleteTest(id).subscribe({
                next: () => this.loadTests(),
                error: (err: any) => console.error('Error deleting test', err)
            });
        }
    }

    openAssignModal(test: CognitiveTest): void {
        this.selectedTest = test;
        this.assignmentType = 'GENERAL';
        this.selectedPatientId = undefined;
        this.selectedSeverity = undefined;
        this.selectedFrequency = Frequency.ONCE;
        this.dueAt = '';
        this.assignSuccess = false;
        this.assignError = '';
        this.showAssignModal = true;
    }

    closeAssignModal(): void {
        this.showAssignModal = false;
        this.selectedTest = null;
    }

    submitAssignment(): void {
        if (!this.selectedTest?.id) return;

        // Validate
        if (this.assignmentType === 'TARGETED' && !this.selectedPatientId) {
            this.assignError = 'Please select a patient.';
            return;
        }
        if (this.assignmentType === 'GENERAL' && !this.selectedSeverity) {
            this.assignError = 'Please select a severity level.';
            return;
        }

        this.isAssigning = true;
        this.assignError = '';

        const assignment: TestAssignment = {
            frequency: this.selectedFrequency,
            assignmentType: this.assignmentType,
            patientId: this.assignmentType === 'TARGETED' ? this.selectedPatientId : undefined,
            targetSeverity: this.assignmentType === 'GENERAL' ? this.selectedSeverity : undefined,
            dueAt: this.dueAt ? new Date(this.dueAt) : undefined
        };

        this.assignmentService.assignTest(this.selectedTest.id, assignment).subscribe({
            next: () => {
                this.isAssigning = false;
                this.assignSuccess = true;
                this.cdr.detectChanges();
                setTimeout(() => this.closeAssignModal(), 1500);
            },
            error: (err: any) => {
                this.isAssigning = false;
                this.assignError = 'Failed to assign test. Please try again.';
                console.error('Assignment error', err);
                this.cdr.detectChanges();
            }
        });
    }

    getPatientDisplayName(p: Patient): string {
        return `${p.firstName} ${p.lastName} [${p.severity}]`;
    }
}
