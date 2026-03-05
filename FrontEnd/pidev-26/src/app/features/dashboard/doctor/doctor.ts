import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { RiskScoreService } from '../../../core/services/cognitive-tests/risk.service';
import { TestResultService } from '../../../core/services/cognitive-tests/result.service';
import { PatientService } from '../../../core/services/care/patient.service';
import { RiskScore } from '../../../core/models/cognitive-tests/risk-score.model';
import { TestResult } from '../../../core/models/cognitive-tests/test-result.model';
import { CognitiveTestService } from '../../../core/services/cognitive-tests/test.service';
import { CommonModule } from '@angular/common';
import { SignatureModalComponent } from '../../../shared/components/signature-modal/signature-modal.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-doctor',
  standalone: true,
  imports: [CommonModule, NzIconModule, FormsModule, SignatureModalComponent, MatIconModule],
  templateUrl: './doctor.html',
  styleUrl: './doctor.css',
})
export class Doctor implements OnInit {
  private readonly riskService = inject(RiskScoreService);
  private readonly resultService = inject(TestResultService);
  private readonly patientService = inject(PatientService);
  private readonly testService = inject(CognitiveTestService);
  private readonly cdr = inject(ChangeDetectorRef);

  recentRisks: RiskScore[] = [];
  highRiskCount = 0;
  totalTestsToday = 0;
  totalPatients = 0;
  clinicalFlagCount = 0;
  today = new Date();

  // Patient list for dashboard
  patients: any[] = [];
  searchTerm: string = '';
  sortBy: 'name' | 'severity' = 'name';
  isDownloading = false;

  // Signature Modal State
  showSignatureModal = false;
  selectedPatientId: number | null = null;

  ngOnInit(): void {
    this.loadMonitoringData();
  }

  loadMonitoringData(): void {
    // We need both patients and risks to show the table correctly
    this.patientService.getAllPatients().subscribe({
      next: (patients: any[]) => {
        this.patients = patients;
        this.totalPatients = patients.length;

        // After patients are loaded, get risks and map them
        this.riskService.getAllRisks().subscribe({
          next: (risks: RiskScore[]) => {
            // 1. Update overall stats
            this.recentRisks = [...risks]
              .sort((a: RiskScore, b: RiskScore) => {
                const dateA = a.generatedAt ? new Date(a.generatedAt).getTime() : 0;
                const dateB = b.generatedAt ? new Date(b.generatedAt).getTime() : 0;
                return dateB - dateA;
              })
              .slice(0, 5);

            this.highRiskCount = risks.filter(
              (r: RiskScore) => r.riskLevel?.toLowerCase() === 'high',
            ).length;
            this.clinicalFlagCount = risks.filter((r: RiskScore) => r.clinicalFlag).length;

            // 2. Map the latest risk to each patient for the table
            this.patients = this.patients.map((p) => {
              // Find the newest risk for this specific patient
              const patientRisks = risks.filter((r) => r.patientId === p.id);
              const latestRisk = patientRisks.sort((a, b) => {
                const dateA = a.generatedAt ? new Date(a.generatedAt).getTime() : 0;
                const dateB = b.generatedAt ? new Date(b.generatedAt).getTime() : 0;
                return dateB - dateA;
              })[0];

              return { ...p, currentRisk: latestRisk };
            });

            this.cdr.detectChanges();
          },
          error: (err: any) => console.error('Error loading risks:', err),
        });
      },
      error: (err: any) => console.error('Error loading patients:', err),
    });

    this.resultService.getAllResults().subscribe({
      next: (results: TestResult[]) => {
        const today = new Date().toDateString();
        this.totalTestsToday = results.filter((r: TestResult) =>
          r.takenAt ? new Date(r.takenAt).toDateString() === today : false,
        ).length;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error loading results:', err),
    });
  }

  get filteredPatients(): any[] {
    let result = [...this.patients];

    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      result = result.filter(
        (p) => p.firstName?.toLowerCase().includes(q) || p.lastName?.toLowerCase().includes(q),
      );
    }

    result.sort((a, b) => {
      if (this.sortBy === 'name') {
        return (a.lastName || '').localeCompare(b.lastName || '');
      } else {
        const severityOrder: Record<string, number> = { EXTREME: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99);
      }
    });

    return result;
  }

  getRiskClass(level: string): string {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-100';
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-100';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  }

  getRiskValueClass(value: number | undefined): string {
    if (!value) return 'text-gray-400';
    if (value >= 70) return 'text-red-600';
    if (value >= 40) return 'text-orange-500';
    return 'text-green-600';
  }

  getRiskBadgeClass(level: string | undefined): string {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-orange-400';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  }

  getSeverityClass(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'EXTREME':
        return 'bg-purple-100 text-purple-700';
      case 'HIGH':
        return 'bg-red-100 text-red-700';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-700';
      case 'LOW':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  downloadMLData(): void {
    if (this.isDownloading) return;

    this.isDownloading = true;
    this.testService.downloadMLData().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `patient_ml_data_${new Date().getTime()}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.isDownloading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Download failed', err);
        this.isDownloading = false;
        this.cdr.detectChanges();
      },
    });
  }

  getSlopeClass(slope: number | undefined): string {
    if (!slope || Math.abs(slope) <= 2) return 'text-gray-400';
    return slope > 0 ? 'text-green-500' : 'text-red-500';
  }

  getSlopeIcon(slope: number | undefined): string {
    if (!slope || Math.abs(slope) <= 2) return 'minus';
    return slope > 0 ? 'arrow-up' : 'arrow-down';
  }

  downloadReport(patientId: number): void {
    this.selectedPatientId = patientId;
    this.showSignatureModal = true;
    this.cdr.detectChanges();
  }

  handleSignatureSave(signatureBase64: string): void {
    if (!this.selectedPatientId) return;

    this.showSignatureModal = false;
    const patientId = this.selectedPatientId;

    this.resultService.downloadReport(patientId, signatureBase64).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Clinical_Report_Patient_${patientId}_${new Date().getTime()}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.selectedPatientId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Report download failed', err);
        this.selectedPatientId = null;
        this.cdr.detectChanges();
      },
    });
  }

  handleSignatureCancel(): void {
    this.showSignatureModal = false;
    this.selectedPatientId = null;
    this.cdr.detectChanges();
  }
}
