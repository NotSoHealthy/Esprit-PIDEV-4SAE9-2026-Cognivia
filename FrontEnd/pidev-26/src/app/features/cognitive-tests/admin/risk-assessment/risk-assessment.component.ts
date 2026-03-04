import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { RiskScoreService } from '../../../../core/services/cognitive-tests/risk.service';
import { PatientService } from '../../../../core/services/care/patient.service';
import { RiskScore } from '../../../../core/models/cognitive-tests/risk-score.model';
import { Patient } from '../../../../core/models/care/patient.model';

@Component({
  selector: 'app-risk-assessment',
  standalone: true,
  imports: [CommonModule, RouterLink, NzIconModule, FormsModule],
  template: `
    <div class="h-screen flex flex-col bg-gray-50">
      <!-- Header -->
      <div class="bg-white p-6 border-b border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-200">
            <nz-icon nzType="line-chart" class="text-xl" />
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-900 tracking-tight">AI Risk Intelligence</h2>
            <p class="text-xs text-gray-500 font-medium uppercase tracking-wider">Predictive Cognitive Monitoring</p>
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="flex bg-gray-100 p-1 rounded-xl">
             <div class="px-3 py-1 text-xs font-bold text-red-600 bg-white rounded-lg shadow-sm border border-gray-100">
                Live Analysis
             </div>
          </div>
          <button routerLink="/dashboard" 
            class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-all text-sm">
            <nz-icon nzType="arrow-left" /> Dashboard
          </button>
        </div>
      </div>

      <div class="flex-1 flex overflow-hidden">
        <!-- Sidebar: Patient Selection -->
        <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div class="p-4 border-b border-gray-100">
            <div class="relative">
              <nz-icon nzType="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" [(ngModel)]="searchTerm" placeholder="Search patients..."
                class="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-red-100" />
            </div>
          </div>
          
          <div class="flex-1 overflow-y-auto p-2 space-y-1">
            <button *ngFor="let p of filteredPatients" 
              (click)="selectPatient(p)"
              [class]="selectedPatient?.id === p.id ? 'bg-red-50 border-red-100 text-red-700' : 'hover:bg-gray-50 text-gray-600 border-transparent'"
              class="w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left group">
              <div class="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm bg-white border shadow-sm"
                [class]="selectedPatient?.id === p.id ? 'border-red-200 text-red-600' : 'border-gray-100 text-gray-400'">
                {{p.firstName[0]}}{{p.lastName[0]}}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-sm truncate">{{p.firstName}} {{p.lastName}}</p>
                <p class="text-[10px] font-bold uppercase tracking-widest opacity-60">{{p.severity}}</p>
              </div>
              <nz-icon nzType="right" class="text-xs transition-transform" [class.translate-x-1]="selectedPatient?.id === p.id" />
            </button>
            
            <div *ngIf="filteredPatients.length === 0" class="p-8 text-center text-gray-400 italic text-sm">
               No patients found
            </div>
          </div>
        </div>

        <!-- Main Content: Risk History -->
        <div class="flex-1 overflow-y-auto p-8">
          <div *ngIf="selectedPatient; else noSelection" class="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <!-- Selected Patient Header -->
            <div class="flex items-end justify-between">
              <div>
                <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight">
                   {{selectedPatient.firstName}} {{selectedPatient.lastName}}
                </h1>
                <div class="flex items-center gap-2 mt-2">
                   <span class="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest"
                     [class]="getSeverityClass(selectedPatient.severity)">
                     {{selectedPatient.severity}} Status
                   </span>
                   <span class="text-gray-400 text-sm">•</span>
                   <span class="text-gray-500 text-sm font-medium">Patient ID: #{{selectedPatient.id}}</span>
                </div>
              </div>
            </div>

            <!-- Risk Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Cognitive Risk</p>
                  <div class="flex items-baseline gap-2 mt-2">
                     <p class="text-5xl font-black" [class]="getRiskValueClass(latestRisk?.riskValue ?? 0)">
                        {{latestRisk?.riskValue ?? '—'}}%
                     </p>
                     <span *ngIf="latestRisk" class="px-2 py-1 rounded-lg text-[10px] font-black uppercase text-white shadow-sm"
                        [class]="getRiskBadgeClass(latestRisk.riskLevel)">
                        {{latestRisk.riskLevel}}
                     </span>
                  </div>
               </div>

               <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                  <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Trend Analysis</p>
                  <div class="flex items-center gap-3 mt-2">
                     <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" 
                       [class]="getTrendBgClass(latestRisk?.trendDirection, latestRisk?.scoreCount)">
                        {{getTrendArrow(latestRisk?.trendDirection, latestRisk?.scoreCount)}}
                     </div>
                     <div>
                        <p class="font-black text-lg leading-tight uppercase" [class]="getTrendTextClass(latestRisk?.trendDirection, latestRisk?.scoreCount)">
                           {{latestRisk?.scoreCount === 1 ? 'Baseline' : (latestRisk?.trendDirection ?? 'No Data')}}
                        </p>
                        <p class="text-xs text-gray-500 font-medium">Longitudinal comparison</p>
                     </div>
                  </div>
               </div>

               <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                  <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Analysis Confidence</p>
                   <div class="mt-2">
                      <div class="flex justify-between items-end mb-1">
                         <p class="font-bold text-sm text-gray-700">{{(latestRisk?.scoreCount || 0) * 20}}%</p>
                         <p class="text-[10px] text-gray-400 uppercase font-black">Based on {{latestRisk?.scoreCount || 0}}/5 sessions</p>
                      </div>
                      <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                         <div class="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                           [style.width.%]="(latestRisk?.scoreCount || 0) * 20"></div>
                      </div>
                   </div>
               </div>
            </div>

            <!-- History Table -->
            <div class="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
               <div class="p-6 border-b border-gray-50 bg-gray-50/20 flex items-center justify-between">
                  <h3 class="text-xl font-bold text-gray-900">Longitudinal Assessment History</h3>
                  <div class="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400">
                     <nz-icon nzType="history" />
                  </div>
               </div>
               <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">
                        <th class="px-8 py-5">Assessment Date</th>
                        <th class="px-8 py-5">Risk score</th>
                        <th class="px-8 py-5">Level</th>
                        <th class="px-8 py-5">Weighted Avg</th>
                        <th class="px-8 py-5">Trend Direction</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                      <tr *ngFor="let risk of patientRisks" class="hover:bg-gray-50/50 transition-colors group">
                        <td class="px-8 py-6">
                           <div class="flex flex-col">
                             <div class="flex items-center gap-2">
                               <nz-icon nzType="calendar" class="text-indigo-400" />
                               <span class="font-bold text-gray-900">{{risk.generatedAt | date:'mediumDate'}}</span>
                             </div>
                             <div class="flex items-center gap-2 mt-1">
                               <nz-icon nzType="clock-circle" class="text-gray-300" />
                               <span class="text-xs text-gray-500 font-medium">{{risk.generatedAt | date:'HH:mm:ss'}}</span>
                             </div>
                           </div>
                        </td>
                        <td class="px-8 py-6">
                           <span class="font-mono text-xl font-black tracking-tighter" [class]="getRiskValueClass(risk.riskValue)">
                              {{risk.riskValue}}%
                           </span>
                        </td>
                        <td class="px-8 py-6">
                           <span class="px-3 py-1 rounded-xl text-[10px] font-black uppercase text-white shadow-sm"
                              [class]="getRiskBadgeClass(risk.riskLevel)">
                              {{risk.riskLevel}}
                           </span>
                        </td>
                        <td class="px-8 py-6 font-mono text-gray-500 font-bold">
                           {{risk.averageScore ?? '—'}}
                        </td>
                        <td class="px-8 py-6">
                           <div class="flex items-center gap-2">
                             <span class="text-xl" [class]="getTrendTextClass(risk.trendDirection)">{{getTrendArrow(risk.trendDirection)}}</span>
                             <span class="text-xs font-bold uppercase tracking-widest text-gray-400">{{risk.trendDirection || 'INITIAL'}}</span>
                           </div>
                        </td>
                      </tr>
                      <tr *ngIf="patientRisks.length === 0">
                        <td colspan="5" class="px-8 py-20 text-center">
                           <div class="inline-flex flex-col items-center gap-4 text-gray-300">
                              <nz-icon nzType="file-search" class="text-6xl" />
                              <p class="font-bold italic">No risk assessments recorded for this patient.</p>
                              <button class="mt-2 text-xs font-bold text-red-500 uppercase hover:underline">Request new test</button>
                           </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
          
          <ng-template #noSelection>
            <div class="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
               <div class="w-24 h-24 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center text-4xl text-red-100 border border-gray-50">
                  🧬
               </div>
               <div>
                 <h2 class="text-2xl font-black text-gray-900 leading-tight">Clinical Risk Dashboard</h2>
                 <p class="text-gray-400 max-w-xs mx-auto mt-2 font-medium">Please select a patient from the sidebar to view their longitudinal risk analysis.</p>
               </div>
               <div class="flex gap-2">
                  <div class="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                  <div class="w-2 h-2 rounded-full bg-blue-400 animate-pulse [animation-delay:200ms]"></div>
                  <div class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse [animation-delay:400ms]"></div>
               </div>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
    `,
  styles: [`
      :host { display: block; height: 100vh; }
      .animate-in { animation: fadeIn 0.4s ease-out; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    `]
})
export class RiskAssessmentComponent implements OnInit {
  private readonly riskService = inject(RiskScoreService);
  private readonly patientService = inject(PatientService);
  private readonly cdr = inject(ChangeDetectorRef);

