import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RiskScoreService } from '../../../services/risk.service';
import { RiskScore } from '../../../models/risk-score.model';

@Component({
    selector: 'app-risk-list',
    imports: [CommonModule],
    template: `
    <div class="user-container">
      <div class="header">
        <h1>My Risk Assessment History</h1>
        <p class="subtitle">Track your cognitive health risk levels over time</p>
      </div>
      <div class="test-grid">
        @for (risk of risks; track risk) {
          <div class="test-card glass">
            <div class="risk-header">
              <h3>Risk Value: {{risk.riskValue}}</h3>
              <span class="badge" [ngClass]="getRiskClass(risk.riskLevel)">{{risk.riskLevel}}</span>
            </div>
            <p class="date">Generated: {{risk.generatedAt | date:'medium'}}</p>
          </div>
        }
        @if (risks.length === 0) {
          <div class="empty-state glass">
            <p>No risk assessments found. Take a test to generate your first risk assessment.</p>
          </div>
        }
      </div>
    </div>
    `,
    styles: [`
    .risk-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: uppercase;
    }
    .badge-low { background-color: #28a745; color: white; }
    .badge-medium { background-color: #ffc107; color: #333; }
    .badge-high { background-color: #dc3545; color: white; }
    .date { color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem; }
  `]
})
export class RiskListComponent implements OnInit {
  risks: RiskScore[] = [];

  constructor(private riskService: RiskScoreService) { }

  ngOnInit(): void {
    this.loadRisks();
  }

  loadRisks(): void {
    // Load all risks since there is no auth system yet
    this.riskService.getAllRisks().subscribe({
      next: (data) => this.risks = data,
      error: (err) => console.error('Error loading risks', err)
    });
  }

  getRiskClass(level: string): string {
    switch (level?.toLowerCase()) {
      case 'low': return 'badge-low';
      case 'medium': return 'badge-medium';
      case 'high': return 'badge-high';
      default: return 'bg-secondary';
    }
  }
}
