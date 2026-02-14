import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TestResultService } from '../../../services/result.service';
import { TestResult } from '../../../models/test-result.model';

@Component({
    selector: 'app-result-view',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './result-view.component.html',
    styleUrls: ['./result-view.component.css']
})
export class ResultViewComponent implements OnInit {
    result?: TestResult;

    constructor(
        private route: ActivatedRoute,
        private resultService: TestResultService
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadResult(+id);
        }
    }

    loadResult(id: number): void {
        this.resultService.getResultById(id).subscribe(data => {
            this.result = data;
        });
    }

    getScoreClass(): string {
        if (!this.result?.score) return '';
        if (this.result.score >= 70) return 'score-high';
        if (this.result.score >= 40) return 'score-medium';
        return 'score-low';
    }
}