  patients: Patient[] = [];
  allRisks: RiskScore[] = [];
  selectedPatient: Patient | null = null;
  patientRisks: RiskScore[] = [];
  latestRisk: RiskScore | null = null;

  searchTerm = '';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // Fetch patients
    this.patientService.getAllPatients().subscribe(data => {
      this.patients = data;
      this.cdr.detectChanges();
    });

    // Fetch all risks
    this.riskService.getAllRisks().subscribe(data => {
      this.allRisks = data;
      // If a patient was already selected, update their history
      if (this.selectedPatient) {
        this.selectPatient(this.selectedPatient);
      }
      this.cdr.detectChanges();
    });
  }

  get filteredPatients(): Patient[] {
    if (!this.searchTerm) return this.patients;
    const q = this.searchTerm.toLowerCase();
    return this.patients.filter(p =>
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q)
    );
  }

  private parseDate(date: any): number {
    if (!date) return 0;
    if (Array.isArray(date)) {
      // Spring LocalDateTime array [year, month, day, hour, min, sec]
      return new Date(date[0], date[1] - 1, date[2], date[3] || 0, date[4] || 0, date[5] || 0).getTime();
    }
    return new Date(date).getTime();
  }

  selectPatient(patient: Patient): void {
    this.selectedPatient = patient;
    this.patientRisks = this.allRisks
      .filter(r => Number(r.patientId) === Number(patient.id))
      .sort((a, b) => this.parseDate(b.generatedAt) - this.parseDate(a.generatedAt));
    this.latestRisk = this.patientRisks.length > 0 ? this.patientRisks[0] : null;
    this.cdr.detectChanges();
  }

  getRiskValueClass(value: number): string {
    if (value > 50) return 'text-red-600';
    if (value > 20) return 'text-amber-600';
    return 'text-green-600';
  }

  getRiskBadgeClass(level?: string): string {
    switch (level?.toUpperCase()) {
      case 'HIGH': return 'bg-red-600';
      case 'MEDIUM': return 'bg-amber-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  }

  getTrendArrow(trend?: string, count?: number): string {
    if (count === 1) return '🏁'; // Start flag for baseline
    switch (trend?.toUpperCase()) {
      case 'IMPROVING': return '📈';
      case 'DECLINING': return '📉';
      case 'STABLE': return '➡️';
      default: return '—';
    }
  }

  getTrendTextClass(trend?: string, count?: number): string {
    if (count === 1) return 'text-indigo-600';
    switch (trend?.toUpperCase()) {
      case 'IMPROVING': return 'text-green-600';
      case 'DECLINING': return 'text-red-700';
      case 'STABLE': return 'text-blue-600';
      default: return 'text-gray-400';
    }
  }

  getTrendBgClass(trend?: string, count?: number): string {
    if (count === 1) return 'bg-indigo-50 text-indigo-600';
    switch (trend?.toUpperCase()) {
      case 'IMPROVING': return 'bg-green-50 text-green-600';
      case 'DECLINING': return 'bg-red-50 text-red-600';
      case 'STABLE': return 'bg-blue-50 text-blue-600';
      default: return 'bg-gray-50 text-gray-400';
    }
  }

  getSeverityClass(severity?: string): string {
    switch (severity?.toUpperCase()) {
      case 'EXTREME': return 'bg-purple-100 text-purple-700';
      case 'HIGH': return 'bg-red-100 text-red-700';
      case 'MEDIUM': return 'bg-amber-100 text-amber-700';
      case 'LOW': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}
