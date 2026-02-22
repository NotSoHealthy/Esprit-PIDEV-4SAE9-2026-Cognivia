import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { RiskScoreService } from '../../../core/services/cognitive-tests/risk.service';
import { TestResultService } from '../../../core/services/cognitive-tests/result.service';
import { PatientService } from '../../../core/services/care/patient.service';
import { RiskScore } from '../../../core/models/cognitive-tests/risk-score.model';
import { TestResult } from '../../../core/models/cognitive-tests/test-result.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-doctor',
  standalone: true,
  imports: [CommonModule, RouterLink, NzIconModule, FormsModule],
  templateUrl: './doctor.html',
  styleUrl: './doctor.css',
})
export class Doctor implements OnInit {
  private readonly riskService = inject(RiskScoreService);
  private readonly resultService = inject(TestResultService);
  private readonly patientService = inject(PatientService);
  private readonly cdr = inject(ChangeDetectorRef);

  recentRisks: RiskScore[] = [];
  highRiskCount = 0;
  totalTestsToday = 0;
  totalPatients = 0;

  // Patient list for dashboard
  patients: any[] = [];
  searchTerm: string = '';
  sortBy: 'name' | 'severity' = 'name';

  ngOnInit(): void {
    this.loadMonitoringData();
  }

  loadMonitoringData(): void {
    this.riskService.getAllRisks().subscribe({
      next: (risks: RiskScore[]) => {
        this.recentRisks = [...risks].sort((a: RiskScore, b: RiskScore) => {
          const dateA = a.generatedAt ? new Date(a.generatedAt).getTime() : 0;
          const dateB = b.generatedAt ? new Date(b.generatedAt).getTime() : 0;
          return dateB - dateA;
        }).slice(0, 5);

        this.highRiskCount = risks.filter((r: RiskScore) => r.riskLevel?.toLowerCase() === 'high').length;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error loading risks:', err)
    });

    this.resultService.getAllResults().subscribe({
      next: (results: TestResult[]) => {
        const today = new Date().toDateString();
        this.totalTestsToday = results.filter((r: TestResult) =>
          r.takenAt ? new Date(r.takenAt).toDateString() === today : false
        ).length;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error loading results:', err)
    });

    this.patientService.getAllPatients().subscribe({
      next: (patients: any[]) => {
        this.patients = patients;
        this.totalPatients = patients.length;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error loading patients:', err)
    });
  }

  get filteredPatients(): any[] {
    let result = [...this.patients];

    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      result = result.filter(p =>
        p.firstName?.toLowerCase().includes(q) ||
        p.lastName?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (this.sortBy === 'name') {
        return (a.lastName || '').localeCompare(b.lastName || '');
      } else {
        const severityOrder: Record<string, number> = { 'EXTREME': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        return (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99);
      }
    });

    return result;
  }

  getRiskClass(level: string): string {
    switch (level?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50 border-red-100';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'low': return 'text-green-600 bg-green-50 border-green-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  }

  getSeverityClass(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'EXTREME': return 'bg-purple-100 text-purple-700';
      case 'HIGH': return 'bg-red-100 text-red-700';
      case 'MEDIUM': return 'bg-amber-100 text-amber-700';
      case 'LOW': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}
